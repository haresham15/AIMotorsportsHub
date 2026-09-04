'use client'

import { useState, useRef, useEffect, MouseEvent, useCallback } from 'react'
import { createWorker, Worker } from 'tesseract.js'
import { 
  ScanText, 
  StopCircle, 
  RefreshCw, 
  X, 
  Minimize2, 
  Maximize2, 
  Radio, 
  Sliders, 
  AlertCircle 
} from 'lucide-react'

import { CVData } from '@/lib/types'
import { SERIES_DRIVERS, SERIES_MAP } from '@/lib/data'

interface BroadcastScannerProps {
  series?: string
  onScan: (data: CVData[]) => void
  onClose: () => void
}

export interface SeriesOcrProfile {
  id: string
  name: string
  shortLabel: string
  box: { x: number; y: number; w: number; h: number } // percentages 0 - 100
  description: string
}

export const SERIES_OCR_PROFILES: Record<string, SeriesOcrProfile> = {
  'f2': {
    id: 'f2',
    name: 'FIA Formula 2 Tower',
    shortLabel: 'F2 Tower',
    box: { x: 2, y: 12, w: 18, h: 74 },
    description: 'Standard FIA F2 broadcast graphics: left-side vertical timing tower'
  },
  'f3': {
    id: 'f3',
    name: 'FIA Formula 3 Tower',
    shortLabel: 'F3 Tower',
    box: { x: 2, y: 12, w: 18, h: 74 },
    description: 'Standard FIA F3 broadcast graphics: left-side vertical timing tower'
  },
  'formula-e': {
    id: 'formula-e',
    name: 'Formula E E-Prix Tower',
    shortLabel: 'FE Tower',
    box: { x: 2, y: 14, w: 20, h: 70 },
    description: 'Formula E left timing column with attack mode and speed deltas'
  },
  'wec': {
    id: 'wec',
    name: 'FIA WEC Endurance Strip',
    shortLabel: 'WEC Strip',
    box: { x: 2, y: 10, w: 18, h: 78 },
    description: 'Al Kamel endurance graphics: multi-class timing tower on left'
  },
  'gt-world-challenge': {
    id: 'gt-world-challenge',
    name: 'GT World Challenge Tower',
    shortLabel: 'GTWC Tower',
    box: { x: 2, y: 12, w: 18, h: 74 },
    description: 'SRO GT3 / GT4 timing tower on left edge of broadcast'
  },
  'top-fuel': {
    id: 'top-fuel',
    name: 'NHRA Top Fuel ET Trap',
    shortLabel: 'NHRA Bottom Bar',
    box: { x: 10, y: 74, w: 80, h: 20 },
    description: 'NHRA drag pass graphics: bottom strip showing ET and MPH'
  },
  'top-ticker': {
    id: 'top-ticker',
    name: 'Horizontal Top Ticker',
    shortLabel: 'Top Ticker',
    box: { x: 4, y: 3, w: 92, h: 12 },
    description: 'Horizontal running ticker along the top of screen'
  },
  'custom': {
    id: 'custom',
    name: 'Custom Bounding Box',
    shortLabel: 'Custom Draw',
    box: { x: 4, y: 12, w: 22, h: 74 },
    description: 'Manual click-and-drag box anywhere on the video'
  }
}

export default function BroadcastScanner({ series = 'f2', onScan, onClose }: BroadcastScannerProps) {
  const initialProfileKey = SERIES_OCR_PROFILES[series] ? series : 'f2'
  const [selectedProfile, setSelectedProfile] = useState<string>(initialProfileKey)
  const [isDocked, setIsDocked] = useState(false)

  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  
  // Bounding box state (in container pixel coordinates)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [lastScanResults, setLastScanResults] = useState<CVData[]>([])
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const seriesInfo = SERIES_MAP[series]

  // Initialize persistent worker
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const worker = await createWorker('eng')
        if (active) {
          workerRef.current = worker
        } else {
          await worker.terminate()
        }
      } catch (error) {
        console.error('[BroadcastScanner] Failed to initialize OCR worker:', error)
      }
    })();
    return () => {
      active = false
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  // Apply a profile box based on current container dimensions
  const applyProfile = useCallback((profileKey: string) => {
    setSelectedProfile(profileKey)
    const container = videoContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const prof = SERIES_OCR_PROFILES[profileKey] || SERIES_OCR_PROFILES['f2']
    setCropBox({
      x: Math.round((prof.box.x / 100) * rect.width),
      y: Math.round((prof.box.y / 100) * rect.height),
      w: Math.round((prof.box.w / 100) * rect.width),
      h: Math.round((prof.box.h / 100) * rect.height),
    })
  }, [])

  // Start Screen Capture
  const startCapture = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      setStream(displayStream)
      streamRef.current = displayStream
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream
        videoRef.current.play()
      }
      setIsCapturing(true)

      // Apply initial profile bounding box as soon as video loads
      setTimeout(() => {
        applyProfile(selectedProfile)
      }, 500)
    } catch (err) {
      console.error('[BroadcastScanner] Failed to capture screen:', err)
    }
  }

  // Stop Screen Capture
  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setStream(null)
    streamRef.current = null
    setIsCapturing(false)
    stopScanning()
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  // Drawing the bounding box
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!isCapturing) return
    const rect = e.currentTarget.getBoundingClientRect()
    setStartX(e.clientX - rect.left)
    setStartY(e.clientY - rect.top)
    setIsDrawing(true)
    setCropBox(null)
    setSelectedProfile('custom')
    stopScanning()
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    
    setCropBox({
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      w: Math.abs(currentX - startX),
      h: Math.abs(currentY - startY)
    })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  // Roster-aware OCR text parsing
  const parseOcrText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const results: CVData[] = []
    
    // Known driver roster for this series to eliminate OCR noise
    const driversList = (series && SERIES_DRIVERS[series]) ? SERIES_DRIVERS[series] : []
    const knownCodes = new Set(driversList.map(d => d.code.toUpperCase()))
    
    const surnameToCode = new Map<string, string>()
    driversList.forEach(d => {
      const parts = d.name.split(' ')
      const surname = parts[parts.length - 1].toUpperCase()
      if (surname.length >= 3) {
        surnameToCode.set(surname, d.code)
      }
    })

    let posCount = 1
    for (const line of lines) {
      let matchedCode: string | null = null
      let matchedGap = ''

      // 1. Look for known 3-letter driver code
      const tokens = line.split(/[\s,\-_|/:]+/)
      for (const token of tokens) {
        const clean = token.toUpperCase().replace(/[^A-Z]/g, '')
        if (clean.length === 3 && knownCodes.has(clean)) {
          matchedCode = clean
          break
        }
      }

      // 2. Look for known surname
      if (!matchedCode) {
        for (const [surname, code] of surnameToCode.entries()) {
          if (line.toUpperCase().includes(surname)) {
            matchedCode = code
            break
          }
        }
      }

      // 3. Fallback to generic 3-letter uppercase token
      if (!matchedCode) {
        for (const token of tokens) {
          const clean = token.toUpperCase().replace(/[^A-Z]/g, '')
          if (clean.length === 3 && !['THE', 'FOR', 'AND', 'CAR', 'LAP', 'GAP', 'SEC', 'INT', 'PIT', 'OUT', 'TOP', 'DRS'].includes(clean)) {
            matchedCode = clean
            break
          }
        }
      }

      // Gap / Timing extraction
      const gapMatch = line.match(/(?:\+?\d+\.\d{1,3}s?|\bINTERVAL\b|\bLEADER\b|\bPIT\b|\bOUT\b|\bFIN\b)/i)
      if (gapMatch) {
        matchedGap = gapMatch[0].toUpperCase()
      } else {
        matchedGap = posCount === 1 ? 'Interval' : `+${((posCount - 1) * 0.42).toFixed(3)}s`
      }

      // Position extraction
      const posMatch = line.match(/^(?:P)?(\d{1,2})\b/i)
      const position = posMatch ? parseInt(posMatch[1], 10) : posCount

      if (matchedCode && !results.some(r => r.driver_id === matchedCode)) {
        results.push({
          driver_id: matchedCode,
          position,
          gap_to_leader: matchedGap
        })
        posCount++
      }
    }

    // Sort by position
    results.sort((a, b) => a.position - b.position)

    if (results.length > 0) {
      onScan(results)
      setLastScanResults(results)
      setScanCount(c => c + 1)
      setLastScanTime(new Date())
    }
  }

  // Scanning loop
  const startScanning = () => {
    if (!cropBox || !videoRef.current || scanIntervalRef.current) return
    setIsScanning(true)

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current
      if (!video) return
      if (!video.videoWidth || !video.videoHeight) return

      const domRect = video.getBoundingClientRect()
      if (!domRect.width || !domRect.height) return
      const scaleX = video.videoWidth / domRect.width
      const scaleY = video.videoHeight / domRect.height

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(cropBox.w * scaleX))
      canvas.height = Math.max(1, Math.round(cropBox.h * scaleY))
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        video,
        cropBox.x * scaleX,
        cropBox.y * scaleY,
        cropBox.w * scaleX,
        cropBox.h * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      const dataUrl = canvas.toDataURL('image/png')
      try {
        if (!workerRef.current) return
        const { data: { text } } = await workerRef.current.recognize(dataUrl)
        parseOcrText(text)
      } catch (err) {
        console.error('[BroadcastScanner] OCR Error:', err)
      }
    }, 5000)
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DOCKED PIT-WALL WIDGET (MINIMIZED VIEW)
  // ═══════════════════════════════════════════════════════════════════
  if (isDocked) {
    return (
      <div className="fixed bottom-6 left-6 z-[100] bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-2xl p-3 w-80 font-mono select-none">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-[var(--flag-green)] shadow-[0_0_6px_var(--flag-green)] animate-pulse' : 'bg-[var(--amber-pit)]'}`} />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              {isScanning ? 'CV Live Sync Active' : 'Scanner Paused'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDocked(false)}
              title="Expand to Full Console"
              className="p-1 hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={() => {
                stopCapture()
                onClose()
              }}
              title="Disconnect Scanner"
              className="p-1 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[var(--text-secondary)] space-y-1 mb-2.5">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Series:</span>
            <span className="text-white font-bold uppercase">{seriesInfo?.name || series}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Synced Drivers:</span>
            <span className="text-[var(--amber-pit)] font-bold">{lastScanResults.length} drivers</span>
          </div>
          {lastScanTime && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Last Scan:</span>
              <span className="text-white">{lastScanTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsDocked(false)}
            className="flex-1 py-1 px-2 text-[10px] uppercase font-bold bg-[var(--surface-elevated)] hover:bg-[var(--surface-pressed)] text-white border border-[var(--border-hairline)] transition-colors cursor-pointer text-center"
          >
            Expand Console
          </button>
          {isScanning ? (
            <button
              onClick={stopScanning}
              className="py-1 px-2.5 text-[10px] uppercase font-bold bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 transition-colors cursor-pointer"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={startScanning}
              className="py-1 px-2.5 text-[10px] uppercase font-bold bg-[var(--flag-green)]/20 hover:bg-[var(--flag-green)]/30 text-[var(--flag-green)] border border-[var(--flag-green)]/40 transition-colors cursor-pointer"
            >
              Resume
            </button>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // FULL CONSOLE OVERLAY (EXPANDED VIEW)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-[2px]">
      <div 
        className="console-panel bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Console Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-hairline)] bg-[var(--surface-elevated)]">
          <div className="flex items-center gap-2.5">
            <Radio size={16} className="text-[var(--amber-pit)] animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white m-0 flex items-center gap-2">
              <span>Universal Broadcast OCR Engine</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-black/40 text-[var(--amber-pit)] border border-[var(--amber-pit)]/30">
                {seriesInfo?.shortName || series.toUpperCase()}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {isCapturing && (
              <button
                onClick={() => setIsDocked(true)}
                title="Dock to Bottom Pit-Wall"
                className="p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-pressed)] border border-transparent hover:border-[var(--border-hairline)] transition-colors cursor-pointer"
              >
                <Minimize2 size={15} />
              </button>
            )}
            <button
              onClick={() => {
                stopCapture()
                onClose()
              }}
              title="Close Scanner"
              className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="text-[12px] text-[var(--text-secondary)] flex items-start gap-2 bg-[var(--surface-elevated)]/60 p-3 border border-[var(--border-hairline)]">
            <AlertCircle size={15} className="text-[var(--amber-pit)] shrink-0 mt-0.5" />
            <span>
              Screen share your live race broadcast. Choose a pre-calibrated Series Profile or drag a custom bounding box around the timing tower to inject telemetry into the physics engine.
            </span>
          </div>

          {/* Series Profile Selector Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1.5">
                <Sliders size={12} />
                Select Leaderboard Layout Profile
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {SERIES_OCR_PROFILES[selectedProfile]?.description}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(SERIES_OCR_PROFILES).map(([key, prof]) => (
                <button
                  key={key}
                  onClick={() => applyProfile(key)}
                  className={`py-1.5 px-2 text-[11px] font-mono text-left transition-colors cursor-pointer border ${
                    selectedProfile === key
                      ? 'bg-[var(--surface-elevated)] text-[var(--amber-pit)] border-[var(--amber-pit)] font-bold'
                      : 'bg-[var(--surface-console)] text-[var(--text-secondary)] hover:text-white border-[var(--border-hairline)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <div className="truncate">{prof.shortLabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Video Stream & Crop Box Workspace */}
          {!isCapturing ? (
            <div className="border border-dashed border-[var(--border-hairline)] bg-black/40 p-8 text-center flex flex-col items-center justify-center gap-3">
              <ScanText size={32} className="text-[var(--text-muted)] opacity-60" />
              <div className="text-xs text-[var(--text-secondary)] max-w-sm">
                Connect your live stream window or tab. The OCR engine processes frames client-side with zero server latency.
              </div>
              <button 
                onClick={startCapture}
                className="btn-primary py-2 px-5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer mt-1" 
              >
                <ScanText size={15} /> 
                Start Screen Capture
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div 
                ref={videoContainerRef}
                className="relative w-full bg-black border border-[var(--border-hairline)] overflow-hidden cursor-crosshair select-none"
                style={{ aspectRatio: '16/9' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-contain block pointer-events-none" 
                  muted 
                  playsInline 
                />
                
                {cropBox && (
                  <div 
                    className="absolute border-2 border-dashed border-[var(--amber-pit)] bg-[var(--amber-pit)]/15 pointer-events-none"
                    style={{
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.w,
                      height: cropBox.h,
                    }} 
                  >
                    <div className="absolute top-0 left-0 bg-[var(--amber-pit)] text-black font-mono font-bold text-[9px] px-1 py-0.2 uppercase">
                      {SERIES_OCR_PROFILES[selectedProfile]?.shortLabel || 'Scan Target'}
                    </div>
                  </div>
                )}
                
                {!cropBox && !isDrawing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/80 border border-[var(--border-hairline)] px-3 py-1.5 text-white font-mono text-xs">
                      Click and drag over the leaderboard or pick a profile above
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {cropBox && !isScanning && (
                  <button 
                    onClick={startScanning} 
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <RefreshCw size={14} /> 
                    Start OCR Sync (5s Loop)
                  </button>
                )}
                {isScanning && (
                  <button 
                    onClick={stopScanning} 
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/50 transition-colors cursor-pointer"
                  >
                    <StopCircle size={14} /> 
                    Pause Scanning
                  </button>
                )}
                <button 
                  onClick={() => setIsDocked(true)} 
                  className="btn-ghost flex items-center gap-1.5 py-2 px-3 text-xs font-mono text-[var(--text-secondary)] hover:text-white"
                >
                  <Minimize2 size={14} />
                  Dock to Corner
                </button>
                <button 
                  onClick={stopCapture} 
                  className="btn-ghost py-2 px-3 text-xs font-mono text-red-400 hover:bg-red-500/10"
                >
                  Disconnect Stream
                </button>
              </div>

              {/* Live Status & Extracted Drivers Preview */}
              {isScanning && (
                <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border-hairline)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-[var(--flag-green)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--flag-green)] shadow-[0_0_6px_var(--flag-green)] animate-pulse" />
                      <span>Processing frames every 5s • Scan #{scanCount}</span>
                    </div>
                    {lastScanTime && (
                      <span className="text-[var(--text-muted)]">
                        Synced: {lastScanResults.length} drivers
                      </span>
                    )}
                  </div>

                  {lastScanResults.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border-hairline)]">
                      {lastScanResults.slice(0, 10).map((d) => (
                        <div 
                          key={d.driver_id} 
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 border border-[var(--border-hairline)] text-[10px] font-mono"
                        >
                          <span className="text-[var(--text-muted)]">P{d.position}</span>
                          <span className="text-white font-bold">{d.driver_id}</span>
                          <span className="text-[var(--amber-pit)] text-[9px]">{d.gap_to_leader}</span>
                        </div>
                      ))}
                      {lastScanResults.length > 10 && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">
                          +{lastScanResults.length - 10} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
