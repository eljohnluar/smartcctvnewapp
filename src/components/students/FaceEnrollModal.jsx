import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, ScanFace, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ENROLLMENT_ANGLES, enrollStudentFace } from '../../services/data'

const ANGLE_LABELS = {
  front: 'Front',
  left: 'Left',
  right: 'Right',
  upward: 'Upward',
}

const ANGLE_HINTS = {
  front: 'Look straight at the camera with both eyes visible.',
  left: 'Turn your head slightly to your left.',
  right: 'Turn your head slightly to your right.',
  upward: 'Tilt your chin slightly upward.',
}

export default function FaceEnrollModal({ open, student, onClose, onEnrolled }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const blobsRef = useRef({})
  const [captures, setCaptures] = useState({})
  const [angleIndex, setAngleIndex] = useState(0)
  const [cameraError, setCameraError] = useState(null)
  const [saving, setSaving] = useState(false)

  const angle = ENROLLMENT_ANGLES[angleIndex]
  const complete = ENROLLMENT_ANGLES.every((name) => captures[name])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCaptures({})
    blobsRef.current = {}
    setAngleIndex(0)
    setCameraError(null)

    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        setCameraError(
          'Could not access the webcam. Check that a camera is connected and the browser is allowed to use it.',
        )
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [open, student?.id])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      toast.error('The camera is not ready yet.')
      return
    }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 640 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    const currentAngle = ENROLLMENT_ANGLES[angleIndex]
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Capture failed. Try again.')
          return
        }
        blobsRef.current = { ...blobsRef.current, [currentAngle]: blob }
        setCaptures((prev) => ({ ...prev, [currentAngle]: canvas.toDataURL('image/jpeg', 0.8) }))
        const nextUncaptured = ENROLLMENT_ANGLES.findIndex((name) => !blobsRef.current[name])
        if (nextUncaptured !== -1) setAngleIndex(nextUncaptured)
      },
      'image/jpeg',
      0.9,
    )
  }, [angleIndex])

  const handleSave = async () => {
    setSaving(true)
    try {
      await enrollStudentFace(student, blobsRef.current)
      toast.success(`${student.full_name}'s face is enrolled.`)
      onEnrolled?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save the enrollment.')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Enroll face — {student.full_name}</h3>
            <p className="text-[11px] text-slate-400">{student.student_id} · {student.section || 'No section'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {cameraError ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center">
              <Camera size={20} className="text-amber-500" />
              <p className="text-xs text-amber-700">{cameraError}</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-slate-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full -scale-x-100 object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-3/4 w-[45%] rounded-[50%] border-2 border-dashed border-emerald-400/70" />
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
                {ANGLE_LABELS[angle]} · {captures[angle] ? 'Retake' : 'Capture'}
              </span>
            </div>
          )}

          <p className="text-center text-xs text-slate-500">{ANGLE_HINTS[angle]}</p>

          <div className="grid grid-cols-4 gap-2">
            {ENROLLMENT_ANGLES.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => setAngleIndex(index)}
                className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
                  index === angleIndex ? 'border-emerald-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {captures[name] ? (
                  <div className="relative">
                    <img src={captures[name]} alt={ANGLE_LABELS[name]} className="aspect-square w-full -scale-x-100 object-cover" />
                    <span className="absolute right-1 top-1 rounded-full bg-emerald-600 p-0.5 text-white">
                      <Check size={10} />
                    </span>
                  </div>
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-slate-50 text-slate-400">
                    <ScanFace size={16} />
                    <span className="text-[10px] font-medium">{ANGLE_LABELS[name]}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!cameraError}
                className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                {captures[angle] ? `Retake ${ANGLE_LABELS[angle].toLowerCase()}` : `Capture ${ANGLE_LABELS[angle].toLowerCase()}`}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!complete || saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save enrollment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
