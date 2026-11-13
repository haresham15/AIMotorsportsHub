#pragma once
#include <atomic>
#include <thread>
#include <vector>
#include <cstdint>
#include <memory>
#include "protocol/telemetry_frame.hpp"
#include "concurrency/spsc_ring_buffer.hpp"
#include "prometheus_exporter.hpp"

namespace apexis::net {

constexpr size_t kRingCapacity = 65536; // Power of 2 (64K slots per shard)
constexpr size_t kNumWorkers = 8;       // 8 shard workers

using ShardRingBuffer = concurrency::SPSCRingBuffer<protocol::TelemetryFrame, kRingCapacity>;

class UdpIngestServer {
private:
    uint16_t port_{20777};
    std::atomic<bool> running_{false};
    std::thread ingest_thread_;

    std::vector<std::unique_ptr<ShardRingBuffer>>& worker_rings_;
    metrics::PrometheusExporter& metrics_;

    uint64_t total_packets_{0};
    uint64_t total_bytes_{0};

    void run_ingest_loop();

public:
    UdpIngestServer(
        uint16_t port,
        std::vector<std::unique_ptr<ShardRingBuffer>>& worker_rings,
        metrics::PrometheusExporter& metrics
    );
    ~UdpIngestServer();

    void start();
    void stop();

    [[nodiscard]] uint64_t total_packets() const noexcept { return total_packets_; }
};

} // namespace apexis::net
