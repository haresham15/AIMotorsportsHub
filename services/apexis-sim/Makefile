CXX ?= g++
CXXFLAGS = -std=c++20 -O3 -msse4.2 -pthread -Wall -Wextra -I../apexis-core/include
LDFLAGS = -pthread

SRCS = src/loadgen_main.cpp
TARGET = bin/apexis-sim

all: $(TARGET)

bin:
	mkdir -p bin

$(TARGET): $(SRCS) | bin
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET) $(LDFLAGS)

clean:
	rm -rf bin
