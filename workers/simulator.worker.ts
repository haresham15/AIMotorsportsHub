import { generateReplayData, type ReplaySessionMeta } from '@/lib/raceSimulator'
import type { TrackGeometry, DriverInfo } from '@/lib/replayTypes'

self.onmessage = (e: MessageEvent<{ series: string, track: TrackGeometry, driversList: DriverInfo[], sessionType?: string, sessionMeta?: ReplaySessionMeta }>) => {
  try {
    const { series, track, driversList, sessionType, sessionMeta } = e.data;
    const simData = generateReplayData(series, track, driversList, sessionType, sessionMeta);
    self.postMessage({ type: 'SUCCESS', data: simData });
  } catch (err: unknown) {
    self.postMessage({ type: 'ERROR', error: err instanceof Error ? err.message : String(err) });
  }
}

export {}
