#include "udp_ingest_server.hpp"
#include <iostream>
#include <cstring>
#include <chrono>

#if defined(_WIN32)
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <pthread.h>
#endif

namespace apexis::net {

UdpIngestServer::UdpIngestServer(
    uint16_t port,
    std::vector<std::unique_ptr<ShardRingBuffer>>& worker_rings,
    metrics::PrometheusExporter& metrics
)
    : port_(port)
    , worker_rings_(worker_rings)
    , metrics_(metrics)
{}

UdpIngestServer::~UdpIngestServer() {
    stop();
}

void UdpIngestServer::start() {
    if (running_.exchange(true)) return;
    ingest_thread_ = std::thread(&UdpIngestServer::run_ingest_loop, this);
}

void UdpIngestServer::stop() {
    if (!running_.exchange(false)) return;

    // Send a wake-up packet locally
#if defined(_WIN32)
    SOCKET s = socket(AF_INET, SOCK_DGRAM, 0);
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port_);
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    char dummy = 0;
    sendto(s, &dummy, 1, 0, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
    closesocket(s);
#else
    int s = socket(AF_INET, SOCK_DGRAM, 0);
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port_);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    char dummy = 0;
    sendto(s, &dummy, 1, 0, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
    close(s);
#endif

    if (ingest_thread_.joinable()) {
        ingest_thread_.join();
    }
}

void UdpIngestServer::run_ingest_loop() {
#if !defined(_WIN32)
    // Pin UDP ingest thread to Core 0 for minimum interrupt jitter
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(0, &cpuset);
    pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
#endif

#if defined(_WIN32)
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
    SOCKET sockfd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sockfd == INVALID_SOCKET) return;

    // 64 MB kernel socket buffer
    int rcvbuf = 64 * 1024 * 1024;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, reinterpret_cast<const char*>(&rcvbuf), sizeof(rcvbuf));

    sockaddr_in servaddr{};
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = INADDR_ANY;
    servaddr.sin_port = htons(port_);

    if (bind(sockfd, reinterpret_cast<sockaddr*>(&servaddr), sizeof(servaddr)) != 0) {
        closesocket(sockfd);
        return;
    }

    // Set receive timeout so thread can exit cleanly
    DWORD timeout = 250;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, reinterpret_cast<const char*>(&timeout), sizeof(timeout));

    protocol::TelemetryFrame frame;
    while (running_.load(std::memory_order_relaxed)) {
        sockaddr_in clientaddr{};
        int clientlen = sizeof(clientaddr);
        const int bytes = recvfrom(sockfd, reinterpret_cast<char*>(&frame), sizeof(frame), 0,
                                   reinterpret_cast<sockaddr*>(&clientaddr), &clientlen);

        if (bytes == static_cast<int>(sizeof(protocol::TelemetryFrame))) {
            if (frame.magic_and_version != 0xA260) {
                metrics_.record_crc_fail();
                continue;
            }

            // Route deterministically by car_id % NUM_WORKERS
            const size_t shard = frame.car_id % kNumWorkers;
            if (!worker_rings_[shard]->try_push(frame)) {
                metrics_.record_drop();
            } else {
                metrics_.record_ingest();
                total_packets_++;
            }
        }
    }

    closesocket(sockfd);
    WSACleanup();
#else
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) return;

    // 64 MB SO_RCVBUF
    int rcvbuf = 64 * 1024 * 1024;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, &rcvbuf, sizeof(rcvbuf));

    sockaddr_in servaddr{};
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = INADDR_ANY;
    servaddr.sin_port = htons(port_);

    if (bind(sockfd, reinterpret_cast<sockaddr*>(&servaddr), sizeof(servaddr)) < 0) {
        close(sockfd);
        return;
    }

    // Use recvmmsg for 64-datagram batching per syscall
    constexpr int kBatchSize = 64;
    protocol::TelemetryFrame frames[kBatchSize];
    struct mmsghdr msgs[kBatchSize];
    struct iovec iovecs[kBatchSize];
    struct sockaddr_in from[kBatchSize];

    std::memset(msgs, 0, sizeof(msgs));
    for (int i = 0; i < kBatchSize; ++i) {
        iovecs[i].iov_base = &frames[i];
        iovecs[i].iov_len = sizeof(protocol::TelemetryFrame);
        msgs[i].msg_hdr.msg_iov = &iovecs[i];
        msgs[i].msg_hdr.msg_iovlen = 1;
        msgs[i].msg_hdr.msg_name = &from[i];
        msgs[i].msg_hdr.msg_namelen = sizeof(struct sockaddr_in);
    }

    struct timespec timeout;
    timeout.tv_sec = 0;
    timeout.tv_nsec = 100000000; // 100ms

    while (running_.load(std::memory_order_relaxed)) {
        const int nmsgs = recvmmsg(sockfd, msgs, kBatchSize, MSG_WAITFORONE, &timeout);
        if (nmsgs <= 0) continue;

        for (int i = 0; i < nmsgs; ++i) {
            if (msgs[i].msg_len == sizeof(protocol::TelemetryFrame)) {
                const auto& frame = frames[i];
                if (frame.magic_and_version != 0xA260) {
                    metrics_.record_crc_fail();
                    continue;
                }

                // Shard routing: car_id % NUM_WORKERS
                const size_t shard = frame.car_id % kNumWorkers;
                if (!worker_rings_[shard]->try_push(frame)) {
                    metrics_.record_drop();
                } else {
                    metrics_.record_ingest();
                    total_packets_++;
                }
            }
        }
    }

    close(sockfd);
#endif
}

} // namespace apexis::net
