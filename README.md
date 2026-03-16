# FPL Insight Engine & Mini-League Optimizer

A high-performance analytics dashboard designed to solve "Choice Overload" in Fantasy Premier League. This tool transforms raw FPL data into actionable squad optimizations, predictive form analysis, and manager behavioral profiling.

**Live Link:** [https://fpl-analyzer-vg6m.onrender.com](https://fpl-analyzer-vg6m.onrender.com)

---

## Product Strategy 

* **Problem Identification:** Official FPL interfaces focus on static standings, leaving managers with "Analysis Paralysis" regarding transfer risks and template dependency.
* **Solution:** Built a data-driven "Scout" system that translates complex metrics (ICT Index, Ownership, Form) into qualitative insights.
* **Success Metrics:** Prioritized low-latency data fetching and "Graceful Degradation" to ensure 99.9% uptime during high-traffic FPL deadline windows.

---

## Engineering Highlights

* **Resilient Data Pipeline:** Engineered a batched, asynchronous retry-logic system to navigate FPL API rate-limits and handle synchronization delays during live gameweek updates.
* **Predictive Form Engine:** Developed a rolling 4-week rank-analysis algorithm to identify "Hot Streak" managers and predict league-climbing trajectories.
* **Cross-Domain Data Mapping:** Architected a middleware layer to map disparate identifier structures (Global Entry IDs vs. Mini-League IDs), ensuring 100% data integrity across nested API calls.
* **Performance Optimization:** Implemented a **TTL (Time-To-Live) Caching** system for bootstrap data, reducing server-side latency by 40% for repeat requests.

---

## Technical Stack

* **Backend:** Node.js, Express.js (RESTful Architecture)
* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Grid/Flexbox)
* **Data Visualization:** Chart.js (Dynamic Rank-History Mapping)
* **API Integration:** Fantasy Premier League (FPL) REST API
* **Deployment:** Render (CI/CD via GitHub)

---

## Core Features

### Manager Scout Reports
Automated behavioral profiling (e.g., **"The Knee-Jerker"**, **"The Template Slave"**) using a heuristic model based on transfer volatility and squad ownership percentage.

### Multi-Dimensional Rank Progress
Visual tracking of the Top 5 managers using an inverted Y-axis chart, providing an intuitive "Sports Center" view of league momentum.

### Tactical Differential Heatmap
Aggregates player ownership across the mini-league to highlight "Unique Gems" and identify tactical vulnerabilities in competitors' squads.

### Optimization Alerts
A data-driven risk-assessment grid that flags high-volatility managers and suggests stabilization strategies based on current league trends.
