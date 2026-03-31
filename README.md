# AI Log Analyzer & Auto-Resolution System

A production-grade, event-driven microservices system for log analysis, anomaly detection, and AI-powered remediation.

## 🚀 Architecture
- **Event Streaming**: Apache Kafka
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **AI Engine**: Ollama (Local LLM)
- **Monitoring**: Prometheus & Grafana
- **Real-time**: WebSockets (Socket.io)

## 📁 Structure
- `apps/`: Microservices (API Gateway, Log, Anomaly, Ticket, AI, Action, WS)
- `libs/`: Shared libraries (Auth, Kafka, Database, Common)

## 🛠️ Setup
1. **Install Dependencies**: `npm install`
2. **Setup Infrastructure**: `docker-compose up -d`
3. **Pull AI Model**: `docker exec -it ollama ollama pull qwen2.5:7b-instruct`
4. **Database Migration**: `npm run prisma:migrate`
5. **Environment**: Create `.env` (use `.env.example` as template)

## ⚡ Usage
- **Ingest Log**: `POST /logs`
- **WS Updates**: Connect to `ws://localhost:3006`
- **Execute Fix**: `POST /auto-fix/:ticketId`

## 📊 Monitoring
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3007` (Default: admin/admin)
