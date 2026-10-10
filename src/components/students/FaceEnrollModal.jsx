import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, Lock, ScanFace, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cropToFace } from '../../utils/faceCrop'
import { ENROLLMENT_ANGLES } from '../../services/data'
import { enrollFace, getGestureAttendanceSettings, loginUser } from '../../services/api'
import { useAuth } from '../../context/useAuth'
import { readStoredSettings, storedCameraDeviceIdOf } from '../../utils/settings'

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
  const { user } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const blobsRef = useRef({})
  const boxRef = useRef(null)
  const [captures, setCaptures] = useState({})
  const [angleIndex, setAngleIndex] = useState(0)
  const [cameraError, setCameraError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cropping, setCropping] = useState(false)
  const [gestureRequired, setGestureRequired] = useState(false)
  // Password confirmation state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const angle = ENROLLMENT_ANGLES[angleIndex]
  const complete = ENROLLMENT_ANGLES.every((name) => captures[name])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCaptures({})
    blobsRef.current = {}
    boxRef.current = null
    setAngleIndex(0)
    setCameraError(null)
    setShowPasswordPrompt(false)
    setConfirmPassword('')
    setConfirmPasswordError('')

    // Fetch gesture-attendance setting so the hint can reflect it
    getGestureAttendanceSettings()
      .then((data) => setGestureRequired(Boolean(data.gesture_attendance_enabled)))
      .catch(() => setGestureRequired(false))

    const preferredDeviceId = storedCameraDeviceIdOf(readStoredSettings())
    const videoConstraints = preferredDeviceId
      ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }

    navigator.mediaDevices
      ?.getUserMedia({
        video: videoConstraints,
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

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      toast.error('The camera is not ready yet.')
      return
    }
    const frame = document.createElement('canvas')
    const scale = Math.min(1, 640 / video.videoWidth)
    frame.width = Math.round(video.videoWidth * scale)
    frame.height = Math.round(video.videoHeight * scale)
    frame.getContext('2d').drawImage(video, 0, 0, frame.width, frame.height)

    const currentAngle = ENROLLMENT_ANGLES[angleIndex]
    setCropping(true)
    let cropped
    try {
      cropped = await cropToFace(frame, boxRef.current)
    } finally {
      setCropping(false)
    }
    if (cropped.detected) {
      boxRef.current = cropped.box
    } else {
      toast('No face detected, so the centre of the frame was kept. Retake it if the face is off.', {
        id: 'face-crop-fallback',
      })
    }

    const blob = await new Promise((resolve) => cropped.canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) {
      toast.error('Capture failed. Try again.')
      return
    }
    blobsRef.current = { ...blobsRef.current, [currentAngle]: blob }
    setCaptures((prev) => ({ ...prev, [currentAngle]: cropped.canvas.toDataURL('image/jpeg', 0.8) }))
    const nextUncaptured = ENROLLMENT_ANGLES.findIndex((name) => !blobsRef.current[name])
    if (nextUncaptured !== -1) setAngleIndex(nextUncaptured)
  }, [angleIndex])

  /** Called when the user clicks "Save enrollment" — shows the password prompt. */
  const handleSaveClick = () => {
    if (!complete) return
    setConfirmPassword('')
    setConfirmPasswordError('')
    setShowPasswordPrompt(true)
  }

  /** Called when the user submits their password to confirm the enrollment. */
  const handleConfirmEnroll = async (event) => {
    event.preventDefault()
    if (!confirmPassword) {
      setConfirmPasswordError('Enter your password to confirm.')
      return
    }
    setSaving(true)
    setConfirmPasswordError('')
    try {
      if (!localStorage.getItem('access_token') && user?.username) {
        try {
          const apiResult = await loginUser({ username: user.username, password: confirmPassword })
          if (apiResult?.access_token) {
            localStorage.setItem('access_token', apiResult.access_token)
          }
        } catch {
          // If login fails, proceed anyway and let enrollFace surface the error
        }
      }
      const formData = new FormData()
      formData.append('student_id', student.id)
      for (const name of ENROLLMENT_ANGLES) {
        const blob = blobsRef.current[name]
        if (blob) formData.append('images', blob, `${name}.jpg`)
      }
      await enrollFace(formData, confirmPassword)
      toast.success(`${student.full_name}'s face is enrolled.`)
      onEnrolled?.()
      onClose()
    } catch (err) {
      const msg = err.message || 'Could not save the enrollment.'
      setConfirmPasswordError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !student) return null

  // ── Password confirmation overlay ────────────────────────────────────────────
  if (showPasswordPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Confirm face enrollment</h3>
              <p className="text-[11px] text-slate-400">
                Enrolling will replace any existing facial samples for {student.full_name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordPrompt(false)}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Back"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleConfirmEnroll} className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-slate-700">
                Your password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setConfirmPasswordError('')
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {confirmPasswordError && (
                <p className="mt-1.5 text-xs text-red-600">{confirmPasswordError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enrolling…
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Enroll face
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Main capture UI ──────────────────────────────────────────────────────────
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

          <p className="text-center text-xs text-slate-500">
            {ANGLE_HINTS[angle]}
            {gestureRequired && ' Keep an open palm visible beside your face.'}
          </p>

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
                disabled={!!cameraError || cropping}
                className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                {cropping
                  ? 'Finding face…'
                  : captures[angle]
                    ? `Retake ${ANGLE_LABELS[angle].toLowerCase()}`
                    : `Capture ${ANGLE_LABELS[angle].toLowerCase()}`}
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={!complete || saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Save enrollment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
