'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera } from 'lucide-react'
import jsQR from 'jsqr'

interface CameraScannerProps {
  open: boolean
  onClose: () => void
  onUrl: (url: string) => void
}

/** True when getUserMedia is available (requires HTTPS or localhost) */
function hasLiveCamera(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

/** Scan a still image File/Blob for a QR code URL using jsQR */
async function scanImageForUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(data.data, data.width, data.height)
      URL.revokeObjectURL(url)
      if (result?.data) {
        const d = result.data.trim()
        resolve(d.startsWith('http://') || d.startsWith('https://') ? d : null)
      } else {
        resolve(null)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

export function CameraScanner({ open, onClose, onUrl }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const foundRef = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanningPhoto, setScanningPhoto] = useState(false)
  const liveMode = hasLiveCamera()
  const galleryRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    foundRef.current = false
    setScanning(false)
  }, [])

  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result = jsQR(imageData.data, imageData.width, imageData.height)
    if (result?.data && !foundRef.current) {
      const d = result.data.trim()
      if (d.startsWith('http://') || d.startsWith('https://')) {
        foundRef.current = true
        onUrl(d)
        return
      }
    }
    if (!foundRef.current) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
    }
  }, [onUrl])

  // Live viewfinder mode (HTTPS only)
  useEffect(() => {
    if (!open || !liveMode) {
      stopCamera()
      return
    }
    setError(null)
    foundRef.current = false
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setScanning(true)
          animFrameRef.current = requestAnimationFrame(scanFrame)
        }
      } catch {
        setError('Camera access denied. Please allow camera permissions and try again.')
      }
    }
    startCamera()
    return () => { stopCamera() }
  }, [open, liveMode, scanFrame, stopCamera])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setError(null)
      setScanningPhoto(false)
    }
  }, [open])

  // Handle captured photo (fallback mode)
  const handleCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (captureRef.current) captureRef.current.value = ''
    setScanningPhoto(true)
    setError(null)
    try {
      const url = await scanImageForUrl(file)
      if (url) {
        onUrl(url)
      } else {
        setError('No QR code found in that photo. Try again with a clearer shot.')
      }
    } catch {
      setError('Could not read the photo. Please try again.')
    } finally {
      setScanningPhoto(false)
    }
  }, [onUrl])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 rounded-glass border border-glass-border bg-[rgba(10,12,14,0.85)] backdrop-blur-2xl overflow-hidden">

        {/* Close button */}
        <button
          type="button"
          aria-label="Close camera scanner"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full
                     border border-glass-border bg-glass-white backdrop-blur-xl text-white/70
                     hover:text-white hover:bg-glass-white-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {liveMode ? (
          /* ── Live viewfinder (HTTPS) ───────────────────────────────────── */
          <>
            <div className="relative w-full aspect-video bg-black">
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                muted
                autoPlay
                playsInline
              />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[200px] h-[200px]">
                    <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-brand-saffron" />
                    <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-brand-saffron" />
                    <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-brand-saffron" />
                    <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-brand-saffron" />
                    <span
                      className="absolute left-0 right-0 h-[2px] bg-brand-saffron/60"
                      style={{ animation: 'scan-line 2s linear infinite' }}
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
                  <p className="text-center text-sm text-white/80">{error}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 text-center text-sm text-white/60">
              {error
                ? <button type="button" onClick={onClose} className="text-brand-saffron hover:text-brand-saffron/80 underline underline-offset-2">Dismiss</button>
                : <p>Point camera at a QR code</p>
              }
            </div>
          </>
        ) : (
          /* ── Capture fallback (HTTP / no getUserMedia) ─────────────────── */
          <>
            <div className="px-8 pt-12 pb-6 flex flex-col items-center gap-6 text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full border border-glass-border bg-glass-white">
                <Camera className="h-9 w-9 text-brand-saffron" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">Scan QR Code or Link</p>
                <p className="text-sm text-white/50">
                  Take a photo of a QR code and we'll extract the URL automatically.
                </p>
              </div>

              {error && (
                <div className="w-full rounded-glass-sm border border-brand-tomato/50 bg-brand-tomato/10 px-4 py-3 text-sm text-brand-tomato">
                  {error}
                </div>
              )}

              {/* Camera capture input (opens native camera on mobile) */}
              <input
                ref={captureRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCapture}
              />

              {/* Gallery / file picker input (no capture attr) */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCapture}
              />

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  disabled={scanningPhoto}
                  onClick={() => captureRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-glass-sm border border-brand-saffron/60
                             bg-brand-saffron/20 px-6 py-3 text-sm font-medium text-white
                             transition-all hover:bg-brand-saffron/30 hover:border-brand-saffron
                             disabled:opacity-40"
                >
                  <Camera className="h-4 w-4" />
                  {scanningPhoto ? 'Scanning…' : 'Take Photo'}
                </button>
                <button
                  type="button"
                  disabled={scanningPhoto}
                  onClick={() => galleryRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-glass-sm border border-glass-border
                             bg-glass-white px-6 py-3 text-sm font-medium text-white/80
                             transition-all hover:bg-glass-white-md hover:text-white
                             disabled:opacity-40"
                >
                  Upload Image
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for live frame analysis */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan-line {
          0%   { top: 0; }
          100% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  )
}
