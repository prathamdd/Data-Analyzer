This project is a full-stack web application designed to provide deeper analytical insights into FPL mini-leagues than the official interface allows. It features automated "Scout Reports," rank progress visualizations, and AI-generated sports commentary based on live league standings.

Technical Stack
Backend: Node.js, Express.js

Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3 (Modern Grid/Flexbox)

Data Visualization: Chart.js

API Integration: Fantasy Premier League (FPL) REST API

AI Engine: Google Gemini 2.0 Flash

Deployment: Render (CI/CD via GitHub)

Engineering Highlights
Asynchronous Data Ingestion: Implemented a batched, asynchronous retry-logic system to handle FPL API synchronization delays and rate-limiting.

Predictive Form Engine: Developed an algorithm to calculate "Form" by analyzing historical rank data over a 4-week rolling window.

Defensive Programming: Built a robust data-binding layer that maps disparate ID structures (Global Entry IDs vs. Mini-League IDs) and provides fallbacks for stale data points.

UI/UX Micro-interactions: Designed a dark-themed dashboard with "Live" status indicators using CSS keyframe animations and responsive layouts.

Features
Manager Scout Reports: Automated personality tagging (e.g., "The Knee-Jerker," "The Diamond Hands") based on transfer history and ownership percentage.

Rank Progress Chart: Visual tracking of the Top 5 managers' rank history using an inverted Y-axis for intuitive sports data representation.

Differential Heatmap: Visualizes player ownership within the mini-league to identify tactical vulnerabilities.

AI Sports Narrator: Uses LLMs to generate witty, "Sports Center"-style commentary based on current league standings.
