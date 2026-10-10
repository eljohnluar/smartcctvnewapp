import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Check,
  FlipHorizontal,
  Hand,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Volume2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'
import {
  getGestureAttendanceSettings,
  getRuntimeControls,
  getSystemStatus,
  getTeacherAccounts,
  getVoiceSettings,
  updateGestureAttendanceSettings,
  updateRuntimeControls,
  updateVoiceSettings,
} from '../../services/api'
import { readStoredSettings, saveStoredSettings } from '../../utils/settings'

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

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export default function AdminSettings({ embedded = false }) {
  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState(false)

  const [accounts, setAccounts] = useState(null)
  const [accountsLoading, setAccountsLoading] = useState(true)

  const [controls, setControls] = useState({
    alertModeEnabled: true,
    announcerEnabled: true,
    announcerVolume: 100,
    cameraFlipHorizontal: true,
    gestureAttendanceEnabled: false,
    voiceGender: 'female',
  })
  const [controlsSaving, setControlsSaving] = useState(false)
  const { confirm, dialog } = usePasswordConfirm()

  const [prefs, setPrefs] = useState(() => {
    const stored = readStoredSettings()
    return {
      defaultAuditPageSize: stored.defaultAuditPageSize ?? 50,
    }
  })

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(false)
    try {
      const data = await getSystemStatus()
      setStatus(data)
    } catch {
      setStatus(null)
      setStatusError(true)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const data = await getTeacherAccounts({})
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : [])
    } catch {
      setAccounts(null)
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    loadAccounts()

    getRuntimeControls()
      .then((c) =>
        setControls((prev) => ({
          ...prev,
          alertModeEnabled: Boolean(c.alert_mode_enabled),
          announcerEnabled: Boolean(c.announcer_enabled),
          announcerVolume: c.announcer_volume ?? 100,
          cameraFlipHorizontal: Boolean(c.camera_flip_horizontal),
        })),
      )
      .catch(() => {})

    getGestureAttendanceSettings()
      .then((g) =>
        setControls((prev) => ({
          ...prev,
          gestureAttendanceEnabled: Boolean(g.gesture_attendance_enabled),
        })),
      )
      .catch(() => {})

    getVoiceSettings()
      .then((v) =>
        setControls((prev) => ({
          ...prev,
          voiceGender: v.voice_gender || 'female',
        })),
      )
      .catch(() => {})
  }, [loadStatus, loadAccounts])

  const setControl = (field, value) => setControls((prev) => ({ ...prev, [field]: value }))

  const saveControls = async () => {
    setControlsSaving(true)
    const saved = await confirm(
      async (password) => {
        await updateRuntimeControls(
          {
            camera_flip_horizontal: controls.cameraFlipHorizontal,
            announcer_enabled: controls.announcerEnabled,
            announcer_volume: controls.announcerVolume,
            alert_mode_enabled: controls.alertModeEnabled,
          },
          password,
        )
        await updateGestureAttendanceSettings(controls.gestureAttendanceEnabled, password)
        await updateVoiceSettings(controls.voiceGender, password)
      },
      {
        title: 'Confirm operational controls',
        description: 'Changing global campus policies requires your administrator password.',
        confirmLabel: 'Save operational controls',
      },
    )
    setControlsSaving(false)
    if (!saved) return
    toast.success('Administrator operational controls updated')
  }

  const savePrefs = () => {
    try {
      saveStoredSettings({
        defaultAuditPageSize: Number(prefs.defaultAuditPageSize),
      })
      toast.success('Console preferences saved')
    } catch {
      toast.error('Could not save console preferences')
    }
  }

  const counts = accounts
    ? {
        total: accounts.length,
        teachers: accounts.filter((a) => a.role === 'teacher').length,
        admins: accounts.filter((a) => a.role === 'admin' || a.role === 'administrator').length,
        active: accounts.filter((a) => a.is_active).length,
        disabled: accounts.filter((a) => !a.is_active).length,
      }
    : null

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="mb-2">
          <h1 className="text-xl font-bold text-slate-900">Administrator Console</h1>
          <p className="text-xs text-slate-500">
            System health diagnostics, access overview, and global operational controls.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Card 1 — System Health & Infrastructure */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">System Health</h2>
                <p className="text-xs text-slate-500">Backend infrastructure diagnostics</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadStatus}
              disabled={statusLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <RefreshCw size={13} className={statusLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {statusLoading ? (
            <div className="py-12">
              <LoadingSpinner size="sm" />
            </div>
          ) : statusError || !status ? (
            <div className="py-8 text-center text-slate-500">
              <p className="text-xs font-medium">Backend status currently unreachable.</p>
              <button
                type="button"
                onClick={loadStatus}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <RotateCcw size={13} /> Retry connection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    String(status.status).toLowerCase() === 'online' || status.status === 'ok'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Status: {status.status || 'Online'}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  AI Pipeline: {status.ai_active ? 'Active' : 'Standby'}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  Recording: {status.attendance_recording ? 'Enabled' : 'Paused'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="Capture FPS" value={status.fps ?? '15–30 FPS'} />
                <Metric label="Backbone Model" value={status.recognition_model ?? 'Facenet'} />
                <Metric label="Enrolled Students" value={status.active_students_count ?? '0'} />
                <Metric
                  label="Unresolved Alerts"
                  value={
                    <span className="text-amber-600 font-bold">
                      {status.unresolved_alerts_count ?? status.unresolved_alert_count ?? '0'}
                    </span>
                  }
                />
                <Metric label="Environment" value="Production" />
                <Metric label="Device Video" value="Direct MediaStream" />
              </div>
            </div>
          )}
        </div>

        {/* Card 2 — Access Control & Accounts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Access Control</h2>
                <p className="text-xs text-slate-500">Teacher and administrator credentials overview</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadAccounts}
              disabled={accountsLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <RefreshCw size={13} className={accountsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {accountsLoading ? (
            <div className="py-12">
              <LoadingSpinner size="sm" />
            </div>
          ) : !counts ? (
            <div className="py-8 text-center text-slate-500">
              <p className="text-xs font-medium">Could not load accounts overview.</p>
              <button
                type="button"
                onClick={loadAccounts}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="Total Accounts" value={counts.total} />
                <Metric label="Teachers" value={counts.teachers} />
                <Metric label="Administrators" value={counts.admins} />
                <Metric
                  label="Active Accounts"
                  value={<span className="text-emerald-600">{counts.active}</span>}
                />
                <Metric
                  label="Disabled Accounts"
                  value={<span className="text-slate-400">{counts.disabled}</span>}
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Teacher profiles and section assignments are managed securely with Supabase row-level security.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Administrator password re-confirmation is enforced on all high-privilege configuration mutations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Global Operational Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Operational Controls</h2>
              <p className="text-xs text-slate-500">Global server-wide behavior and security rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert
                  size={16}
                  className={controls.alertModeEnabled ? 'text-rose-600' : 'text-slate-400'}
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">Security Alert Mode</span>
                  <p className="text-[11px] text-slate-400">Campus perimeter &amp; anomaly detection.</p>
                </div>
              </div>
              <ToggleButton
                value={controls.alertModeEnabled}
                onChange={(v) => setControl('alertModeEnabled', v)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Volume2 size={16} className="text-emerald-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-800">Voice Announcer</span>
                  <p className="text-[11px] text-slate-400">Speak student check-ins and security notifications.</p>
                </div>
              </div>
              <ToggleButton
                value={controls.announcerEnabled}
                onChange={(v) => setControl('announcerEnabled', v)}
              />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-700">
                <span>Announcer Volume</span>
                <span className="font-mono text-emerald-600">{controls.announcerVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={controls.announcerVolume}
                onChange={(e) => setControl('announcerVolume', Number(e.target.value))}
                disabled={!controls.announcerEnabled}
                className="w-full accent-emerald-600 disabled:opacity-40"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <FlipHorizontal size={16} className="text-emerald-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-800">Mirror Camera Preview</span>
                  <p className="text-[11px] text-slate-400">Horizontal flip for device camera inputs.</p>
                </div>
              </div>
              <ToggleButton
                value={controls.cameraFlipHorizontal}
                onChange={(v) => setControl('cameraFlipHorizontal', v)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Hand size={16} className="text-emerald-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Open-Palm Gesture Requirement
                  </span>
                  <p className="text-[11px] text-slate-400">Require hand gesture during biometric matching.</p>
                </div>
              </div>
              <ToggleButton
                value={controls.gestureAttendanceEnabled}
                onChange={(v) => setControl('gestureAttendanceEnabled', v)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Announcer Voice</label>
              <select
                value={controls.voiceGender}
                onChange={(e) => setControl('voiceGender', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveControls}
              disabled={controlsSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              {controlsSaving ? <Check size={14} /> : <Save size={14} />}
              {controlsSaving ? 'Saving…' : 'Save Operational Controls'}
            </button>
          </div>
        </div>

        {/* Card 4 — Console Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Settings2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Console Preferences</h2>
              <p className="text-xs text-slate-500">Stored locally in your browser (device preferences)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Default Audit Log Page Size
              </label>
              <select
                value={prefs.defaultAuditPageSize}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, defaultAuditPageSize: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value={50}>50 events per page</option>
                <option value={100}>100 events per page</option>
                <option value={250}>250 events per page</option>
                <option value={500}>500 events per page</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-800">Camera Source Standard</p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Device cameras are standard for all users. The admin console does not mount a camera preview, preserving bandwidth and privacy for supervisory tasks.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={savePrefs}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Save size={14} /> Save Console Preferences
            </button>
          </div>
        </div>
      </div>

      {dialog}
    </div>
  )
}
