import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Users,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { API_BASE_URL } from '../../services/api'
import { readStoredSettings, liveFeedCameraOf, cameraSourceLabel } from '../../utils/settings'
import CheckinTimeSchedule from './CheckinTimeSchedule'

const streamUrl = `${API_BASE_URL}/camera/stream`

function formatTime(ts) {
  if (!ts) return 'Just now'
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(ts))
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
        <p className="text-[10px] text-slate-400">Auto-updating · Live Glass View</p>
      </div>
    </aside>
  )
}

/* ─── Fullscreen Camera Modal ────────────────────────────────────────────── */
function FullscreenModal({
  isWebcam,
  sourceLabel,
  videoRef: externalVideoRef,
  streamKey,
  mirrored,
  failed,
  failReason,
  reconnect,
  onClose,
  attendanceRecords,
}) {
  const modalVideoRef = useRef(null)
  const { cameraActive, attendanceRecording, updateAttendanceRecording } = useApp()
  const [recordingBusy, setRecordingBusy] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(true)
  const isLive = cameraActive || (isWebcam && externalVideoRef.current?.srcObject)

  // Mirror the webcam stream into the fullscreen video element
  useEffect(() => {
    if (!isWebcam) return
    const srcStream = externalVideoRef.current?.srcObject
    if (srcStream && modalVideoRef.current) {
      modalVideoRef.current.srcObject = srcStream
    }
  }, [isWebcam, externalVideoRef])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden select-none"
      role="dialog"
      aria-label="Fullscreen camera feed"
    >
      {/* Top Bar */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            {isWebcam ? <Video size={17} /> : <Camera size={17} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Live camera feed</p>
            <p className="text-[10px] text-slate-400">Main entrance · {sourceLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              isLive
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-slate-600/40 text-slate-500'
            }`}
          >
            <Radio size={11} className={isLive ? 'animate-pulse' : ''} />
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
            onClick={toggleAttendanceRecording}
            disabled={recordingBusy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              attendanceRecording
                ? 'bg-red-400/10 text-red-300 hover:bg-red-400/20'
                : 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
            }`}
          >
            {attendanceRecording ? <Pause size={12} /> : <Play size={12} />}
            {attendanceRecording ? 'Pause attendance' : 'Record attendance'}
          </button>

          <button
            type="button"
            onClick={reconnect}
            aria-label="Reconnect"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Exit fullscreen"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 100% Fullscreen Camera Feed Layer */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#080d15]">
        <div className="absolute inset-0 flex items-center justify-center">
          {isWebcam ? (
            <video
              ref={modalVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain ${failed ? 'hidden' : 'block'} ${mirrored ? '-scale-x-100' : ''}`}
            />
          ) : (
            !failed && (
              <img
                key={streamKey}
                src={`${streamUrl}?refresh=${streamKey}`}
                alt="Live camera feed"
                className="h-full w-full object-contain"
              />
            )
          )}
        </div>

        {/* HUD overlays */}
        {!failed && (
          <>
            <div className="absolute left-6 top-20 z-20 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/90 backdrop-blur-md border border-white/10">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-red-400 absolute" />
              <span className="ml-1">REC 01</span>
            </div>
            <div className="absolute bottom-20 left-6 z-20 rounded-md bg-black/60 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur-md border border-white/10">
              CAM 01 · 1080P · 30FPS
            </div>
          </>
        )}

        {/* Camera unavailable state */}
        {failed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
              <Camera size={26} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-200">Camera feed is unavailable</p>
            <p className="max-w-sm text-xs text-slate-400">
              {failReason || 'Confirm the camera is running and the configured device is available.'}
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
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 shadow-lg"
        >
          <Minimize2 size={13} /> Exit fullscreen
        </button>
      </div>
    </div>,
    document.body,
  )
}

/* ─── Main LiveCameraFeed Component ──────────────────────────────────────── */
export default function LiveCameraFeed({ attendanceRecords = [] }) {
  const [streamKey, setStreamKey] = useState(0)
  const [failed, setFailed] = useState(false)
  const [failReason, setFailReason] = useState('')
  const { cameraActive, attendanceRecording, updateAttendanceRecording } = useApp()
  const [streamReady, setStreamReady] = useState(false)
  const [recordingBusy, setRecordingBusy] = useState(false)
  const [stored] = useState(readStoredSettings)
  const [fullscreen, setFullscreen] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const source = liveFeedCameraOf(stored)
  const isWebcam = source === 'webcam'
  const isBridge = source === 'obs' || source === 'rtsp'
  const sourceLabel = cameraSourceLabel(source)

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startWebcam = useCallback(async () => {
    setFailed(false)
    setFailReason('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStreamReady(true)
    } catch {
      setStreamReady(false)
      setFailReason('Browser webcam access was denied or no camera is available on this device.')
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    if (!isWebcam) return undefined
    startWebcam()
    return stopWebcam
  }, [isWebcam, startWebcam, stopWebcam])

  const reconnect = () => {
    setStreamReady(false)
    if (isWebcam) {
      stopWebcam()
      startWebcam()
      return
    }
    setFailed(false)
    setFailReason('')
    setStreamKey((key) => key + 1)
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

  const cameraReady = cameraActive || streamReady
  const isLive = cameraActive || (isWebcam && streamReady)
  const mirrored = Boolean(stored.cameraFlipHorizontal)

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              {isWebcam ? <Video size={17} /> : <Camera size={17} />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Live camera feed</h2>
              <p className="text-[11px] text-slate-400">Main entrance · {sourceLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live/offline badge */}
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${
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
              disabled={!cameraReady || recordingBusy}
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

            {/* Reconnect */}
            <button
              type="button"
              onClick={reconnect}
              aria-label="Reconnect camera stream"
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
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Video area */}
        <div className="relative aspect-video overflow-hidden bg-slate-900 xl:aspect-[16/8]">
          {isWebcam ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={() => setStreamReady(true)}
              className={`h-full w-full object-cover ${failed ? 'hidden' : 'block'} ${mirrored ? '-scale-x-100' : ''}`}
            />
          ) : (
            !failed && (
              <img
                key={streamKey}
                src={`${streamUrl}?refresh=${streamKey}`}
                alt="Live camera feed"
                onLoad={() => setStreamReady(true)}
                onError={() => {
                  setFailReason('')
                  setFailed(true)
                }}
                className="h-full w-full object-cover"
              />
            )
          )}

          {/* HUD overlays */}
          {!failed && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
              <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] tracking-wide text-white/85 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                REC 01
              </div>
              <div className="absolute bottom-4 left-4 rounded-md bg-black/45 px-2 py-1 font-mono text-[10px] text-white/75 backdrop-blur-sm">
                CAM 01 · 1080P
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

          {/* Error / offline state */}
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                <Camera size={23} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-200">Camera feed unavailable</p>
              <p className="max-w-xs text-xs text-slate-400 px-4">
                {failReason ||
                  (isBridge
                    ? 'Start the local bridge script on the camera computer and confirm it is connected.'
                    : 'Confirm the backend is running and the camera device is accessible.')}
              </p>
              <button
                type="button"
                onClick={reconnect}
                className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                Try reconnecting
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen portal */}
      {fullscreen && (
        <FullscreenModal
          isWebcam={isWebcam}
          sourceLabel={sourceLabel}
          videoRef={videoRef}
          streamKey={streamKey}
          mirrored={mirrored}
          failed={failed}
          failReason={failReason}
          reconnect={reconnect}
          onClose={() => setFullscreen(false)}
          attendanceRecords={attendanceRecords}
        />
      )}
    </>
  )
}
