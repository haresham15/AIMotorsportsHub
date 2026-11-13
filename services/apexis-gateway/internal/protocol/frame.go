package protocol

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"hash/crc32"
)

// TelemetryFrame mirrors the 128-byte packed C++ struct
type TelemetryFrame struct {
	MagicAndVersion        uint16     // 0xA260
	SeriesID               uint8      // 1=F1_2026, 2=NASCAR_CUP, 3=FE, 4=GTWC
	CarID                  uint8      // 0..23 F1, 0..39 NASCAR
	SequenceNum            uint64     // Per-car sequence
	TimestampNs            uint64     // Producer monotonic clock in ns
	LapDistanceM           float32    // Circuit spline distance
	WorldPosX              float32    // World X
	WorldPosY              float32    // World Y
	WorldPosZ              float32    // World Z
	VelXQuant              int16      // Velocity X * 100
	VelYQuant              int16      // Velocity Y * 100
	VelZQuant              int16      // Velocity Z * 100
	GLatQuant              int16      // Lateral G * 1000
	GLonQuant              int16      // Longitudinal G * 1000
	GVertQuant             int16      // Vertical G * 1000
	SpeedKph               uint16     // Instantaneous speed
	Rpm                    uint16     // Engine / MGU-K RPM
	ThrottleRaw            uint16     // 0..65535
	BrakeRaw               uint16     // 0..65535
	SteeringRaw            int16      // -32767..32767
	GearAndAero            uint8      // Low 4b: Gear, High 4b: Aero mode
	ErsDeployMode          uint8      // 0=None, 1=Med, 2=Hotlap, 3=Overtake
	ErsBatteryJoules       float32    // 0..4,000,000 J
	MguKHarvestKw          float32    // -350..+350 kW
	FuelRemainingCentikg   uint16     // Fuel in 0.01 kg
	TirePressureCentipsi   [4]uint16  // 0.01 PSI [FL, FR, RL, RR]
	TireSurfaceTempC       [4]uint8   // Celsius [FL, FR, RL, RR]
	TireCarcassTempC       [4]uint8   // Celsius [FL, FR, RL, RR]
	BrakeDiscTempC         [4]uint16  // Celsius [FL, FR, RL, RR]
	TireWearBasisPts       [4]uint16  // 0..10000 bps
	WheelSlipRatioBps      [4]uint16  // Combined slip ratio
	RideHeightFrontMm10    uint16     // 0.1 mm
	RideHeightRearMm10     uint16     // 0.1 mm
	LapNumber              uint16     // Current lap
	SectorIndex            uint8      // 0=S1, 1=S2, 2=S3, 3=PitLane
	Flags                  uint8      // Bitmask
	CRC32C                 uint32     // Checksum
	Reserved               [6]uint8   // Explicit padding
}

const FrameSize = 128

// DecodeFrame decodes a 128-byte raw buffer into TelemetryFrame
func DecodeFrame(data []byte) (*TelemetryFrame, error) {
	if len(data) < FrameSize {
		return nil, fmt.Errorf("insufficient buffer size: %d, expected %d", len(data), FrameSize)
	}

	frame := &TelemetryFrame{}
	buf := bytes.NewReader(data[:FrameSize])

	if err := binary.Read(buf, binary.LittleEndian, frame); err != nil {
		return nil, err
	}

	if frame.MagicAndVersion != 0xA260 {
		return nil, fmt.Errorf("invalid magic 0x%X, expected 0xA260", frame.MagicAndVersion)
	}

	return frame, nil
}

// CastCastagnoliTable for hardware CRC32C matching SSE4.2
var crc32cTable = crc32.MakeTable(crc32.Castagnoli)

// VerifyCRC checks the CRC32C of the frame
func (f *TelemetryFrame) VerifyCRC(raw []byte) bool {
	if len(raw) < 122 {
		return false
	}
	expected := crc32.Checksum(raw[:122], crc32cTable)
	return expected == f.CRC32C
}
