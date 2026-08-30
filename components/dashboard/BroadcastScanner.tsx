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
      try {
        const worker = await createWorker('eng')
        if (active) {
          workerRef.current = worker
        } else {
          await worker.terminate()
        }
      } catch (error) {
        console.error("Failed to initialize OCR worker:", error)
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
    if (!cropBox || !videoRef.current || scanIntervalRef.current) return
    setIsScanning(true)

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current
      if (!video) return
      if (!video.videoWidth || !video.videoHeight) return

      // We need to map the DOM box coords to the intrinsic video resolution
      const domRect = video.getBoundingClientRect()
      if (!domRect.width || !domRect.height) return
      const scaleX = video.videoWidth / domRect.width
      const scaleY = video.videoHeight / domRect.height

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(cropBox.w * scaleX))
      canvas.height = Math.max(1, Math.round(cropBox.h * scaleY))
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
    <div>
      <p className="text-[var(--text-muted)] text-[13px] mb-4">
        Screen share a race broadcast and draw a box over the leaderboard to sync live standings via Computer Vision.
      </p>

      {!isCapturing ? (
        <button 
          onClick={startCapture}
          className="btn-primary w-full flex justify-center gap-2" 
        >
          <ScanText size={16} /> Start Screen Share
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          
          <div 
            className="relative w-full bg-black rounded-[var(--radius-md)] overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <video 
              ref={videoRef} 
              className="w-full block pointer-events-none" 
              muted 
              playsInline 
            />
            
            {cropBox && (
              <div 
                className="absolute border-2 border-dashed border-amber-400 bg-amber-400/20 pointer-events-none"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.w,
                  height: cropBox.h,
                }} 
              />
            )}
            
            {!cropBox && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-black/60 px-3 py-1.5 rounded text-white text-xs">
                  Click and drag to highlight leaderboard
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            {cropBox && !isScanning && (
              <button onClick={startScanning} className="btn-primary flex-1 flex justify-center gap-2 bg-amber-400 text-black hover:bg-amber-500 border-none">
                <RefreshCw size={16} /> Start Scanning
              </button>
            )}
            {isScanning && (
              <button onClick={stopScanning} className="btn-primary flex-1 flex justify-center gap-2 bg-red-500 hover:bg-red-600 border-none">
                <StopCircle size={16} /> Stop Scanning
              </button>
            )}
            <button onClick={stopCapture} className="btn-ghost flex-1">
              Stop Video
            </button>
          </div>
          
          {isScanning && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 justify-center">
              <div className="live-dot bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Scanning broadcast frame every 5s...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
