const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://fantasy.premierleague.com/'
};

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 80;
const MAX_ENTRIES_FOR_HISTORY = 50;

let bootstrapCache = null;
let bootstrapCacheTime = 0;
const BOOTSTRAP_TTL_MS = 5 * 60 * 1000;

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

async function getBootstrap() {
  if (bootstrapCache && Date.now() - bootstrapCacheTime < BOOTSTRAP_TTL_MS) return bootstrapCache;
  const { data } = await axios.get(`${FPL_BASE}/bootstrap-static/`, { headers: REQUEST_HEADERS });
  const events = data.events || [];
  const elements = {};
  const elementsOwnership = {};
  (data.elements || []).forEach(el => {
    elements[el.id] = el.web_name || `#${el.id}`;
    elementsOwnership[el.id] = parseFloat(el.selected_by_percent) || 0;
  });
  bootstrapCache = { events, elements, elementsOwnership };
  bootstrapCacheTime = Date.now();
  return bootstrapCache;
}

function lastFinishedGameweek(events) {
  const finished = (events || []).filter(e => e.finished).map(e => e.id);
  return finished.length ? Math.max(...finished) : 0;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchEntryHistory(entryId) {
  const { data } = await axios.get(`${FPL_BASE}/entry/${entryId}/history/`, { headers: REQUEST_HEADERS });
  return data.current || [];
}

async function fetchEntryPicks(entryId, eventId) {
  const { data } = await axios.get(`${FPL_BASE}/entry/${entryId}/event/${eventId}/picks/`, { headers: REQUEST_HEADERS });
  return data;
}

async function fetchElementSummary(elementId) {
  const { data } = await axios.get(`${FPL_BASE}/element-summary/${elementId}/`, { headers: REQUEST_HEADERS });
  return data.history || [];
}

// Fetch all standings pages (FPL returns 50 per page)
async function fetchFullLeagueStandings(leagueId) {
  const results = [];
  let page = 1;
  let hasNext = true;
  let league = null;

  while (hasNext) {
    const url = `${FPL_BASE}/leagues-classic/${leagueId}/standings/?page_standings=${page}`;
    const { data } = await axios.get(url, { headers: REQUEST_HEADERS });
    if (!league) league = data.league;
    results.push(...(data.standings?.results || []));
    hasNext = data.standings?.has_next ?? false;
    page++;
  }

  return { league, results };
}

// Raw league data (for compatibility)
app.get('/api/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { league, results } = await fetchFullLeagueStandings(leagueId);
    res.json({ league, standings: { results }, update_status: {} });
  } catch (error) {
    console.error('League fetch error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch league'
    });
  }
});

// Insights: league + computed stats for the frontend
app.get('/api/insights/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { league, results } = await fetchFullLeagueStandings(leagueId);

    if (!results.length) {
      return res.json({
        league,
        standings: results,
        insights: { error: 'No standings data' }
      });
    }

    const totalPoints = results.map(r => r.total);
    const sum = totalPoints.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / totalPoints.length) * 10) / 10;
    const minPts = Math.min(...totalPoints);
    const maxPts = Math.max(...totalPoints);

    const top = results.slice(0, 5);
    const bottom = results.slice(-5).reverse();

    const movementCounts = results.reduce((acc, r) => {
      const m = r.movement || 'same';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    // GW-by-GW and transfer success: fetch entry history for each manager (batched)
    let gwByGw = [];
    let transferSuccess = [];
    const entryHistories = []; // { entry_id, entry_name, player_name, rank, history }
    const entriesToFetch = results.slice(0, MAX_ENTRIES_FOR_HISTORY);
    for (let i = 0; i < entriesToFetch.length; i += BATCH_SIZE) {
      const batch = entriesToFetch.slice(i, i + BATCH_SIZE);
      const histories = await Promise.all(batch.map(r => fetchEntryHistory(r.id).catch(() => [])));
      for (let j = 0; j < batch.length; j++) {
        const r = batch[j];
        const current = histories[j] || [];
        const gwPoints = current.map(h => ({ event: h.event, points: h.points ?? 0 }));
        let totalHitCost = 0;
        let numHitWeeks = 0;
        current.forEach(h => {
          const cost = h.event_transfers_cost ?? 0;
          if (cost > 0) {
            totalHitCost += cost;
            numHitWeeks += 1;
          }
        });
        gwByGw.push({
          entry_id: r.id,
          entry_name: r.entry_name,
          player_name: r.player_name,
          rank: r.rank,
          gameweeks: gwPoints
        });
        transferSuccess.push({
          entry_id: r.id,
          entry_name: r.entry_name,
          player_name: r.player_name,
          rank: r.rank,
          total: r.total,
          totalHitCost,
          numHitWeeks,
          netPoints: (r.total ?? 0) - totalHitCost
        });
        entryHistories.push({
          entry_id: r.id,
          entry_name: r.entry_name,
          player_name: r.player_name,
          rank: r.rank,
          history: current
        });
      }
      if (i + BATCH_SIZE < entriesToFetch.length) await sleep(BATCH_DELAY_MS);
    }

    // Transfer personality & differentials: need current squad (picks) and bootstrap ownership
    let transferPersonality = [];
    let differentials = [];
    try {
      const bootstrap = await getBootstrap();
      const { events, elementsOwnership } = bootstrap;
      const lastGw = lastFinishedGameweek(events);
      const currentGw = events.find(e => e.is_current)?.id ?? lastGw || 1;
      const leagueSize = entryHistories.length;
      const leagueOwnershipCount = {};
      const managerSquads = [];
      for (let i = 0; i < entryHistories.length; i += BATCH_SIZE) {
        const batch = entryHistories.slice(i, i + BATCH_SIZE);
        const picksData = await Promise.all(batch.map(e => fetchEntryPicks(e.entry_id, currentGw).catch(() => null)));
        for (let j = 0; j < batch.length; j++) {
          const entry = batch[j];
          const picks = picksData[j]?.picks || [];
          const elementIds = picks.map(p => p.element);
          managerSquads.push({ ...entry, elementIds });
          elementIds.forEach(eid => {
            leagueOwnershipCount[eid] = (leagueOwnershipCount[eid] || 0) + 1;
          });
        }
        if (i + BATCH_SIZE < entryHistories.length) await sleep(BATCH_DELAY_MS);
      }
      const bootstrapEl = bootstrap.elements || {};
      for (const m of managerSquads) {
        const history = m.history || [];
        const last5 = history.slice(-5);
        const transfersLast5 = last5.reduce((s, h) => s + (Number(h.event_transfers) || 0), 0);
        const ownerships = (m.elementIds || []).map(eid => elementsOwnership[eid] ?? 0).filter(Boolean);
        const avgOwnership = ownerships.length ? ownerships.reduce((a, b) => a + b, 0) / ownerships.length : 0;
        let personality = 'The Balanced';
        if (transfersLast5 >= 5) personality = 'The Knee-Jerker';
        else if (transfersLast5 <= 1) personality = 'The Diamond Hands';
        else if (avgOwnership > 30) personality = 'The Template Slave';
        transferPersonality.push({
          entry_id: m.entry_id,
          entry_name: m.entry_name,
          player_name: m.player_name,
          rank: m.rank,
          personality,
          transfersLast5,
          avgOwnership: Math.round(avgOwnership * 10) / 10
        });
      }
      const playerIds = Object.keys(leagueOwnershipCount);
      differentials = playerIds.map(eid => {
        const count = leagueOwnershipCount[eid];
        const pct = leagueSize ? Math.round((count / leagueSize) * 1000) / 10 : 0;
        const globalPct = elementsOwnership[eid] ?? 0;
        return {
          element_id: Number(eid),
          web_name: bootstrapEl[eid] || `#${eid}`,
          league_ownership_count: count,
          league_ownership_pct: pct,
          global_ownership_pct: globalPct
        };
      }).sort((a, b) => a.league_ownership_count - b.league_ownership_count);
    } catch (e) {
      console.error('Personality/differentials error:', e.message);
    }

    res.json({
      league,
      standings: results,
      insights: {
        totalManagers: results.length,
        averagePoints: avg,
        highestPoints: maxPts,
        lowestPoints: minPts,
        pointsSpread: maxPts - minPts,
        topFive: top,
        bottomFive: bottom,
        movement: movementCounts
      },
      gwByGw,
      transferSuccess,
      transferPersonality,
      differentials
    });
  } catch (error) {
    console.error('Insights fetch error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch league insights'
    });
  }
});

// Mini-League Narrator: AI Sports Center–style commentary (OpenAI or Gemini)
app.post('/api/narrate', async (req, res) => {
  try {
    const { leagueId } = req.body || {};
    if (!leagueId) {
      return res.status(400).json({ error: 'leagueId required' });
    }
    const { league, results } = await fetchFullLeagueStandings(leagueId);
    if (!results.length) {
      return res.status(400).json({ error: 'No league data' });
    }
    const top = results.slice(0, 3).map(r => ({
      rank: r.rank,
      team: r.entry_name,
      manager: r.player_name,
      total: r.total,
      gwPts: r.event_total
    }));
    const bottom = results.slice(-3).reverse().map(r => ({
      rank: r.rank,
      team: r.entry_name,
      manager: r.player_name,
      total: r.total,
      gwPts: r.event_total
    }));
    const dataBlob = JSON.stringify({ leagueName: league?.name, top, bottom }, null, 0);
    const prompt = `You are a witty Fantasy Premier League commentator. Based on this mini-league data, write exactly 3 short sentences in "Sports Center" style: trash talk the strugglers and hype the leaders. Be funny and specific (use team names). No preamble, no bullet points—just 3 sentences.\n\nData:\n${dataBlob}`;

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'OpenAI error');
      const text = data.choices?.[0]?.message?.content?.trim() || 'No commentary generated.';
      return res.json({ commentary: text });
    }

    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 200 }
          })
        }
      );
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No commentary generated.';
      if (data.error) throw new Error(data.error.message || 'Gemini error');
      return res.json({ commentary: text });
    }

    return res.status(400).json({
      error: 'Set OPENAI_API_KEY or GEMINI_API_KEY in environment to enable AI commentary.'
    });
  } catch (error) {
    console.error('Narrator error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate commentary' });
  }
});

// Captaincy breakdown for one entry (your team)
app.get('/api/entry/:entryId/captaincy', async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const { events, elements } = await getBootstrap();
    const lastGw = lastFinishedGameweek(events);
    if (lastGw < 1) {
      return res.json({ gameweeks: [], avgCaptainPoints: 0, successRate: 0, successThreshold: 6 });
    }
    const gameweeks = [];
    const elementHistoryCache = {};
    for (let gw = 1; gw <= lastGw; gw++) {
      const picksData = await fetchEntryPicks(entryId, gw).catch(() => null);
      if (!picksData || !picksData.picks) continue;
      const captain = picksData.picks.find(p => p.is_captain);
      if (!captain) continue;
      const elementId = captain.element;
      const multiplier = captain.multiplier || 2;
      if (!elementHistoryCache[elementId]) {
        elementHistoryCache[elementId] = await fetchElementSummary(elementId).catch(() => []);
        await sleep(30);
      }
      const history = elementHistoryCache[elementId];
      const gwHistory = history.find(h => Number(h.round) === gw);
      const basePoints = gwHistory ? (gwHistory.total_points ?? 0) : 0;
      const captainPoints = basePoints * multiplier;
      gameweeks.push({
        gw,
        captain_name: elements[elementId] || `#${elementId}`,
        captain_points: captainPoints,
        multiplier
      });
      if (gw < lastGw) await sleep(40);
    }
    const totalCap = gameweeks.reduce((s, g) => s + g.captain_points, 0);
    const avgCaptainPoints = gameweeks.length ? Math.round((totalCap / gameweeks.length) * 10) / 10 : 0;
    const successThreshold = 6;
    const successCount = gameweeks.filter(g => g.captain_points >= successThreshold).length;
    const successRate = gameweeks.length ? Math.round((successCount / gameweeks.length) * 100) : 0;
    res.json({
      entryId,
      gameweeks,
      avgCaptainPoints,
      successRate,
      successThreshold,
      totalCaptainPoints: totalCap
    });
  } catch (error) {
    console.error('Captaincy fetch error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch captaincy'
    });
  }
});

app.listen(PORT, () => {
  console.log(`FPL Analyzer running at http://localhost:${PORT}`);
});
