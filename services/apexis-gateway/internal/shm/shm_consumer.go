package shm

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/haresham15/AIMotorsportsHub/services/apexis-gateway/internal/protocol"
)

type FrameConsumer interface {
	Consume(ctx context.Context, handler func(frame *protocol.TelemetryFrame)) error
}

// UdpIpcConsumer listens on the IPC loopback socket from apexis-core
type UdpIpcConsumer struct {
	listenAddr string
}

func NewUdpIpcConsumer(addr string) *UdpIpcConsumer {
	if addr == "" {
		addr = "127.0.0.1:20778"
	}
	return &UdpIpcConsumer{listenAddr: addr}
}

func (c *UdpIpcConsumer) Consume(ctx context.Context, handler func(frame *protocol.TelemetryFrame)) error {
	addr, err := net.ResolveUDPAddr("udp", c.listenAddr)
	if err != nil {
		return fmt.Errorf("resolve error: %w", err)
	}

	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return fmt.Errorf("listen error: %w", err)
	}
	defer conn.Close()

	// 16MB socket buffer
	_ = conn.SetReadBuffer(16 * 1024 * 1024)

	buf := make([]byte, protocol.FrameSize*16)
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		_ = conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
		n, _, err := conn.ReadFrom(buf)
		if err != nil {
			if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
				continue
			}
			continue
		}

		for offset := 0; offset+protocol.FrameSize <= n; offset += protocol.FrameSize {
			frame, err := protocol.DecodeFrame(buf[offset : offset+protocol.FrameSize])
			if err == nil && handler != nil {
				handler(frame)
			}
		}
	}
}
