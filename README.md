# FPL League Analyzer

A simple Fantasy Premier League analyzer that shows standings and insights for your classic league.

Run it

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000), enter your **league ID**, and click **Analyze league**.

## Finding your league ID

1. Go to [fantasy.premierleague.com](https://fantasy.premierleague.com)
2. Open **Leagues & Cups** and select your classic league
3. The league ID is in the URL: `.../leagues/12345/standings` → league ID is **12345**

## What you get

- **Standings** – rank, team name, manager, total points, gameweek points, movement
- **GW-by-GW points** – points per gameweek for each manager
- **Transfer success** – hit cost, net points, number of hits
- **Captaincy success** – your captain picks and points (enter your entry ID)
- **Mini-League Narrator** – AI “Sports Center” style commentary (needs API key below)
- **Transfer Personality** – Knee-Jerker / Diamond Hands / Template Slave (last 5 GW)
- **Differential heatmap** – ownership in your mini-league (green = differential, red = template)
- Full league support (all pages of standings are fetched)

## Deploy as a real website (Render)

1. **Push your code to GitHub** (if you haven’t already).
2. Go to [render.com](https://render.com) and sign up (free).
3. Click **New** → **Web Service**.
4. Connect your GitHub account and select the `fpl-analyzer` repo.
5. Use these settings:
   - **Name:** `fpl-analyzer` (or any name)
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
6. Click **Create Web Service**. Render will build and deploy.
7. When it’s done, you’ll get a URL like `https://fpl-analyzer-xxxx.onrender.com` — that’s your live site.

**Note:** On the free tier the app may “spin down” after 15 minutes of no traffic; the first visit after that can take ~30 seconds to wake up.

## Tech

- **Backend**: Node + Express, proxies FPL’s public API and computes insights
- **Frontend**: Single HTML page, no build step
