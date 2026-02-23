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

- **Standings table** – rank, team name, manager, total points, gameweek points, movement
- **Insights** – number of managers, average points, highest/lowest points, points spread
- Full league support (all pages of standings are fetched)

## Tech

- **Backend**: Node + Express, proxies FPL’s public API and computes insights
- **Frontend**: Single HTML page, no build step
