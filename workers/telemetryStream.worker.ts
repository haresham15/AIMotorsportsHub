// High-Frequency Zero-Copy Telemetry Stream Worker
// Decodes binary TelemetryFrame packets directly into a double-buffered SharedArrayBuffer

export interface SharedBufferConfig {
  sharedBuffer: SharedArrayBuffer;
  maxCars: number;
}

const CONTROL_INDEX = 0; // Atomics control slot for active buffer (0 or 1)
const CAR_STRIDE_FLOATS = 8; // [posX, posY, speedKph, yawAngle, lapDist, latG, vertG, slidingEnergy]
const CAR_STRIDE_U16 = 8;    // [tirePresFL, tirePresFR, tireTempFL, tireTempFR, brakeTempFL, brakeTempFR, flags, anomalyCode]

let sharedBuffer: SharedArrayBuffer | null = null;
let controlView: Int32Array | null = null;
let floatViews: [Float32Array, Float32Array] | null = null;
let u16Views: [Uint16Array, Uint16Array] | null = null;

let isStreaming = false;
let streamSocket: WebSocket | null = null;
let simInterval: number | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT_SHARED_BUFFER') {
    sharedBuffer = payload.buffer;
    if (sharedBuffer) {
      controlView = new Int32Array(sharedBuffer, 0, 16);
      
      // Slot 0 starts at offset 64B, Slot 1 starts at offset 32KB
      const slot0ByteOffset = 64;
      const slot1ByteOffset = 32768;
      const slotByteSize = 32704;

      floatViews = [
        new Float32Array(sharedBuffer, slot0ByteOffset, slotByteSize / 4 / 2),
        new Float32Array(sharedBuffer, slot1ByteOffset, slotByteSize / 4 / 2),
      ];

      u16Views = [
        new Uint16Array(sharedBuffer, slot0ByteOffset + 16384, slotByteSize / 2 / 2),
        new Uint16Array(sharedBuffer, slot1ByteOffset + 16384, slotByteSize / 2 / 2),
      ];

      Atomics.store(controlView, CONTROL_INDEX, 0);
      self.postMessage({ type: 'INITIALIZED' });
    }
  } else if (type === 'START_STREAM') {
    startTelemetryStream(payload?.url || 'ws://127.0.0.1:8080/ws/live');
  } else if (type === 'STOP_STREAM') {
    stopTelemetryStream();
  }
};

function writeCarToSlot(
  slot: number,
  carId: number,
  x: number,
  y: number,
  speed: number,
  yaw: number,
  dist: number,
  latG: number,
  vertG: number,
  slidingEnergy: number,
  brakeTemp: number,
  tireTemp: number,
  anomalyCode: number
) {
  if (!floatViews || !u16Views) return;

  const fView = floatViews[slot];
  const uView = u16Views[slot];

  const fOffset = carId * CAR_STRIDE_FLOATS;
  if (fOffset + 7 < fView.length) {
    fView[fOffset] = x;
    fView[fOffset + 1] = y;
    fView[fOffset + 2] = speed;
    fView[fOffset + 3] = yaw;
    fView[fOffset + 4] = dist;
    fView[fOffset + 5] = latG;
    fView[fOffset + 6] = vertG;
    fView[fOffset + 7] = slidingEnergy;
  }

  const uOffset = carId * CAR_STRIDE_U16;
  if (uOffset + 7 < uView.length) {
    uView[uOffset] = Math.min(65535, Math.round(brakeTemp));
    uView[uOffset + 1] = Math.min(65535, Math.round(tireTemp));
    uView[uOffset + 2] = anomalyCode;
  }
}

function startTelemetryStream(url: string) {
  if (isStreaming) return;
  isStreaming = true;

  try {
    streamSocket = new WebSocket(url);
    streamSocket.binaryType = 'arraybuffer';

    streamSocket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        processBinaryBatch(event.data);
      }
    };

    streamSocket.onerror = () => {
      // Graceful fallback to client-side high-frequency generator (60/120Hz)
      startSyntheticFallback();
    };
  } catch (err) {
    startSyntheticFallback();
  }
}

function stopTelemetryStream() {
  isStreaming = false;
  if (streamSocket) {
    streamSocket.close();
    streamSocket = null;
  }
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

function processBinaryBatch(buffer: ArrayBuffer) {
  if (!controlView) return;

  const currentActive = Atomics.load(controlView, CONTROL_INDEX);
  const inactiveSlot = currentActive === 0 ? 1 : 0;

  const dv = new DataView(buffer);
  const frameCount = Math.floor(buffer.byteLength / 128);

  for (let i = 0; i < frameCount; ++i) {
    const off = i * 128;
    const carId = dv.getUint8(off + 3);
    const dist = dv.getFloat32(off + 16, true);
    const x = dv.getFloat32(off + 20, true);
    const y = dv.getFloat32(off + 24, true);
    const speed = dv.getUint16(off + 42, true);
    const brakeTemp = dv.getUint16(off + 72, true);
    const tireTemp = dv.getUint8(off + 64);

    writeCarToSlot(inactiveSlot, carId, x, y, speed, 0, dist, 0, 1.0, 0, brakeTemp, tireTemp, 0);
  }

  // Atomic flip: RaceReplayCanvas immediately sees fresh slot with 0 allocs
  Atomics.store(controlView, CONTROL_INDEX, inactiveSlot);
}

// 60Hz/120Hz high-fidelity local physics generator if backend gateway is detached
function startSyntheticFallback() {
  if (simInterval) return;

  const cars = Array.from({ length: 40 }, (_, i) => ({
    carId: i,
    distance: (7004 / 40) * i,
    speed: 240 + (i % 6) * 15,
    brakeTemp: 480 + (i % 4) * 30,
    tireTemp: 98 + (i % 3) * 4,
    slidingEnergy: 0,
  }));

  simInterval = self.setInterval(() => {
    if (!controlView) return;

    const currentActive = Atomics.load(controlView, CONTROL_INDEX);
    const inactiveSlot = currentActive === 0 ? 1 : 0;
    const dt = 1 / 60;

    for (const car of cars) {
      car.distance = (car.distance + (car.speed / 3.6) * dt) % 7004;
      const frac = car.distance / 7004;
      const x = Math.cos(frac * Math.PI * 2) * 1200;
      const y = Math.sin(frac * Math.PI * 2) * 800;
      const yaw = frac * Math.PI * 2 + Math.PI / 2;

      const isBraking = car.distance > 2600 && car.distance < 2800;
      car.speed = isBraking ? Math.max(90, car.speed - 180 * dt) : Math.min(340, car.speed + 35 * dt);
      car.brakeTemp = isBraking ? car.brakeTemp + 12 : Math.max(420, car.brakeTemp - 2);
      car.slidingEnergy += 0.05;

      writeCarToSlot(
        inactiveSlot,
        car.carId,
        x,
        y,
        car.speed,
        yaw,
        car.distance,
        isBraking ? 0 : 2.5,
        1.0,
        car.slidingEnergy,
        car.brakeTemp,
        car.tireTemp,
        0
      );
    }

    Atomics.store(controlView, CONTROL_INDEX, inactiveSlot);
  }, 1000 / 60);
}
