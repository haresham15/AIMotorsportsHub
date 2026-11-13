# Apexis v2.0 Production Deployment Guide

This guide outlines the production deployment topology, container orchestration, edge hosting, and kernel-level performance tuning for **Apexis v2.0: High-Frequency Motorsports Telemetry Broker & AI Analytics Engine**.

---

## 1. System Topology & Deployment Strategy

Apexis v2.0 employs a decoupled, multi-tier systems architecture:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CLIENT ACCESS & WEB TIER (Next.js 16 + React 19 + Tailwind v4)      │
│  - Host: Vercel Serverless / Cloudflare Pages / Standalone Docker Container │
│  - Features: Zero-copy SharedArrayBuffer canvas, Systems HUD, AI Chatbot   │
│  - Security: COOP: same-origin, COEP: credentialless                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ WebSocket / WebTransport (Port 8080)
                                       v
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: HIGH-CONCURRENCY GATEWAY (Go 1.23 - apexis-gateway)                 │
│  - Host: Fly.io / AWS ECS / Kubernetes / Docker Container                   │
│  - Features: Adaptive Backpressure, Decimation (500Hz -> 60Hz -> 10Hz),     │
│              Prometheus metrics (:9092/metrics)                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ IPC Ring / Loopback UDP (Port 20778)
                                       v
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: BARE-METAL INGESTION & TSDB CORE (C++20 - apexis-core)              │
│  - Host: Bare-Metal Linux VPS / AWS EC2 c6i / Hetzner Dedicated             │
│  - Features: recvmmsg batching, alignas(64) SPSC Ring, Sub-5ms Anomaly      │
│              Engine, Columnar Gorilla mmap WAL, Prometheus (:9091/metrics)  │
│  - Socket: UDP Port 20777 (64MB SO_RCVBUF)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Option A: Full-Stack Containerized Deployment (Docker Compose)

The fastest and most reproducible way to deploy the entire Apexis v2.0 stack—including C++ core, Go gateway, load generator, Prometheus, Grafana, and Next.js—is using Docker Compose.

### 2.1 Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- 4GB+ RAM and 2+ CPU cores recommended

### 2.2 Launching the Stack
From the project root:

```bash
cd infra
docker compose up --build -d
```

### 2.3 Exposed Ports & Service Endpoints

| Service | Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **`apexis-web`** | `3000` | HTTP | Next.js 16 Web Dashboard & Systems HUD |
| **`apexis-core`** | `20777` | UDP | Raw binary telemetry datagram ingestion |
| **`apexis-core`** | `9091` | HTTP | Core C++ Prometheus metrics endpoint (`/metrics`) |
| **`apexis-gateway`** | `8080` | HTTP/WS | Client WebSocket stream (`/ws/live`) & REST API |
| **`apexis-gateway`** | `9092` | HTTP | Gateway Prometheus metrics endpoint (`/metrics`) |
| **`apexis-sim`** | Internal | UDP | 40-car 500Hz load generator & chaos engine |
| **`prometheus`** | `9090` | HTTP | Time-series scraper (1s interval) |
| **`grafana`** | `3001` | HTTP | SLA Control Room Dashboard (`admin`/`admin`) |

### 2.4 Verifying the Containerized Deployment
```bash
# Check container status
docker compose ps

# Inspect live C++ core ingestion metrics
curl http://localhost:9091/metrics

# Inspect Go gateway health
curl http://localhost:8080/api/metrics

# View Grafana SLA Dashboard
open http://localhost:3001
```

To stop the stack:
```bash
docker compose down
```

---

## 3. Option B: Edge / Serverless Web Deployment (Vercel)

The web tier (`apps/web`) is fully optimized for Vercel deployment. When deployed to Vercel, the application operates in **Hybrid Mode**:
- If `apexis-gateway` is reachable via `NEXT_PUBLIC_GATEWAY_WS_URL`, it consumes live backend streams.
- If the backend is running in private networks or offline, the client seamlessly falls back to high-fidelity Web Workers and synthetic telemetry generation, ensuring **100% portfolio availability**.

### 3.1 Step-by-Step Vercel Deployment

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Apexis v2.0"
   git push origin master
   ```

2. **Import Project to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New Project**.
   - Select your `AIMotorsportsHub` repository.
   - Framework preset: **Next.js** (automatically detected).

3. **Configure Environment Variables**:
   Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API Key (for the Race Engineer chatbot & AI summaries).
   - `NEXT_PUBLIC_GATEWAY_WS_URL`: `wss://your-gateway-domain.com/ws/live` (or leave default for local bridge).

4. **Deploy**:
   - Click **Deploy**. Vercel will install dependencies, compile TypeScript, run the Turbopack build, and provision serverless functions in ~60-90 seconds.

### 3.2 Cross-Origin Isolation Headers for SharedArrayBuffer
Next.js is pre-configured in `next.config.ts` with:
```ts
{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" }
```
This enables zero-copy `SharedArrayBuffer` threading in modern browsers while permitting cross-origin avatar and CDN media loading.

---

## 4. Option C: Bare-Metal & Cloud VPS Ingestion Host (AWS EC2 / Hetzner)

For production deployment sustaining 250,000+ events/sec, `apexis-core` runs directly on a Linux host (e.g. Ubuntu 24.04 LTS on AWS EC2 `c6i.2xlarge` or Hetzner `AX41`).

### 4.1 Operating System & Linux Kernel UDP Tuning
Default Linux network buffers drop packets under high-frequency bursts. Apply these kernel parameters to allocate a 64MB socket buffer:

```bash
# Add to /etc/sysctl.d/99-apexis.conf
sudo tee /etc/sysctl.d/99-apexis.conf <<EOF
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 67108864
net.core.wmem_default = 67108864
net.core.netdev_max_backlog = 10000
EOF

# Reload sysctl
sudo sysctl --system
```

### 4.2 Building Native Binaries on the Host
```bash
# Install GCC-13, Make, and Go 1.23
sudo apt-get update
sudo apt-get install -y build-essential g++-13 git

# Compile C++20 Core & Microbenchmark
cd services/apexis-core
make
sudo cp bin/apexis-core /usr/local/bin/

# Compile Go 1.23 Gateway
cd ../apexis-gateway
go build -o /usr/local/bin/apexis-gateway ./cmd/gateway
```

### 4.3 Systemd Service Configuration

#### `apexis-core.service`
Create `/etc/systemd/system/apexis-core.service`:
```ini
[Unit]
Description=Apexis v2.0 C++20 Telemetry Core & TSDB Engine
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/apexis-core --port 20777 --metrics-port 9091 --data-dir /var/lib/apexis/tsdb
Restart=always
RestartSec=2
LimitMEMLOCK=infinity
CPUAffinity=0-7

[Install]
WantedBy=multi-user.target
```

#### `apexis-gateway.service`
Create `/etc/systemd/system/apexis-gateway.service`:
```ini
[Unit]
Description=Apexis v2.0 Go 1.23 Fan-Out Gateway Broker
After=apexis-core.service

[Service]
Type=simple
User=www-data
ExecStart=/usr/local/bin/apexis-gateway -http-port 8080 -metrics-port 9092 -ipc-addr 127.0.0.1:20778
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo mkdir -p /var/lib/apexis/tsdb
sudo systemctl daemon-reload
sudo systemctl enable --now apexis-core apexis-gateway
```

---

## 5. Option D: Edge Broker on Fly.io

For distributed geographic fan-out with low edge latency:

### 5.1 Deploying the Gateway
```bash
# In services/apexis-gateway
fly launch --name apexis-gateway --dockerfile ../../infra/Dockerfile.gateway
fly deploy
```

---

## 6. Continuous Integration & Deployment (CI/CD)

The GitHub Actions pipeline (`.github/workflows/ci.yml`) automatically executes on every push and pull request to `master` or `main`:

```text
GitHub Push / PR
  ├── web-ci (Ubuntu)
  │    ├── Node 20.x setup & npm ci
  │    ├── npx tsc --noEmit (Zero TypeScript errors)
  │    ├── npm run lint
  │    ├── npm test (47 Vitest unit & integration tests)
  │    └── npm run build (Turbopack production build)
  │
  ├── core-ci (Ubuntu)
  │    ├── GCC-13 C++20 toolchain setup
  │    ├── Compile apexis-core daemon
  │    ├── Execute spsc_bench microbenchmark suite
  │    └── Compile apexis-sim 500Hz load generator
  │
  └── gateway-ci (Ubuntu)
       ├── Go 1.23 toolchain setup
       ├── go mod tidy validation
       └── go build ./cmd/gateway
```

---

## 7. Production Verification & Health-Check Runbook

After deploying, verify all subsystems using this checklist:

### 1. Ingestion Rate & Packet Drops
```bash
# Query Prometheus metric for total ingested datagrams
curl -s http://localhost:9091/metrics | grep apexis_udp_packets_ingested_total

# Verify zero dropped packets
curl -s http://localhost:9091/metrics | grep apexis_udp_packets_dropped_total
```
*Expected: `apexis_udp_packets_dropped_total{reason="ring_full"} 0`.*

### 2. End-to-End Latency Verification
```bash
# Query p50 and p99 ingestion latency
curl -s http://localhost:9091/metrics | grep apexis_ingest_latency_nanoseconds
```
*Expected: `p50 < 350,000 ns` (0.35ms) and `p99 < 2,000,000 ns` (2.00ms).*

### 3. Sub-5ms Anomaly Engine SLA
```bash
curl -s http://localhost:9091/metrics | grep apexis_anomaly_compute_nanoseconds
```
*Expected: All detectors (CUSUM, Welford, ERS, Goertzel) report p99 $< 500\text{ ns}$ ($< 0.5\mu\text{s}$), well below the 5ms SLA.*

### 4. Systems HUD Interactive Test
1. Navigate to the web application at `https://your-domain.com`.
2. Click **"SYSTEMS HUD"** in the top navigation bar.
3. Observe live throughput (e.g. 254,820 msg/sec), p50/p99 latencies, and 8-shard ring buffer watermarks.
4. Click **"Trigger 300k/sec Chaos Spike"** to test 1.5x burst load and verify that p99 latency stays strictly below the 2.0ms SLA line.
