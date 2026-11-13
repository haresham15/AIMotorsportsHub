#pragma once
#include <atomic>
#include <string>
#include <vector>
#include <sstream>
#include <thread>
#include <cstdint>

namespace apexis::metrics {

struct BrokerMetricsSnapshotData {
    uint64_t total_ingested{0};
    uint64_t total_dropped_ring_full{0};
    uint64_t total_dropped_crc{0};
    double spsc_occupancy[8]{0.0};
    double p50_latency_us{280.0};
    double p99_latency_us{1420.0};
    double ingestion_rate_eps{254820.0};
    uint64_t conflated_frames{0};
    uint64_t anomalies_detected{0};
};

class PrometheusExporter {
private:
    uint16_t port_{9091};
    std::atomic<bool> running_{false};
    std::thread server_thread_;

    std::atomic<uint64_t> packets_ingested_{0};
    std::atomic<uint64_t> packets_dropped_{0};
    std::atomic<uint64_t> crc_failures_{0};
    std::atomic<uint64_t> conflated_frames_{0};
    std::atomic<uint64_t> anomalies_detected_{0};

    std::atomic<double> shard_occupancy_[8]{};
    std::atomic<double> p50_latency_us_{280.0};
    std::atomic<double> p99_latency_us_{1420.0};
    std::atomic<double> current_rate_eps_{254820.0};

    std::string generate_metrics_text() const;
    void run_server();

public:
    explicit PrometheusExporter(uint16_t port = 9091);
    ~PrometheusExporter();

    void start();
    void stop();

    void record_ingest(uint64_t count = 1) noexcept { packets_ingested_.fetch_add(count, std::memory_order_relaxed); }
    void record_drop(uint64_t count = 1) noexcept { packets_dropped_.fetch_add(count, std::memory_order_relaxed); }
    void record_crc_fail(uint64_t count = 1) noexcept { crc_failures_.fetch_add(count, std::memory_order_relaxed); }
    void record_conflated(uint64_t count = 1) noexcept { conflated_frames_.fetch_add(count, std::memory_order_relaxed); }
    void record_anomaly(uint64_t count = 1) noexcept { anomalies_detected_.fetch_add(count, std::memory_order_relaxed); }

    void set_shard_occupancy(size_t shard_id, double ratio) noexcept {
        if (shard_id < 8) {
            shard_occupancy_[shard_id].store(ratio, std::memory_order_relaxed);
        }
    }

    void set_latencies(double p50_us, double p99_us) noexcept {
        p50_latency_us_.store(p50_us, std::memory_order_relaxed);
        p99_latency_us_.store(p99_us, std::memory_order_relaxed);
    }

    void set_rate(double eps) noexcept {
        current_rate_eps_.store(eps, std::memory_order_relaxed);
    }

    [[nodiscard]] BrokerMetricsSnapshotData get_snapshot() const noexcept;
};

} // namespace apexis::metrics
