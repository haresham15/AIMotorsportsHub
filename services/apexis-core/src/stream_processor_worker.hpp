#pragma once
#include <atomic>
#include <thread>
#include <vector>
#include <memory>
#include <functional>
#include "protocol/telemetry_frame.hpp"
#include "concurrency/spsc_ring_buffer.hpp"
#include "stream/anomaly_engine.hpp"
#include "storage/mmap_tsdb.hpp"
#include "prometheus_exporter.hpp"

namespace apexis::stream {

using AnomalyCallback = std::function<void(const AnomalyRecord&)>;

class StreamProcessorWorker {
private:
    size_t shard_id_{0};
    std::atomic<bool> running_{false};
    std::thread worker_thread_;

    concurrency::SPSCRingBuffer<protocol::TelemetryFrame, 65536>& ring_;
    storage::MmapTimeSeriesDB& tsdb_;
    metrics::PrometheusExporter& metrics_;
    AnomalyCallback anomaly_callback_;

    // Per-car state: cars 0..47 supported
    std::vector<CarTelemetryState> car_states_;
    AnomalyDetectorEngine anomaly_engine_;

    void run_worker_loop();

public:
    StreamProcessorWorker(
        size_t shard_id,
        concurrency::SPSCRingBuffer<protocol::TelemetryFrame, 65536>& ring,
        storage::MmapTimeSeriesDB& tsdb,
        metrics::PrometheusExporter& metrics,
        AnomalyCallback anomaly_callback = nullptr
    );
    ~StreamProcessorWorker();

    void start();
    void stop();
};

} // namespace apexis::stream
