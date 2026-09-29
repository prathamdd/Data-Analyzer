# FPL Analyzer

A full-stack, data-driven Fantasy Premier League analytics platform designed to evaluate tactical decision-making, squad risk, and manager behavior beyond basic point totals. Built with a focus on low-latency data aggregation, stateless cloud architecture, and automated delivery.

---

## Overview

Official FPL tools prioritize descriptive, lagging metrics (points scored, current rank). FPL Analyzer provides diagnostic and behavioral analytics by evaluating decision quality, risk exposure, and opportunity cost across gameweeks.

The application features a categorized single-page interface powered by a lightweight, client-side view toggle to minimize cognitive overload and eliminate unnecessary page reloads.

---

## Core Analytics & Metrics

* **Captaincy Efficiency:** Evaluates how close a manager came to optimal armband selection by calculating the ratio of the chosen captain's score against the highest-scoring starter in the XI.
* **Differential Heatmap:** Visualizes squad risk by indexing the average ownership percentage (`selected_by_percent`) of the starting XI against template thresholds.
* **Transfer Personality:** Classifies manager decision tendencies (e.g., Maverick vs. Surgeon) based on hit frequency and the average ownership profile of transfers-in.
* **Transfer Success (Net Swing):** Measures immediate gameweek ROI on player swaps by comparing the performance of transfers-in against outgoing players, factored against transfer point deductions.
* **Gameweek-by-Gameweek Trajectory:** Evaluates season rank volatility and performance consistency over time rather than simple cumulative points.

---

## Technical Architecture

```text
[FPL Endpoints] 
       │ (Raw JSON Payloads)
       ▼
[Node.js / Express Backend]
       ├── In-Memory Caching Layer (TTL / Stasis Shields)
       ├── Data Transformation & Aggregation Pipeline
       └── REST API Endpoints
       │
       ▼ (Sanitized DTOs)
[Frontend Client]
       ├── Single-Page Navigation & DOM Controller
       └── Chart.js Visualizations

```

### Backend & Data Pipeline

* **Node.js & Express:** Implements non-blocking, asynchronous I/O to fetch, join, and process data from multiple upstream FPL endpoints (`/bootstrap-static`, `/entry/{id}`, `/entry/{id}/transfers`) concurrently.
* **In-Memory Caching:** Stores static gameweek and player payloads in server memory. This eliminates redundant multi-megabyte external fetches, protects outbound IP limits against upstream 429 rate limits, and reduces data delivery latency to single-digit milliseconds.
* **Stateless Operations:** Operates without a persistent database layer for the MVP, performing in-memory array manipulation ($O(n)$ data reshaping) to guarantee low operational complexity and zero database maintenance costs.

### Frontend

* **Vanilla JavaScript & Tailwind CSS:** Built without heavy SPA framework overhead, ensuring minimal bundle sizes and instant Time-to-Interactive (TTI).
* **Chart.js Integration:** Renders performant, responsive time-series trajectories, heatmaps, and distribution curves directly from flattened API responses.

---

## Infrastructure & CI/CD

* **Hosting:** Microsoft Azure App Service (Linux, Node.js 20 runtime, West US 3 region).
* **Continuous Integration & Continuous Deployment:** Fully automated GitHub Actions workflow triggered on direct pushes to `main`.
* **Credential Architecture:** Zero-trust credential isolation using GitHub Encrypted Secrets coupled with Azure App Service Publish Profiles.

---

## Tech Stack Summary

* **Frontend:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS, Chart.js
* **Backend:** Node.js, Express.js
* **Cloud & Infrastructure:** Microsoft Azure App Service
* **CI/CD & DevOps:** GitHub Actions, Git
* **Data Source:** Official Fantasy Premier League REST API

---

## Local Development Setup

### Prerequisites

* Node.js (v18.x or v20.x recommended)
* npm (v9.x or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/prathamdd/Data-Analyzer.git
cd Data-Analyzer

```


2. Install dependencies:
```bash
npm install

```


3. Start the application:
```bash
npm start

```


4. Access the local environment:
```text
http://localhost:3000

```
