#include <iostream>
#include <vector>
#include <memory>
#include <csignal>
#include <chrono>
#include <iomanip>
#include "protocol/telemetry_frame.hpp"
#include "concurrency/spsc_ring_buffer.hpp"
#include "stream/anomaly_engine.hpp"
#include "storage/mmap_tsdb.hpp"
#include "prometheus_exporter.hpp"
#include "udp_ingest_server.hpp"
#include "stream_processor_worker.hpp"

static std::atomic<bool> g_shutdown_requested{false};

void signal_handler(int sig) {
    std::cout << "\n[apexis-core] Signal " << sig << " received. Initiating graceful shutdown...\n";
    g_shutdown_requested.store(true);
}

int main(int argc, char* argv[]) {
    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);

    std::cout << "=================================================================\n";
    std::cout << "  Apexis v2.0 - High-Frequency Motorsports Telemetry Broker      \n";
    std::cout << "  Bare-Metal C++20 Core & Stream Engine (Target: 250k+ msg/s)    \n";
    std::cout << "=================================================================\n";

    uint16_t udp_port = 20777;
    uint16_t prometheus_port = 9091;
    std::string tsdb_dir = "./data/tsdb";

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--port" && i + 1 < argc) udp_port = static_cast<uint16_t>(std::stoi(argv[++i]));
        else if (arg == "--metrics-port" && i + 1 < argc) prometheus_port = static_cast<uint16_t>(std::stoi(argv[++i]));
        else if (arg == "--data-dir" && i + 1 < argc) tsdb_dir = argv[++i];
    }

    // 1. Initialize Prometheus Exporter
    std::cout << "[Init] Starting Prometheus Exporter on :" << prometheus_port << "/metrics\n";
    apexis::metrics::PrometheusExporter metrics(prometheus_port);
    metrics.start();

    // 2. Initialize Memory-Mapped TSDB
    std::cout << "[Init] Initializing Memory-Mapped Columnar WAL in " << tsdb_dir << "\n";
    apexis::storage::MmapTimeSeriesDB tsdb(tsdb_dir);

    // 3. Initialize 8 Cache-Line-Aligned SPSC Ring Buffers
    std::cout << "[Init] Allocating " << apexis::net::kNumWorkers << " x "
              << apexis::net::kRingCapacity << "-slot SPSC Ring Buffers (Total: "
              << (apexis::net::kNumWorkers * apexis::net::kRingCapacity * sizeof(apexis::protocol::TelemetryFrame)) / (1024 * 1024)
              << " MB RAM)\n";

    std::vector<std::unique_ptr<apexis::net::ShardRingBuffer>> worker_rings;
    worker_rings.reserve(apexis::net::kNumWorkers);
    for (size_t i = 0; i < apexis::net::kNumWorkers; ++i) {
        worker_rings.push_back(std::make_unique<apexis::net::ShardRingBuffer>());
    }

    // 4. Initialize Stream Processor Workers
    std::vector<std::unique_ptr<apexis::stream::StreamProcessorWorker>> workers;
    workers.reserve(apexis::net::kNumWorkers);
    for (size_t i = 0; i < apexis::net::kNumWorkers; ++i) {
        workers.push_back(std::make_unique<apexis::stream::StreamProcessorWorker>(
            i,
            *worker_rings[i],
            tsdb,
            metrics,
            [](const apexis::stream::AnomalyRecord& rec) {
                std::cout << "[ALERT - CAR #" << rec.car_id << " LAP " << rec.lap_number
                          << " S" << rec.sector_index + 1 << "]: " << rec.engineer_summary
                          << " (Latency: " << rec.detection_latency_ns / 1000.0 << "us)\n";
            }
        ));
        workers.back()->start();
    }

    // 5. Initialize UDP Ingestion Server
    std::cout << "[Init] Binding UDP Socket on port " << udp_port << " (SO_RCVBUF = 64MB)\n";
    apexis::net::UdpIngestServer ingest_server(udp_port, worker_rings, metrics);
    ingest_server.start();

    std::cout << "[Ready] Ingestion Engine is LIVE. Awaiting 500Hz UDP telemetry datagrams...\n";
    std::cout << "-----------------------------------------------------------------\n";

    // Monitoring heartbeat loop
    auto last_tick = std::chrono::steady_clock::now();
    uint64_t last_packets = 0;

    while (!g_shutdown_requested.load()) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        const auto now = std::chrono::steady_clock::now();
        const double elapsed_sec = std::chrono::duration<double>(now - last_tick).count();
        last_tick = now;

        const auto snapshot = metrics.get_snapshot();
        const uint64_t current_packets = snapshot.total_ingested;
        const double rate_eps = (current_packets >= last_packets) ? ((current_packets - last_packets) / elapsed_sec) : 0.0;
        last_packets = current_packets;

        if (rate_eps > 0.0) {
            metrics.set_rate(rate_eps);
        }

        std::cout << std::fixed << std::setprecision(1)
                  << "[Metrics] Rate: " << std::setw(8) << snapshot.ingestion_rate_eps << " eps | "
                  << "p50: " << std::setw(5) << snapshot.p50_latency_us << "us | "
                  << "p99: " << std::setw(6) << snapshot.p99_latency_us << "us | "
                  << "Drops: " << snapshot.total_dropped_ring_full << " | "
                  << "TSDB: " << (tsdb.total_frames_written() * sizeof(apexis::protocol::TelemetryFrame)) / (1024 * 1024) << " MB\n";
    }

    std::cout << "[apexis-core] Stopping components...\n";
    ingest_server.stop();
    for (auto& w : workers) w->stop();
    metrics.stop();

    std::cout << "[apexis-core] Graceful shutdown complete.\n";
    return 0;
}
