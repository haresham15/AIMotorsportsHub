package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/haresham15/AIMotorsportsHub/services/apexis-gateway/internal/grpc"
	"github.com/haresham15/AIMotorsportsHub/services/apexis-gateway/internal/protocol"
	"github.com/haresham15/AIMotorsportsHub/services/apexis-gateway/internal/shm"
)

func main() {
	httpPort := flag.Int("http-port", 8080, "HTTP and WebSocket server port")
	metricsPort := flag.Int("metrics-port", 9092, "Prometheus metrics port")
	ipcAddr := flag.String("ipc-addr", "127.0.0.1:20778", "IPC UDP loopback from apexis-core")
	flag.Parse()

	log.Println("=================================================================")
	log.Println("  Apexis v2.0 - High-Concurrency gRPC & WebSocket Gateway        ")
	log.Println("  Consuming apexis-core & Streaming to Next.js 16 (apps/web)     ")
	log.Println("=================================================================")

	server := grpc.NewGatewayServer()

	// HTTP / WebSocket Router
	mux := http.NewServeMux()
	mux.HandleFunc("/api/metrics", server.HandleMetrics)
	mux.HandleFunc("/api/chaos", server.HandleChaosTrigger)
	mux.HandleFunc("/ws/live", server.HandleWsLive)

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", *httpPort),
		Handler: mux,
	}

	// Prometheus Metrics Router
	metricsMux := http.NewServeMux()
	metricsMux.HandleFunc("/metrics", server.HandlePrometheus)
	metricsServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", *metricsPort),
		Handler: metricsMux,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start IPC consumer from apexis-core
	consumer := shm.NewUdpIpcConsumer(*ipcAddr)
	go func() {
		log.Printf("[Gateway] Listening for core telemetry on %s\n", *ipcAddr)
		if err := consumer.Consume(ctx, func(frame *protocol.TelemetryFrame) {
			server.BroadcastFrame(frame)
		}); err != nil {
			log.Printf("[Gateway] Consumer stopped: %v\n", err)
		}
	}()

	go func() {
		log.Printf("[Gateway] HTTP & WebSocket live on :%d\n", *httpPort)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	go func() {
		log.Printf("[Gateway] Prometheus metrics live on :%d/metrics\n", *metricsPort)
		if err := metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Metrics server error: %v", err)
		}
	}()

	// Graceful shutdown handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("[Gateway] Shutting down...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer shutdownCancel()

	_ = httpServer.Shutdown(shutdownCtx)
	_ = metricsServer.Shutdown(shutdownCtx)
	log.Println("[Gateway] Terminated cleanly.")
}
