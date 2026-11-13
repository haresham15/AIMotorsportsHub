# Apexis Quick Start Guide

Get Apexis running locally in just a few minutes! You can run the lightweight **Next.js web application** directly, or spin up the **Apexis v2.0 full-stack distributed systems environment** (C++20 Ingestion Engine + Go 1.23 Broker + Prometheus + Grafana).

---

## Path A: Web Application Quickstart (Next.js 16)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create a `.env.local` file in the root directory and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **No Login Required**: Core functionality is 100% accessible to guests.
- **Systems HUD**: Click **"SYSTEMS HUD"** in the top navigation bar to open the live broker telemetry drawer.
- **Sync via Broadcast (Computer Vision)**: Navigate to a non-F1 series and click "Sync via Broadcast" to open the client-side Tesseract.js OCR scanner.
- **Dynamic Race Simulator**: Switch between "Race", "Sprint", and "Qualifying" tabs on the F1 dashboard to view the Web Worker-powered replay engine.
- **AI Race Engineer**: Open the chatbot on any series dashboard to chat with the Gemini-powered race engineer.
- **ML Strategy Predictor**: Explore the interactive TensorFlow.js tire degradation model.

---

## Path B: Full-Stack Systems Deployment (Docker Compose)

To launch the complete Apexis v2.0 bare-metal C++20 core, Go 1.23 gateway, 250k+ msg/s load generator, Prometheus, Grafana, and Next.js web application:

```bash
cd infra
docker compose up --build -d
```

### Endpoints
- **Next.js Web App & Systems HUD**: [http://localhost:3000](http://localhost:3000)
- **Go 1.23 Gateway WebSocket Stream**: `ws://localhost:8080/ws/live`
- **Gateway Metrics**: [http://localhost:8080/api/metrics](http://localhost:8080/api/metrics)
- **C++ Core Prometheus Endpoint**: [http://localhost:9091/metrics](http://localhost:9091/metrics)
- **Prometheus Scraper**: [http://localhost:9090](http://localhost:9090)
- **Grafana SLA Control Room**: [http://localhost:3001](http://localhost:3001) (`admin` / `admin`)

---

## Path C: Local Native Systems Build

```bash
# 1. Compile C++20 Core & Microbenchmark (Linux / WSL)
cd services/apexis-core
make
./bin/apexis-core

# 2. Run the SPSC Ring Buffer Microbenchmark Suite
./bin/spsc_bench

# 3. Launch Go 1.23 Gateway
cd ../apexis-gateway
go run ./cmd/gateway

# 4. Launch 250,000+ msg/s UDP Load Generator
cd ../apexis-sim
make
./bin/apexis-sim --cars 40 --threads 4

# 5. Launch Next.js Web App
npm run dev
```

---

## Production Deployment

For detailed production instructions across Vercel, Docker Compose, Linux bare-metal hosts with 64MB `SO_RCVBUF` kernel tuning, and GitHub Actions CI/CD, see [DEPLOYMENT.md](./DEPLOYMENT.md).
