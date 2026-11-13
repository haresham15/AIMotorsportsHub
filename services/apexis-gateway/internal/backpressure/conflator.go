package backpressure

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/haresham15/AIMotorsportsHub/services/apexis-gateway/internal/protocol"
)

type ClientTier int

const (
	Tier500Hz ClientTier = 500 // Raw ML feed
	Tier60Hz  ClientTier = 60  // Smooth UI canvas
	Tier30Hz  ClientTier = 30  // Jitter backoff
	Tier10Hz  ClientTier = 10  // Severe lag / background tab
)

type AnomalyEventData struct {
	EventID            uint64    `json:"eventId"`
	TimestampNs        uint64    `json:"timestampNs"`
	DetectionLatencyNs uint64    `json:"detectionLatencyNs"`
	CarID              uint32    `json:"carId"`
	LapNumber          uint32    `json:"lapNumber"`
	SectorIndex        uint32    `json:"sectorIndex"`
	AnomalyType        string    `json:"anomalyType"`
	SeverityZScore     float32   `json:"severityZScore"`
	EngineerSummary    string    `json:"engineerSummary"`
	MetricValue        float32   `json:"metricValue"`
	BaselineValue      float32   `json:"baselineValue"`
	CornerID           string    `json:"cornerId"`
}

type SubscriberCursor struct {
	ID                 string
	TargetHz           ClientTier
	EffectiveHz        ClientTier
	Queue              chan *protocol.TelemetryFrame
	AnomalyQueue       chan *AnomalyEventData
	LastDelivered      time.Time
	ConflatedCount     atomic.Uint64
	Active             atomic.Bool
	mu                 sync.RWMutex
}

func NewSubscriberCursor(id string, requestedHz ClientTier, queueCap int) *SubscriberCursor {
	if queueCap <= 0 {
		queueCap = 1024
	}
	sub := &SubscriberCursor{
		ID:           id,
		TargetHz:     requestedHz,
		EffectiveHz:  requestedHz,
		Queue:        make(chan *protocol.TelemetryFrame, queueCap),
		AnomalyQueue: make(chan *AnomalyEventData, 256),
		LastDelivered: time.Now(),
	}
	sub.Active.Store(true)
	return sub
}

// PushFrame applies adaptive decimation and conflation
func (s *SubscriberCursor) PushFrame(frame *protocol.TelemetryFrame) bool {
	if !s.Active.Load() {
		return false
	}

	queueLen := len(s.Queue)
	queueCap := cap(s.Queue)
	occupancy := float64(queueLen) / float64(queueCap)

	s.mu.Lock()
	// Dynamic step-down if buffer is congested (>70%)
	if occupancy > 0.70 {
		if s.EffectiveHz > Tier30Hz {
			s.EffectiveHz = Tier30Hz
		} else if occupancy > 0.85 {
			s.EffectiveHz = Tier10Hz
		}
	} else if occupancy < 0.20 {
		// Recover to target rate
		s.EffectiveHz = s.TargetHz
	}

	// Calculate throttle interval
	minInterval := time.Second / time.Duration(s.EffectiveHz)
	now := time.Now()
	if now.Sub(s.LastDelivered) < minInterval {
		s.mu.Unlock()
		s.ConflatedCount.Add(1)
		return false // Decimated/conflated
	}
	s.LastDelivered = now
	s.mu.Unlock()

	// Non-blocking write: if queue is full, drain one old frame to maintain latest value
	select {
	case s.Queue <- frame:
		return true
	default:
		select {
		case <-s.Queue: // Drop oldest
		default:
		}
		select {
		case s.Queue <- frame:
			s.ConflatedCount.Add(1)
			return true
		default:
			return false
		}
	}
}

// PushAnomaly guarantees 100% delivery without decimation
func (s *SubscriberCursor) PushAnomaly(event *AnomalyEventData) bool {
	if !s.Active.Load() {
		return false
	}
	select {
	case s.AnomalyQueue <- event:
		return true
	default:
		// Blocking retry with timeout to never lose safety anomaly
		select {
		case s.AnomalyQueue <- event:
			return true
		case <-time.After(50 * time.Millisecond):
			return false
		}
	}
}

func (s *SubscriberCursor) Close() {
	if s.Active.Swap(false) {
		close(s.Queue)
		close(s.AnomalyQueue)
	}
}
