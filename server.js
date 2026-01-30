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

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

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
      }
    });
  } catch (error) {
    console.error('Insights fetch error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to fetch league insights'
    });
  }
});

app.listen(PORT, () => {
  console.log(`FPL Analyzer running at http://localhost:${PORT}`);
});
