import { generateReplayData } from '@/lib/raceSimulator'
import type { TrackGeometry, DriverInfo } from '@/lib/replayTypes'

self.onmessage = (e: MessageEvent<{ series: string, track: TrackGeometry, driversList: DriverInfo[] }>) => {
  try {
    const { series, track, driversList } = e.data;
    const simData = generateReplayData(series, track, driversList);
    self.postMessage({ type: 'SUCCESS', data: simData });
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message });
  }
}

export {}
