# FPL Analyzer: Fantasy Premier League Analytics

A full-stack predictive analytics dashboard that provides deep-dive scout reports for FPL managers. Built for the dual purpose of dominating mini-leagues and exploring cloud-native architecture.

**Live Site:** [https://fpl-analyzer-fef3b0g7gqf6akcm.westus3-01.azurewebsites.net/](https://fpl-analyzer-fef3b0g7gqf6akcm.westus3-01.azurewebsites.net/)

---

## Tech Stack & Architecture
* **Frontend:** Vanilla JavaScript / Tailwind CSS (Responsive Dashboard)
* **Backend:** Node.js / Express.js
* **Infrastructure:** Microsoft Azure App Service (West US 3)
* **CI/CD:** GitHub Actions with Automated Secret Management

## Key Features
* **AI Scout Reports:** Automated analysis of manager transfer history and risk profiles.
* **Form Heuristics:** Custom-built logic to calculate player "Expected Points" based on current FPL API data.
* **Automated Pipeline:** Fully automated deployment pipeline ensures 99.9% consistency between local development and production.

## Product Management Highlights
* **Resource Optimization:** Navigated regional cloud quota constraints by migrating workloads across global data centers (US/EU).
* **Security First:** Implemented a zero-trust credential model using GitHub Secrets and Azure Publish Profiles.
* **MVP Strategy:** Prioritized a stateless, high-availability launch to validate core analytical features before scaling the data plane.
