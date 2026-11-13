CXX ?= g++
CXXFLAGS = -std=c++20 -O3 -msse4.2 -pthread -Wall -Wextra -I./include -I./src
LDFLAGS = -pthread

SRCS = src/main.cpp src/udp_ingest_server.cpp src/stream_processor_worker.cpp src/prometheus_exporter.cpp
BENCH_SRCS = benchmarks/spsc_vs_mutex_bench.cpp

TARGET = bin/apexis-core
BENCH_TARGET = bin/spsc_bench

all: $(TARGET) $(BENCH_TARGET)

bin:
	mkdir -p bin

$(TARGET): $(SRCS) | bin
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET) $(LDFLAGS)

$(BENCH_TARGET): $(BENCH_SRCS) | bin
	$(CXX) $(CXXFLAGS) $(BENCH_SRCS) -o $(BENCH_TARGET) $(LDFLAGS)

clean:
	rm -rf bin
