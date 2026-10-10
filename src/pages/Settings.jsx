import { useEffect, useState } from 'react'
import {
  Camera,
  Check,
  Cpu,
  FlipHorizontal,
  Hand,
  Palette,
  Save,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { usePasswordConfirm } from '../hooks/usePasswordConfirm'
import {
  getGestureAttendanceSettings,
  getRuntimeControls,
  getUniformPolicy,
  getVoiceSettings,
  updateGestureAttendanceSettings,
  updateRuntimeControls,
  updateUniformPolicy,
  updateVoiceSettings,
} from '../services/api'
import {
  readStoredSettings,
  saveStoredSettings,
  storedCameraDeviceIdOf,
  storedCameraFlipOf,
} from '../utils/settings'
import AIStatusIndicator from '../components/dashboard/AIStatusIndicator'
import AdminSettings from './admin/AdminSettings'

const defaultSettings = {
  cameraFps: 15,
  cameraDeviceId: '',
  cameraFlipHorizontal: true,
  recognitionThreshold: 0.55,
  recognitionModel: 'Facenet',
  voiceLanguage: 'en',
  announcerEnabled: true,
  announcerVolume: 100,
  alertModeEnabled: true,
  voiceGender: 'female',
  gestureAttendanceEnabled: false,
  uniformColors: [],
}

function ToggleButton({ value, onChange, onLabel = 'On', offLabel = 'Off' }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
          value ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {onLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
          !value ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {offLabel}
      </button>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator'
  const [activeTab, setActiveTab] = useState('teacher')

  const [settings, setSettings] = useState(() => {
    const stored = readStoredSettings()
    return {
      ...defaultSettings,
      cameraDeviceId: storedCameraDeviceIdOf(stored),
      cameraFlipHorizontal: storedCameraFlipOf(stored),
      ...stored,
    }
  })

  const [devices, setDevices] = useState([])
  const [saving, setSaving] = useState(false)
  const { confirm, dialog } = usePasswordConfirm()

  // Enumerate device cameras
  useEffect(() => {
    async function loadCameras() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput')
        setDevices(videoInputs)
      } catch {
        // Fallback
      }
    }
    loadCameras()
  }, [])

  // Load server-backed policies
  useEffect(() => {
    getUniformPolicy()
      .then((policy) =>
        setSettings((prev) => ({ ...prev, uniformColors: policy.uniform_colors || [] })),
      )
      .catch(() => {})

    getVoiceSettings()
      .then((voice) =>
        setSettings((prev) => ({ ...prev, voiceGender: voice.voice_gender || 'female' })),
      )
      .catch(() => {})

    getGestureAttendanceSettings()
      .then((gesture) =>
        setSettings((prev) => ({
          ...prev,
          gestureAttendanceEnabled: Boolean(gesture.gesture_attendance_enabled),
        })),
      )
      .catch(() => {})

    getRuntimeControls()
      .then((controls) =>
        setSettings((prev) => ({
          ...prev,
          cameraFlipHorizontal: Boolean(controls.camera_flip_horizontal),
          announcerEnabled: Boolean(controls.announcer_enabled),
          announcerVolume: controls.announcer_volume ?? 100,
          alertModeEnabled: Boolean(controls.alert_mode_enabled),
        })),
      )
      .catch(() => {})
  }, [])

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const toggleUniformColor = (color) => {
    handleChange(
      'uniformColors',
      settings.uniformColors.includes(color)
        ? settings.uniformColors.filter((selected) => selected !== color)
        : [...settings.uniformColors, color],
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const saved = await confirm(
      async (password) => {
        await updateUniformPolicy(settings.uniformColors, password)
        await updateVoiceSettings(settings.voiceGender, password)
        await updateGestureAttendanceSettings(settings.gestureAttendanceEnabled, password)
        await updateRuntimeControls(
          {
            camera_flip_horizontal: settings.cameraFlipHorizontal,
            announcer_enabled: settings.announcerEnabled,
            announcer_volume: settings.announcerVolume,
            alert_mode_enabled: settings.alertModeEnabled,
          },
          password,
        )

        // Save local device camera preferences
        saveStoredSettings({
          cameraDeviceId: settings.cameraDeviceId,
          cameraFlipHorizontal: settings.cameraFlipHorizontal,
          cameraFps: settings.cameraFps,
          recognitionThreshold: settings.recognitionThreshold,
          recognitionModel: settings.recognitionModel,
        })
      },
      {
        title: 'Confirm configuration changes',
        description: 'Saving system settings requires your account password.',
        confirmLabel: 'Save configuration',
      },
    )

    setSaving(false)
    if (!saved) return
    toast.success('Settings updated successfully')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header with Role Indicator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings &amp; Configuration</h1>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? 'Manage device camera, AI recognition, institutional policies, and administrator controls.'
              : 'Configure your device camera, audio announcements, and class policies.'}
          </p>
        </div>

        {/* Tab switch for administrators */}
        {isAdmin && (
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders size={14} /> Teacher Portal Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield size={14} /> Administrator Controls
            </button>
          </div>
        )}
      </div>

      {/* Render Admin Console if Admin tab is active */}
      {isAdmin && activeTab === 'admin' ? (
        <AdminSettings embedded />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            {/* ── Left Column: Device Camera & Voice Engine ────────────────────── */}
            <div className="space-y-6">
              {/* Device Camera Configuration Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Device Camera Settings</h2>
                    <p className="text-xs text-slate-500">Hardware input device for live monitoring &amp; enrollment</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Camera Device Selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                      Active Device Camera
                    </label>
                    <select
                      value={settings.cameraDeviceId}
                      onChange={(e) => handleChange('cameraDeviceId', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">Default System Camera</option>
                      {devices.map((d, index) => (
                        <option key={d.deviceId || index} value={d.deviceId}>
                          {d.label || `Camera ${index + 1}`}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Exclusively utilizes your computer or tablet&apos;s camera device.
                    </p>
                  </div>

                  {/* Target FPS */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                      Target Capture Rate (FPS)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={settings.cameraFps}
                      onChange={(e) => handleChange('cameraFps', parseInt(e.target.value, 10) || 15)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      15–30 FPS recommended for smooth live preview and facial analysis.
                    </p>
                  </div>

                  {/* Camera Horizontal Flip */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FlipHorizontal size={18} className="text-emerald-600" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          Mirror camera horizontally
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Flips the live view left-to-right (mirror view for webcams).
                        </p>
                      </div>
                    </div>
                    <ToggleButton
                      value={settings.cameraFlipHorizontal}
                      onChange={(v) => handleChange('cameraFlipHorizontal', v)}
                    />
                  </div>
                </div>
              </div>

              {/* Voice Announcement Engine */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Voice Announcement Engine</h2>
                    <p className="text-xs text-slate-500">Audio feedback for student check-ins and alerts</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Announcer Toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Voice Announcer</span>
                      <p className="text-[11px] text-slate-400">
                        Speak attendance confirmations and alerts aloud.
                      </p>
                    </div>
                    <ToggleButton
                      value={settings.announcerEnabled}
                      onChange={(v) => handleChange('announcerEnabled', v)}
                    />
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-700">
                      <span>Announcer Volume</span>
                      <span className="font-mono text-emerald-600">{settings.announcerVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.announcerVolume}
                      onChange={(e) => handleChange('announcerVolume', Number(e.target.value))}
                      disabled={!settings.announcerEnabled}
                      className="w-full accent-emerald-600 disabled:opacity-40"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-700">
                        Voice Language
                      </label>
                      <select
                        value={settings.voiceLanguage}
                        onChange={(e) => handleChange('voiceLanguage', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="tl">Filipino (Tagalog)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-700">
                        Announcer Voice
                      </label>
                      <select
                        value={settings.voiceGender}
                        onChange={(e) => handleChange('voiceGender', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: AI Intelligence & Institutional Policy ─────────── */}
            <div className="space-y-6">
              {/* AI & Recognition Parameters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">AI Detection &amp; Recognition</h2>
                    <p className="text-xs text-slate-500">Biometric facial matching heuristics</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Threshold */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-700">
                      <span>Recognition Threshold</span>
                      <span className="font-mono text-emerald-600">
                        {(settings.recognitionThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="0.99"
                      step="0.01"
                      value={settings.recognitionThreshold}
                      onChange={(e) => handleChange('recognitionThreshold', parseFloat(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>0.30 (Permissive)</span>
                      <span>0.55 (Balanced)</span>
                      <span>0.99 (Strict)</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                      Recognition Backbone Model
                    </label>
                    <select
                      value={settings.recognitionModel}
                      onChange={(e) => handleChange('recognitionModel', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      <option value="Facenet">Facenet (128-d embeddings)</option>
                      <option value="Facenet512">Facenet-512 (512-d embeddings)</option>
                      <option value="VGG-Face">VGG-Face</option>
                      <option value="ArcFace">ArcFace</option>
                    </select>
                  </div>

                  {/* Alert Mode Toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert
                        size={17}
                        className={settings.alertModeEnabled ? 'text-rose-600' : 'text-slate-400'}
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">Security Alert Mode</span>
                        <p className="text-[11px] text-slate-400">
                          Active monitoring for campus compliance &amp; threats.
                        </p>
                      </div>
                    </div>
                    <ToggleButton
                      value={settings.alertModeEnabled}
                      onChange={(v) => handleChange('alertModeEnabled', v)}
                    />
                  </div>
                </div>
              </div>

              {/* Student Uniform Policy */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Student Uniform Policy</h2>
                    <p className="text-xs text-slate-500">Allowed uniform colors for enrolled students</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-700">Compliant Uniform Colors:</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {[
                      { value: 'dark-blue', label: 'Dark Blue', dot: 'bg-blue-900' },
                      { value: 'light-blue', label: 'Light Blue', dot: 'bg-sky-400' },
                      { value: 'dark-red', label: 'Dark Red', dot: 'bg-red-900' },
                      { value: 'light-red', label: 'Light Red', dot: 'bg-rose-400' },
                      { value: 'white', label: 'White', dot: 'bg-white border border-slate-300' },
                      { value: 'black', label: 'Black', dot: 'bg-slate-900' },
                    ].map((color) => (
                      <label
                        key={color.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                          settings.uniformColors.includes(color.value)
                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={settings.uniformColors.includes(color.value)}
                          onChange={() => toggleUniformColor(color.value)}
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                        />
                        <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
                        <span>{color.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Students wearing unapproved colors will trigger a compliance notice upon check-in.
                  </p>
                </div>
              </div>

              {/* Hand Gesture Confirmation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Hand size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Hand Gesture Confirmation</h2>
                    <p className="text-xs text-slate-500">Require an open palm before recording attendance</p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.gestureAttendanceEnabled}
                    onChange={(e) => handleChange('gestureAttendanceEnabled', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">
                      Require Open-Palm Confirmation
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500 leading-relaxed">
                      Students must raise an open palm to the device camera before attendance is registered.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* System Health Component */}
          <AIStatusIndicator />

          {/* Action Bar */}
          <div className="flex items-center justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? <Check size={15} /> : <Save size={15} />}
              {saving ? 'Saving changes…' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}

      {dialog}
    </div>
  )
}
