# AI Log Analyzer: System Architecture

This document explains the event-driven lifecycle of a log message as it moves through the microservices pipeline.

## 1. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Dashboard / Simulator
    participant LS as Log Service
    participant DB as PostgreSQL (Prisma)
    participant K as Kafka (Event Bus)
    participant AS as Anomaly Service
    participant TS as Ticket Service
    participant AIS as AI Service
    participant OL as Ollama (AI Model)
    participant WSG as WebSocket Gateway
    participant FE as Frontend Dashboard

    User->>LS: HTTP POST /logs (Level: CRITICAL)
    LS->>DB: Save Log Entry
    LS->>K: Publish to [logs]
    
    K->>AS: Consume from [logs]
    AS->>AS: Detect Anomaly (Level check)
    AS->>K: Publish to [anomalies]
    
    K->>TS: Consume from [anomalies]
    TS->>DB: Create Ticket
    TS->>K: Publish to [tickets]
    
    K->>AIS: Consume from [tickets]
    AIS->>OL: Request Diagnosis (Prompt)
    OL-->>AIS: Return JSON (Cause, Fix, Commands)
    AIS->>DB: Save Resolution
    AIS->>K: Publish to [resolutions]
    
    Note over WSG,FE: Real-time Updates
    K->>WSG: Listen to [logs, anomalies, tickets, resolutions]
    WSG-->>FE: Socket.io Broadcast (Real-time UI Update)
    FE->>FE: Update Dashboard Panels
```

## 2. Component Breakdown

### **Event Backbone** (Kafka)
The central nervous system of the project. Every microservice is decoupled; they only care about specific topics they subscribe to.

### **Intelligence Layer** (Ollama + AI Service)
The **AI Service** is the "brain." It doesn't just store data; it interprets the "CRITICAL" message, correlates it with the service name, and uses the `qwen2.5` model to generate actionable SRE commands.

### **Real-time Layer** (WebSocket Gateway)
Ensures that the user doesn't have to refresh. It bridges the backend Kafka events directly to the browser's `Socket.io` client.

### **Data Persistence** (PostgreSQL)
Prisma ORM handles all database interactions. Every state (Log -> Anomaly -> Ticket -> Resolution) is permanently recorded for audit and historical analysis.
