#pragma once
#include <atomic>
#include <cstddef>
#include <cstdint>
#include <new>
#include <type_traits>

namespace apexis::concurrency {

template <typename T, std::size_t Capacity>
class SPSCRingBuffer {
    static_assert((Capacity != 0) && ((Capacity & (Capacity - 1)) == 0),
                  "Capacity must be a power of 2 for bitwise modulo masking");
    static_assert(std::is_trivially_copyable_v<T>,
                  "Slot payload T must be trivially copyable for lock-free DMA/SIMD safety");

private:
    static constexpr std::size_t kMask = Capacity - 1;
    static constexpr std::size_t kCacheLineSize = 64;

    // Producer-owned cache line
    alignas(kCacheLineSize) std::atomic<uint64_t> head_{0};
    uint64_t cached_tail_{0}; // Producer-local shadow of consumer tail

    // Consumer-owned cache line
    alignas(kCacheLineSize) std::atomic<uint64_t> tail_{0};
    uint64_t cached_head_{0}; // Consumer-local shadow of producer head

    // Telemetry observability counters (isolated cache line)
    alignas(kCacheLineSize) std::atomic<uint64_t> rejected_drops_{0};
    std::atomic<uint64_t> total_pushed_{0};
    std::atomic<uint64_t> total_popped_{0};

    // Contiguous slot storage aligned to 64-byte boundary
    alignas(kCacheLineSize) T slots_[Capacity];

public:
    SPSCRingBuffer() = default;
    SPSCRingBuffer(const SPSCRingBuffer&) = delete;
    SPSCRingBuffer& operator=(const SPSCRingBuffer&) = delete;

    // Hot-path Producer Push (~5-8 nanoseconds)
    [[nodiscard]] inline bool try_push(const T& item) noexcept {
        const uint64_t current_head = head_.load(std::memory_order_relaxed);

        // Fast check against local shadow tail; only cross cache-line on full appearance
        if (current_head - cached_tail_ == Capacity) {
            cached_tail_ = tail_.load(std::memory_order_acquire);
            if (current_head - cached_tail_ == Capacity) {
                rejected_drops_.fetch_add(1, std::memory_order_relaxed);
                return false; // Reject-Newest policy: count drop, never corrupt in-flight read
            }
        }

        slots_[current_head & kMask] = item;
        head_.store(current_head + 1, std::memory_order_release);
        total_pushed_.fetch_add(1, std::memory_order_relaxed);
        return true;
    }

    // Hot-path Consumer Pop (~5-8 nanoseconds)
    [[nodiscard]] inline bool try_pop(T& out_item) noexcept {
        const uint64_t current_tail = tail_.load(std::memory_order_relaxed);

        // Fast check against local shadow head; only cross cache-line on empty appearance
        if (cached_head_ == current_tail) {
            cached_head_ = head_.load(std::memory_order_acquire);
            if (cached_head_ == current_tail) {
                return false; // Buffer empty
            }
        }

        out_item = slots_[current_tail & kMask];
        tail_.store(current_tail + 1, std::memory_order_release);
        total_popped_.fetch_add(1, std::memory_order_relaxed);
        return true;
    }

    [[nodiscard]] inline uint64_t occupancy() const noexcept {
        const uint64_t h = head_.load(std::memory_order_acquire);
        const uint64_t t = tail_.load(std::memory_order_acquire);
        return (h >= t) ? (h - t) : 0;
    }

    [[nodiscard]] inline double occupancy_ratio() const noexcept {
        return static_cast<double>(occupancy()) / static_cast<double>(Capacity);
    }

    [[nodiscard]] inline uint64_t dropped_count() const noexcept {
        return rejected_drops_.load(std::memory_order_relaxed);
    }

    [[nodiscard]] inline uint64_t total_pushed() const noexcept {
        return total_pushed_.load(std::memory_order_relaxed);
    }

    [[nodiscard]] inline uint64_t total_popped() const noexcept {
        return total_popped_.load(std::memory_order_relaxed);
    }

    [[nodiscard]] static constexpr std::size_t capacity() noexcept {
        return Capacity;
    }
};

} // namespace apexis::concurrency
