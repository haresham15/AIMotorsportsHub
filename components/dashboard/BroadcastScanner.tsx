'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { createWorker, Worker } from 'tesseract.js'
import { ScanText, StopCircle, RefreshCw, X } from 'lucide-react'

import { CVData } from '@/lib/types'

interface BroadcastScannerProps {
  onScan: (data: CVData[]) => void
  onClose: () => void
}

export default function BroadcastScanner({ onScan, onClose }: BroadcastScannerProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Bounding box state
  const [isDrawing, setIsDrawing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [cropBox, setCropBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Initialize persistent worker
  useEffect(() => {
    let active = true;
    (async () => {
      const worker = await createWorker('eng')
      if (active) {
        workerRef.current = worker
      } else {
        await worker.terminate()
      }
    })();
    return () => {
      active = false;
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
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
    } catch (err) {
      console.error("Failed to capture screen:", err)
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

  // Scanning loop
  const startScanning = () => {
    if (!cropBox || !videoRef.current) return
    setIsScanning(true)

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current
      if (!video) return

      // We need to map the DOM box coords to the intrinsic video resolution
      const domRect = video.getBoundingClientRect()
      const scaleX = video.videoWidth / domRect.width
      const scaleY = video.videoHeight / domRect.height

      const canvas = document.createElement('canvas')
      canvas.width = cropBox.w * scaleX
      canvas.height = cropBox.h * scaleY
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw just the cropped portion
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

      // Convert to image and OCR
      const dataUrl = canvas.toDataURL('image/png')
      try {
        if (!workerRef.current) return
        const { data: { text } } = await workerRef.current.recognize(dataUrl)

        parseOcrText(text)
      } catch (err) {
        console.error("OCR Error", err)
      }
    }, 5000) // Scan every 5 seconds
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  const parseOcrText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const results: CVData[] = []
    
    // Very basic heuristic for racing leaderboards:
    // Looks for lines starting with a number, then a name, then optionally a gap (+1.234)
    let posCount = 1
    for (const line of lines) {
      // Find numbers that might be position
      const match = line.match(/^(\d+)?\s*([A-Za-z]+)\s*(\+\d+\.\d+)?/)
      if (match) {
        const id = match[2].toUpperCase().substring(0, 3) // e.g. VER, NOR
        const gap = match[3] || (posCount === 1 ? 'Interval' : '+0.000')
        results.push({
          driver_id: id,
          position: posCount,
          gap_to_leader: gap
        })
        posCount++
      }
    }

    if (results.length > 0) {
      onScan(results)
    }
  }

  return (
    <div className="glass" style={{
      padding: '20px',
      borderRadius: 'var(--radius-xl)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScanText size={20} color="#fbbf24" />
          Broadcast Scanner
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        Screen share a race broadcast and draw a box over the leaderboard to sync live standings via Computer Vision.
      </p>

      {!isCapturing ? (
        <button 
          onClick={startCapture}
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          <ScanText size={16} /> Start Screen Share
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              background: '#000', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden',
              cursor: 'crosshair'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <video 
              ref={videoRef} 
              style={{ width: '100%', display: 'block', pointerEvents: 'none' }} 
              muted 
              playsInline 
            />
            
            {cropBox && (
              <div style={{
                position: 'absolute',
                border: '2px dashed #fbbf24',
                background: 'rgba(251, 191, 36, 0.2)',
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.w,
                height: cropBox.h,
                pointerEvents: 'none'
              }} />
            )}
            
            {!cropBox && !isDrawing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}>
                  Click and drag to highlight leaderboard
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {cropBox && !isScanning && (
              <button onClick={startScanning} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', background: '#fbbf24', color: '#000' }}>
                <RefreshCw size={16} /> Start Scanning
              </button>
            )}
            {isScanning && (
              <button onClick={stopScanning} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', background: '#ef4444' }}>
                <StopCircle size={16} /> Stop Scanning
              </button>
            )}
            <button onClick={stopCapture} className="btn-ghost" style={{ flex: 1 }}>
              Stop Video
            </button>
          </div>
          
          {isScanning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34d399', justifyContent: 'center' }}>
              <div className="live-dot" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              Scanning broadcast frame every 5s...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
