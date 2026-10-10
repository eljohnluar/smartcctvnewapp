import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  SwitchCamera,
  Users,
  Video,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { processFrame } from '../../services/api'
import {
  readStoredSettings,
  saveStoredSettings,
  storedCameraDeviceIdOf,
  storedCameraFlipOf,
} from '../../utils/settings'
import CheckinTimeSchedule from './CheckinTimeSchedule'

function formatTime(ts) {
  if (!ts) return 'Just now'
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(ts))
}

/* ─── Biometric Face Overlay Renderer ────────────────────────────────────── */
function renderBiometricOverlay(canvas, video, detectionsData, fitMode, mirrored) {
  if (!canvas) return
  const displayW = canvas.clientWidth
  const displayH = canvas.clientHeight
  if (!displayW || !displayH) return

  if (canvas.width !== displayW || canvas.height !== displayH) {
    canvas.width = displayW
    canvas.height = displayH
  }

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, displayW, displayH)

  if (!detectionsData || !detectionsData.detections || detectionsData.detections.length === 0) {
    return
  }

  const now = Date.now()
  const age = now - (detectionsData.timestamp || 0)
  // Decay after 2.4s if no fresh detection frame arrived
  if (age > 2400) return
  const alpha = age > 1800 ? Math.max(0, 1 - (age - 1800) / 600) : 1

  const fw = detectionsData.frameWidth || 640
  const fh = detectionsData.frameHeight || 360

  const scale = fitMode === 'contain'
    ? Math.min(displayW / fw, displayH / fh)
    : Math.max(displayW / fw, displayH / fh)

  const rw = fw * scale
  const rh = fh * scale
  const ox = (displayW - rw) / 2
  const oy = (displayH - rh) / 2

  detectionsData.detections.forEach((detection) => {
    const box = detection.box || detection
    if (!Array.isArray(box) || box.length < 4) return
    const [bx, by, bw, bh] = box

    let x = ox + bx * scale
    const y = oy + by * scale
    const w = bw * scale
    const h = bh * scale

    if (mirrored) {
      x = displayW - (x + w)
    }

    const labelRaw = String(detection.label || 'UNKNOWN').trim()
    const isUnknown =
      !labelRaw ||
      /^unknown/i.test(labelRaw) ||
      /not enrolled/i.test(labelRaw) ||
      /unregistered/i.test(labelRaw)
    const isGestureNeeded = labelRaw.includes('SHOW PALM')
    const gestureDetected = Boolean(detectionsData.gestureDetected)

    let accentColor = '#10b981' // emerald-500, enrolled student
    let labelTextColor = '#06281a'
    if (isUnknown) {
      accentColor = '#ef4444' // red-500, unknown face
      labelTextColor = '#ffffff'
    } else if (isGestureNeeded && !gestureDetected) {
      accentColor = '#f59e0b' // amber-500, waiting for palm gesture
      labelTextColor = '#3a2503'
    }

    ctx.save()
    ctx.globalAlpha = alpha

    // Simple 2px bounding box, like the smartcctvapp stream overlays
    ctx.lineWidth = 2
    ctx.strokeStyle = accentColor
    ctx.strokeRect(x, y, w, h)

    let title = labelRaw
    if (isUnknown) {
      title = 'UNREGISTERED'
    } else {
      title = labelRaw.replace(/\s*\d+\s*%/, '').replace(/\s*·?\s*SHOW PALM.*/i, '').trim() || labelRaw
    }

    // Flat filled label chip sitting on the box's top edge
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
    const textWidth = ctx.measureText(title).width
    const chipW = textWidth + 12
    const chipH = 18
    const chipY = Math.max(0, y - chipH)
    ctx.fillStyle = accentColor
    ctx.fillRect(x, chipY, chipW, chipH)
    ctx.fillStyle = labelTextColor
    ctx.fillText(title, x + 6, chipY + chipH - 5)

    ctx.restore()
  })
}

/* ─── Floating Attendance Glass Modal (overlaid on the fullscreen view) ─── */
function FloatingAttendanceGlassModal({ records = [], isOpen, onToggle }) {
  const markedRecords = records
    .filter((r) => r.status === 'present' || r.status === 'late' || r.status === 'time_out')
    .sort((a, b) => new Date(b.check_in_time || 0) - new Date(a.check_in_time || 0))

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="group absolute right-5 sm:right-6 top-20 z-30 flex items-center gap-2.5 rounded-2xl border border-white/20 px-4 py-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.18)] transition-all hover:scale-105 hover:border-emerald-400/40 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(10, 16, 26, 0.8) 100%)',
          backdropFilter: 'blur(24px) saturate(190%)',
        }}
        title="Show floating attendance log"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <Users size={15} />
        </div>
        <span className="text-xs font-semibold text-white">Attendance Log</span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          {markedRecords.length}
        </span>
        <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </button>
    )
  }

  return (
    <aside
      className="absolute right-4 sm:right-6 top-20 bottom-6 z-30 flex w-[300px] sm:w-[350px] flex-col rounded-3xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-all duration-300"
      style={{
        background: 'linear-gradient(155deg, rgba(13, 22, 38, 0.62) 0%, rgba(8, 14, 25, 0.78) 100%)',
        backdropFilter: 'blur(28px) saturate(190%)',
      }}
      aria-label="Floating Attendance Log"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Users size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-white">Attendance Log</p>
            <p className="text-[10px] text-slate-400">Live AI Biometric Matches</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            {markedRecords.length} today
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Minimize attendance log"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto px-4 py-2">
        {markedRecords.length === 0 && (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center text-slate-400">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <CheckCircle2 size={22} className="text-slate-500" />
            </div>
            <p className="text-xs font-medium text-slate-200">Awaiting Recognition</p>
            <p className="max-w-[210px] text-[11px] text-slate-400">
              Recognized students will automatically appear here in real time.
            </p>
          </div>
        )}
        {markedRecords.map((record) => (
          <div
            key={record.id || `${record.student_id}-${record.check_in_time}`}
            className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/15 text-xs font-bold text-emerald-300">
              {(record.student_name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-100">{record.student_name || 'Unknown student'}</p>
              <p className="truncate text-[10px] text-slate-400">
                {record.student_code && record.section
                  ? `${record.student_code} · ${record.section}`
                  : record.student_code || record.section || 'Face recognition'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-300">
                <Clock3 size={11} /> {formatTime(record.check_in_time)}
              </p>
              {record.confidence != null && (
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  {Math.round(record.confidence * 100)}% match
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-2.5 text-center">
        <p className="text-[10px] text-slate-400">Auto-updating · Live Device Camera View</p>
      </div>
    </aside>
  )
}

/* ─── Fullscreen Camera Modal ────────────────────────────────────────────── */
function FullscreenModal({
  videoRef: externalVideoRef,
  mirrored,
  isLive,
  failed,
  failReason,
  reconnect,
  onClose,
  facing,
  onToggleFacing,
  streamNonce,
  attendanceRecords,
  detectionsRef,
}) {
  const modalVideoRef = useRef(null)
  const modalOverlayCanvasRef = useRef(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  // Mirror the webcam stream into the fullscreen video element
  useEffect(() => {
    const srcStream = externalVideoRef.current?.srcObject
    if (srcStream && modalVideoRef.current) {
      modalVideoRef.current.srcObject = srcStream
    }
  }, [externalVideoRef, streamNonce])

  // Real-time 60 FPS biometric face overlay loop for fullscreen view
  useEffect(() => {
    let animId
    const loop = () => {
      if (modalOverlayCanvasRef.current && modalVideoRef.current && detectionsRef?.current) {
        renderBiometricOverlay(
          modalOverlayCanvasRef.current,
          modalVideoRef.current,
          detectionsRef.current,
          'contain',
          mirrored,
        )
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [mirrored, detectionsRef])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden select-none"
      role="dialog"
      aria-label="Fullscreen device camera feed"
    >
      {/* Top Bar */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-end bg-gradient-to-b from-black/85 via-black/45 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              isLive
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-slate-600/40 text-slate-500'
            }`}
          >
            <Radio size={11} className={isLive ? 'animate-pulse text-emerald-400' : ''} />
            {isLive ? 'Live' : 'Offline'}
          </span>

          <button
            type="button"
            onClick={() => setShowAttendanceModal((prev) => !prev)}
            aria-label="Toggle Attendance Log"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
              showAttendanceModal
                ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <Users size={12} />
            <span>Attendance Log</span>
          </button>

          <button
            type="button"
            onClick={onToggleFacing}
            title={facing === 'user' ? 'Using front camera (click for back)' : 'Using back camera (click for front)'}
            aria-label="Switch between front and back camera"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/15"
          >
            <SwitchCamera size={12} />
            {facing === 'user' ? 'Front' : 'Back'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 shadow-lg"
          >
            <Minimize2 size={13} /> Exit fullscreen
          </button>
        </div>
      </div>

      {/* Fullscreen Video Layer */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#080d15]">
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={modalVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-contain ${failed ? 'hidden' : 'block'} ${mirrored ? '-scale-x-100' : ''}`}
          />
          <canvas
            ref={modalOverlayCanvasRef}
            className={`pointer-events-none absolute inset-0 h-full w-full ${failed ? 'hidden' : 'block'}`}
          />
        </div>

        {/* HUD overlays */}
        {!failed && isLive && (
          <>
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/90 backdrop-blur-md border border-white/10 sm:left-6 sm:top-20">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-red-400 absolute" />
              <span className="ml-1">REC 01</span>
            </div>
            <div className="absolute bottom-20 left-6 z-20 rounded-md bg-black/60 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur-md border border-white/10">
              DEVICE CAM · 720P/1080P · 30FPS
            </div>
          </>
        )}

        {/* Camera unavailable state */}
        {failed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
              <Camera size={26} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-200">Device camera unavailable</p>
            <p className="max-w-sm text-xs text-slate-400 px-4">
              {failReason || 'Please verify that camera permissions are enabled in your browser.'}
            </p>
            <button
              type="button"
              onClick={reconnect}
              className="mt-3 rounded-xl bg-emerald-400/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/25"
            >
              Try reconnecting
            </button>
          </div>
        )}

        {/* Floating Attendance Log */}
        <FloatingAttendanceGlassModal
          records={attendanceRecords}
          isOpen={showAttendanceModal}
          onToggle={() => setShowAttendanceModal((prev) => !prev)}
        />
      </div>

      {/* Bottom Overlay Bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-12 pb-4 sm:px-6">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <CheckinTimeSchedule overlay />
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ─── Main LiveCameraFeed Component ──────────────────────────────────────── */
export default function LiveCameraFeed({ attendanceRecords = [] }) {
  const [failed, setFailed] = useState(false)
  const [failReason, setFailReason] = useState('')
  const [streamReady, setStreamReady] = useState(false)
  const [recordingBusy, setRecordingBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [faceCount, setFaceCount] = useState(0)

  // Biometric active detections ref (shared with 60 FPS canvas renderers)
  const activeDetectionsRef = useRef({
    detections: [],
    frameWidth: 640,
    frameHeight: 360,
    timestamp: 0,
    gestureDetected: false,
  })
  const overlayCanvasRef = useRef(null)

  // Camera devices
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    const stored = readStoredSettings()
    return storedCameraDeviceIdOf(stored)
  })
  const [mirrored, setMirrored] = useState(() => {
    const stored = readStoredSettings()
    return storedCameraFlipOf(stored)
  })
  const [facing, setFacing] = useState('user')
  const [streamNonce, setStreamNonce] = useState(0)

  const { attendanceRecording, updateAttendanceRecording } = useApp()
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // 60 FPS biometric face overlay loop for card view
  useEffect(() => {
    let animId
    const loop = () => {
      if (overlayCanvasRef.current && videoRef.current) {
        renderBiometricOverlay(
          overlayCanvasRef.current,
          videoRef.current,
          activeDetectionsRef.current,
          'cover',
          mirrored,
        )
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [mirrored])

  // Discover connected video input devices
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoInputs)
    } catch {
      // Fallback
    }
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreamReady(false)
  }, [])

  const startStream = useCallback(async (facingOverride) => {
    stopStream()
    setFailed(false)
    setFailReason('')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support webcam capture.')
      }

      const mode = typeof facingOverride === 'string' ? facingOverride : facing
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStreamReady(true)
      setStreamNonce((n) => n + 1)

      // Re-enumerate devices now that camera permission has been granted (labels will be populated)
      enumerateCameras()
    } catch (err) {
      setStreamReady(false)
      setFailed(true)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setFailReason('Camera access was denied. Please allow camera permissions in your browser.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setFailReason('No device camera was found. Please connect a webcam or camera device.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setFailReason('The camera is in use by another application. Please close it and try again.')
      } else {
        setFailReason(err.message || 'Unable to access the device camera.')
      }
    }
  }, [selectedDeviceId, facing, stopStream, enumerateCameras])

  useEffect(() => {
    startStream()
    return stopStream
  }, [startStream, stopStream])

  // Continuously analyze device camera frames for AI face recognition when live
  const isScanningRef = useRef(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!streamReady || failed) return undefined

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current

    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video || !video.videoWidth || video.paused || video.ended || isScanningRef.current) {
        return
      }

      // Avoid background tab scanning to conserve cloud compute
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }

      try {
        isScanningRef.current = true
        const scale = Math.min(1, 640 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              try {
                const res = await processFrame(blob)
                if (res && res.success) {
                  const detections = res.detections || (res.boxes || []).map((b, i) => ({
                    box: b,
                    label: res.labels?.[i] || 'UNKNOWN',
                  }))
                  activeDetectionsRef.current = {
                    detections,
                    frameWidth: res.frame_width || canvas.width,
                    frameHeight: res.frame_height || canvas.height,
                    timestamp: Date.now(),
                    gestureDetected: Boolean(res.gesture_detected),
                  }
                  setFaceCount(detections.length)
                }
              } catch {
                // Ignore transient network errors or offline server sleep
              }
            }
            isScanningRef.current = false
          },
          'image/jpeg',
          0.80,
        )
      } catch {
        isScanningRef.current = false
      }
    }, 1100)

    const countDecay = setInterval(() => {
      if (Date.now() - (activeDetectionsRef.current.timestamp || 0) > 2500) {
        setFaceCount(0)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(countDecay)
      isScanningRef.current = false
    }
  }, [streamReady, failed])

  const handleDeviceChange = (deviceId) => {
    setSelectedDeviceId(deviceId)
    saveStoredSettings({ cameraDeviceId: deviceId })
  }

  const toggleFacing = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    setSelectedDeviceId('')
    saveStoredSettings({ cameraDeviceId: '' })
    startStream(next)
  }

  const toggleMirror = () => {
    const next = !mirrored
    setMirrored(next)
    saveStoredSettings({ cameraFlipHorizontal: next })
  }

  const toggleAttendanceRecording = async () => {
    setRecordingBusy(true)
    try {
      await updateAttendanceRecording(!attendanceRecording)
    } catch (error) {
      toast.error(error.message || 'Could not change attendance recording state')
    } finally {
      setRecordingBusy(false)
    }
  }

  // Active camera label
  const activeDevice = devices.find((d) => d.deviceId === selectedDeviceId)
  const cameraLabel = activeDevice?.label || "Device's Camera"
  const isLive = streamReady && !failed

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Video size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">Device Camera Feed</h2>
              <p className="text-[11px] text-slate-400 truncate">{cameraLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Camera device picker if multiple devices exist */}
            {devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:block"
                aria-label="Select camera device"
              >
                {devices.map((d, index) => (
                  <option key={d.deviceId || index} value={d.deviceId}>
                    {d.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Live/offline badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                isLive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <Radio size={11} className={isLive ? 'animate-pulse text-emerald-500' : ''} />
              {isLive ? 'Live' : 'Offline'}
            </span>

            {/* Attendance recording toggle */}
            <button
              type="button"
              onClick={toggleAttendanceRecording}
              disabled={!isLive || recordingBusy}
              title={attendanceRecording ? 'Pause attendance recording' : 'Start attendance recording'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                attendanceRecording
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {attendanceRecording ? <Pause size={12} /> : <Play size={12} />}
              {attendanceRecording ? 'Pause' : 'Record'}
            </button>

            {/* Flip / mirror toggle */}
            <button
              type="button"
              onClick={toggleMirror}
              title={mirrored ? 'Mirroring enabled (click to unflip)' : 'Mirroring disabled (click to flip)'}
              aria-label="Flip camera view"
              className={`rounded-lg p-2 transition-colors ${
                mirrored
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <FlipHorizontal size={15} />
            </button>

            {/* Front / back camera toggle */}
            <button
              type="button"
              onClick={toggleFacing}
              disabled={recordingBusy}
              title={facing === 'user' ? 'Using front camera (click for back)' : 'Using back camera (click for front)'}
              aria-label="Switch between front and back camera"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <SwitchCamera size={12} />
              {facing === 'user' ? 'Front' : 'Back'}
            </button>

            {/* Reconnect */}
            <button
              type="button"
              onClick={() => startStream()}
              aria-label="Restart camera"
              title="Restart camera"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <RefreshCw size={15} />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Open fullscreen camera view"
              title="Fullscreen"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Maximize2 size={15} />
              Fullscreen
            </button>
          </div>
        </div>

        {/* Video Display Area */}
        <div className="relative aspect-video overflow-hidden bg-slate-950 xl:aspect-[16/8]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlay={() => setStreamReady(true)}
            className={`h-full w-full object-cover ${failed ? 'hidden' : 'block'} ${mirrored ? '-scale-x-100' : ''}`}
          />
          <canvas
            ref={overlayCanvasRef}
            className={`pointer-events-none absolute inset-0 h-full w-full ${failed ? 'hidden' : 'block'}`}
          />

          {/* HUD overlays */}
          {!failed && isLive && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
              <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] tracking-wide text-white/85 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                REC 01
              </div>
              {faceCount > 0 && (
                <div className="absolute left-24 top-3 flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-950/70 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-300 backdrop-blur-sm shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {faceCount} {faceCount === 1 ? 'FACE' : 'FACES'} DETECTED
                </div>
              )}
              <div className="absolute bottom-4 left-4 rounded-md bg-black/45 px-2 py-1 font-mono text-[10px] text-white/75 backdrop-blur-sm">
                DEVICE CAM · {mirrored ? 'MIRRORED' : 'NORMAL'}
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Open fullscreen"
                className="absolute bottom-4 right-4 rounded-md bg-black/45 p-1.5 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
              >
                <Maximize2 size={15} />
              </button>
            </>
          )}

          {/* Error / Offline state */}
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                <Camera size={23} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-200">Device camera unavailable</p>
              <p className="max-w-sm text-xs text-slate-400">
                {failReason || 'Please allow browser access to the device camera to view the live feed.'}
              </p>
              <button
                type="button"
                onClick={startStream}
                className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                Allow &amp; Connect Camera
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen portal */}
      {fullscreen && (
        <FullscreenModal
          videoRef={videoRef}
          mirrored={mirrored}
          isLive={isLive}
          failed={failed}
          failReason={failReason}
          reconnect={startStream}
          onClose={() => setFullscreen(false)}
          facing={facing}
          onToggleFacing={toggleFacing}
          streamNonce={streamNonce}
          attendanceRecords={attendanceRecords}
          detectionsRef={activeDetectionsRef}
        />
      )}
    </>
  )
}
