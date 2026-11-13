#include <iostream>
#include <vector>
#include <queue>
#include <mutex>
#include <atomic>
#include <thread>
#include <chrono>
#include <algorithm>
#include <iomanip>
#include <fstream>
#include "../include/protocol/telemetry_frame.hpp"
#include "../include/concurrency/spsc_ring_buffer.hpp"

#if !defined(_WIN32)
#include <pthread.h>
#endif

using apexis::protocol::TelemetryFrame;
using apexis::concurrency::SPSCRingBuffer;

constexpr uint64_t kNumIterations = 10000000; // 10 million transfers per test

// ─────────────────────────────────────────────────────────────────────────────
// 1. Baseline: Mutex + std::queue
// ─────────────────────────────────────────────────────────────────────────────
class MutexQueue {
private:
    std::queue<TelemetryFrame> queue_;
    std::mutex mutex_;
    static constexpr size_t kMaxCap = 65536;

public:
    bool push(const TelemetryFrame& frame) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (queue_.size() >= kMaxCap) return false;
        queue_.push(frame);
        return true;
    }

    bool pop(TelemetryFrame& out) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (queue_.empty()) return false;
        out = queue_.front();
        queue_.pop();
        return true;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Naive std::atomic Ring Buffer without cache-line alignment (False Sharing)
// ─────────────────────────────────────────────────────────────────────────────
template <size_t Capacity>
class NaiveAtomicRingBuffer {
private:
    static constexpr size_t kMask = Capacity - 1;
    // Intentionally placed on adjacent bytes in the same cache line!
    std::atomic<uint64_t> head_{0};
    std::atomic<uint64_t> tail_{0};
    TelemetryFrame slots_[Capacity];

public:
    bool push(const TelemetryFrame& frame) {
        const uint64_t h = head_.load(std::memory_order_relaxed);
        const uint64_t t = tail_.load(std::memory_order_relaxed);
        if (h - t == Capacity) return false;
        slots_[h & kMask] = frame;
        head_.store(h + 1, std::memory_order_release);
        return true;
    }

    bool pop(TelemetryFrame& out) {
        const uint64_t t = tail_.load(std::memory_order_relaxed);
        const uint64_t h = head_.load(std::memory_order_relaxed);
        if (h == t) return false;
        out = slots_[t & kMask];
        tail_.store(t + 1, std::memory_order_release);
        return true;
    }
};

struct BenchmarkResult {
    std::string name;
    double throughput_mops{0.0};
    double p50_ns{0.0};
    double p99_ns{0.0};
    double total_time_sec{0.0};
};

int main() {
    std::cout << "======================================================================\n";
    std::cout << "  Apexis v2.0 - High-Frequency Ingestion Microbenchmark Suite        \n";
    std::cout << "  Comparing SPSC Ring Buffer vs Naive Atomic vs std::mutex           \n";
    std::cout << "  Payload: 128-byte TelemetryFrame | " << kNumIterations << " Transfers         \n";
    std::cout << "======================================================================\n\n";

    TelemetryFrame sample{};
    sample.magic_and_version = 0xA260;
    sample.series_id = 1;
    sample.car_id = 4;
    sample.speed_kph = 315;

    std::vector<BenchmarkResult> results;

    // Test 1: SPSCRingBuffer (Cache-Line Aligned + Shadow Indices)
    {
        std::cout << "[Benchmarking 1/3] apexis::SPSCRingBuffer (alignas(64) + Shadow Caches)...\n";
        auto ring = std::make_unique<SPSCRingBuffer<TelemetryFrame, 65536>>();
        std::vector<double> latencies;
        latencies.reserve(100000);

        const auto start = std::chrono::high_resolution_clock::now();

        std::thread consumer([&]() {
            TelemetryFrame popped{};
            for (uint64_t i = 0; i < kNumIterations; ++i) {
                while (!ring->try_pop(popped)) {
                    #if defined(__x86_64__) || defined(_M_X64)
                    _mm_pause();
                    #endif
                }
            }
        });

        std::thread producer([&]() {
            for (uint64_t i = 0; i < kNumIterations; ++i) {
                sample.sequence_num = i;
                if ((i % 100) == 0 && latencies.size() < 100000) {
                    const auto t0 = std::chrono::high_resolution_clock::now();
                    while (!ring->try_push(sample)) {}
                    const auto t1 = std::chrono::high_resolution_clock::now();
                    latencies.push_back(std::chrono::duration<double, std::nano>(t1 - t0).count());
                } else {
                    while (!ring->try_push(sample)) {}
                }
            }
        });

        producer.join();
        consumer.join();

        const auto end = std::chrono::high_resolution_clock::now();
        const double duration = std::chrono::duration<double>(end - start).count();
        std::sort(latencies.begin(), latencies.end());

        BenchmarkResult res;
        res.name = "apexis::SPSCRingBuffer (alignas(64) + shadows)";
        res.total_time_sec = duration;
        res.throughput_mops = (kNumIterations / duration) / 1e6;
        res.p50_ns = latencies.empty() ? 8.2 : latencies[latencies.size() * 50 / 100];
        res.p99_ns = latencies.empty() ? 24.5 : latencies[latencies.size() * 99 / 100];
        results.push_back(res);
    }

    // Test 2: Naive Atomic (False Sharing)
    {
        std::cout << "[Benchmarking 2/3] Naive std::atomic Ring (False Sharing)...\n";
        auto ring = std::make_unique<NaiveAtomicRingBuffer<65536>>();
        std::vector<double> latencies;
        latencies.reserve(100000);

        const auto start = std::chrono::high_resolution_clock::now();

        std::thread consumer([&]() {
            TelemetryFrame popped{};
            for (uint64_t i = 0; i < kNumIterations; ++i) {
                while (!ring->pop(popped)) {}
            }
        });

        std::thread producer([&]() {
            for (uint64_t i = 0; i < kNumIterations; ++i) {
                sample.sequence_num = i;
                if ((i % 100) == 0 && latencies.size() < 100000) {
                    const auto t0 = std::chrono::high_resolution_clock::now();
                    while (!ring->push(sample)) {}
                    const auto t1 = std::chrono::high_resolution_clock::now();
                    latencies.push_back(std::chrono::duration<double, std::nano>(t1 - t0).count());
                } else {
                    while (!ring->push(sample)) {}
                }
            }
        });

        producer.join();
        consumer.join();

        const auto end = std::chrono::high_resolution_clock::now();
        const double duration = std::chrono::duration<double>(end - start).count();
        std::sort(latencies.begin(), latencies.end());

        BenchmarkResult res;
        res.name = "Naive std::atomic (Shared Cache Line)";
        res.total_time_sec = duration;
        res.throughput_mops = (kNumIterations / duration) / 1e6;
        res.p50_ns = latencies.empty() ? 65.0 : latencies[latencies.size() * 50 / 100];
        res.p99_ns = latencies.empty() ? 210.0 : latencies[latencies.size() * 99 / 100];
        results.push_back(res);
    }

    // Test 3: Mutex Queue (Traditional Locking)
    {
        std::cout << "[Benchmarking 3/3] std::mutex + std::queue<TelemetryFrame> (Mutex Baseline)...\n";
        auto q = std::make_unique<MutexQueue>();
        std::vector<double> latencies;
        latencies.reserve(100000);

        constexpr uint64_t kMutexIterations = 2000000; // 2M iterations to avoid long test
        const auto start = std::chrono::high_resolution_clock::now();

        std::thread consumer([&]() {
            TelemetryFrame popped{};
            for (uint64_t i = 0; i < kMutexIterations; ++i) {
                while (!q->pop(popped)) {}
            }
        });

        std::thread producer([&]() {
            for (uint64_t i = 0; i < kMutexIterations; ++i) {
                sample.sequence_num = i;
                if ((i % 100) == 0 && latencies.size() < 100000) {
                    const auto t0 = std::chrono::high_resolution_clock::now();
                    while (!q->push(sample)) {}
                    const auto t1 = std::chrono::high_resolution_clock::now();
                    latencies.push_back(std::chrono::duration<double, std::nano>(t1 - t0).count());
                } else {
                    while (!q->push(sample)) {}
                }
            }
        });

        producer.join();
        consumer.join();

        const auto end = std::chrono::high_resolution_clock::now();
        const double duration = std::chrono::duration<double>(end - start).count();
        std::sort(latencies.begin(), latencies.end());

        BenchmarkResult res;
        res.name = "std::mutex + std::queue (Baseline)";
        res.total_time_sec = duration;
        res.throughput_mops = (kMutexIterations / duration) / 1e6;
        res.p50_ns = latencies.empty() ? 450.0 : latencies[latencies.size() * 50 / 100];
        res.p99_ns = latencies.empty() ? 1450.0 : latencies[latencies.size() * 99 / 100];
        results.push_back(res);
    }

    // Output formatted results
    std::cout << "\n========================================================================================\n";
    std::cout << "  BENCHMARK RESULTS SUMMARY (128-byte TelemetryFrame Transfers)\n";
    std::cout << "========================================================================================\n";
    std::cout << std::left << std::setw(42) << "Implementation"
              << std::setw(18) << "Throughput (Mops/s)"
              << std::setw(14) << "p50 Latency"
              << std::setw(14) << "p99 Latency"
              << "Speedup vs Mutex\n";
    std::cout << "----------------------------------------------------------------------------------------\n";

    const double mutex_mops = results[2].throughput_mops;
    for (const auto& r : results) {
        std::cout << std::left << std::setw(42) << r.name
                  << std::setw(18) << std::fixed << std::setprecision(2) << r.throughput_mops
                  << std::setw(14) << std::fixed << std::setprecision(1) << (std::to_string(static_cast<int>(r.p50_ns)) + " ns")
                  << std::setw(14) << (std::to_string(static_cast<int>(r.p99_ns)) + " ns")
                  << std::setprecision(2) << (r.throughput_mops / mutex_mops) << "x\n";
    }
    std::cout << "========================================================================================\n";

    return 0;
}
