<div align="center">
  <h1>🚀 AI-Powered SRE Control Center & Log Analyzer</h1>
  <p><strong>A production-grade, event-driven microservices architecture for real-time log analysis, anomaly detection, and autonomous AI-driven incident remediation.</strong></p>

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white" alt="Kafka" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
</div>

<br />

## 🌟 Overview

The **AI Log Analyzer** is a highly scalable, event-driven system designed to automate Site Reliability Engineering (SRE) tasks. It ingests logs in real-time, detects anomalies based on configurable thresholds, automatically generates support tickets, uses local LLMs (Ollama) to perform root-cause analysis, and provides a secure, remote execution environment (SSH) to autonomously apply fixes with a human-in-the-loop approval mechanism.

## ✨ Core Features

*   **⚡ Event-Driven Backbone:** Uses Apache Kafka to ensure loose coupling, fault tolerance, and high availability across all 7 microservices.
*   **🧠 Local AI Intelligence:** Integrates with `Ollama` (running `qwen2.5:7b-instruct`) for privacy-first, offline, and intelligent root-cause analysis and mitigation strategies.
*   **🎫 Automated Incident Management:** Auto-generates tickets when anomalies are detected, tracking them through resolution.
*   **🛠️ Autonomous Auto-Fix:** Securely connects via SSH to target servers to execute AI-recommended fixes (commands are strictly verified against a security whitelist).
*   **📊 Real-Time Dashboard:** A cyberpunk-themed, responsive Vanilla JS/HTML frontend visualizing logs, anomalies, AI confidence scores, system health, and a live web terminal using WebSockets.
*   **📈 Full Observability:** Pre-configured with Prometheus and Grafana for monitoring metrics.

---

## 🏗️ Architecture

The system is built using a **Monorepo** structure powered by NestJS and is divided into cohesive, decoupled microservices.

### Microservices (`/apps`)
1.  **`api-gateway`:** The central HTTP entry point (REST) that securely handles auth and routes requests via Kafka.
2.  **`log-service`:** Subscribes to HTTP streams, persists logs to PostgreSQL, and broadcasts them cluster-wide.
3.  **`anomaly-service`:** Uses Redis Sliding Windows to detect spikes in error rates or critical logs.
4.  **`ticket-service`:** Automatically generates and tracks tracking tickets in Postgres for detected anomalies.
5.  **`ai-service`:** Listens for new tickets, chunks the data, and prompts Ollama to determine the root cause and a command-line fix.
6.  **`action-service`:** The execution engine. Executes the AI's shell commands securely over SSH and updates the ticket to `RESOLVED`.
7.  **`websocket-gateway`:** Broadcasts all internal Kafka events (logs, tickets, terminal output) to connected frontend clients in real-time.

### Shared Libraries (`/libs`)
*   **`@app/auth`:** Global JWT authentication guards and decorators.
*   **`@app/common`:** Shared DTOs, Kafka topics, Enums, and Health Checks.
*   **`@app/database`:** Global Prisma Module for PostgreSQL access.
*   **`@app/kafka`:** Custom Kafka Client and Consumer wrappers.

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20+)
*   [Docker](https://www.docker.com/) & Docker Compose
*   [NestJS CLI](https://nestjs.com/) (`npm i -g @nestjs/cli`)

### 1. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/Abhishekyadav7987/AI-Log-Analyzer.git
cd AI-Log-Analyzer
npm install
```

### 2. Environment Setup

Create an environment file:
```bash
cp .env.example .env
```
*(Update `.env` with your desired SSH target if you want it to execute real commands, otherwise it will run in a safe "Mock Mode")*

### 3. Start Infrastructure (Docker)

Spin up Kafka, Zookeeper, PostgreSQL, Redis, Ollama, Prometheus, and Grafana:
```bash
docker-compose up -d
```

### 4. Setup Database & AI Model

Run Prisma migrations to initialize the database schema:
```bash
npm run prisma:migrate
```

Pull the required LLM model into the Ollama container:
```bash
docker exec -it ai-log-analyzer-ollama-1 ollama pull qwen2.5:7b-instruct
```
*(Note: Container name may vary depending on your folder name. Check with `docker ps`)*

### 5. Start the Microservices

You can start all 7 microservices concurrently:
```bash
npm run start:all
```

### 6. Launch the SRE Dashboard

In a new terminal, serve the frontend:
```bash
npm run dashboard
```
Open your browser to `http://localhost:3000` (or the port specified by `serve`).

---

## 💻 Usage

### Simulating a System Crash
1. Open the SRE Dashboard in your browser.
2. Click the **"Simulate Crash"** button. This will send a mock `CRITICAL` log (e.g., *DB_CONN_TIMEOUT: Pool exhausted*).
3. **Observe the flow:**
   - The log appears in the live feed.
   - An Anomaly is detected.
   - A Ticket is generated.
   - The AI Engine engages (brain icon pulsates) and returns a Root Cause and Fix Plan.
4. Click **"APPROVE AUTO-FIX"**.
5. Watch the live terminal execute the SSH commands and see the ticket status transition to `RESOLVED`!

### Metrics & Observability
- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3007` (Default login: `admin` / `admin`)

---

## 🛡️ Security

-   **Command Whitelist:** The `ActionService` has a strict hard-coded whitelist (e.g., `systemctl`, `df`, `docker`, `psql`, `sed`). The AI cannot execute arbitrary or destructive commands outside this list.
-   **JWT Auth:** All external API routes are protected by JWT Bearer tokens.

## 📄 License
This project is licensed under the MIT License.
