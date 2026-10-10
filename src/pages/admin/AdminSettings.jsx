import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Users, SlidersHorizontal, Settings2, Save, RotateCcw, Volume2, FlipHorizontal, ShieldAlert, Hand, ShieldCheck, Lock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  getSystemStatus,
  getTeacherAccounts,
  getRuntimeControls,
  updateRuntimeControls,
  getGestureAttendanceSettings,
  updateGestureAttendanceSettings,
  getVoiceSettings,
  updateVoiceSettings,
} from '../../services/api'
import { SETTINGS_STORAGE_KEY, readStoredSettings } from '../../utils/settings'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'

function ToggleButton({ value, onChange, onLabel = 'On', offLabel = 'Off' }) {
  return (
    <div className="inline-flex rounded-lg border border-[#2d3148] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
          value ? 'bg-cyan-400 text-black' : 'bg-[#242836] text-slate-400 hover:text-white'
        }`}
      >
        {onLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
          !value ? 'bg-red-500/80 text-white' : 'bg-[#242836] text-slate-400 hover:text-white'
        }`}
      >
        {offLabel}
      </button>
    </div>
  )
}

function Chip({ tone, children }) {
  const tones = {
    ok: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
    on: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
    off: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-300 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.off}`}>
      {children}
    </span>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 mt-0.5">{value}</p>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50'
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

export default function AdminSettings() {
  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState(false)

  const [accounts, setAccounts] = useState(null)
  const [accountsLoading, setAccountsLoading] = useState(true)

  const [controls, setControls] = useState({
    alertModeEnabled: true,
    announcerEnabled: true,
    announcerVolume: 100,
    cameraFlipHorizontal: false,
    gestureAttendanceEnabled: false,
    voiceGender: 'female',
  })
  const [controlsSaving, setControlsSaving] = useState(false)
  const { confirm, dialog } = usePasswordConfirm()

  const [prefs, setPrefs] = useState(() => {
    const stored = readStoredSettings()
    return {
      defaultAuditPageSize: stored.defaultAuditPageSize ?? 50,
      liveFeedCamera: stored.liveFeedCamera === 'webcam' ? 'webcam' : 'virtual',
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
      setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
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
      .then((c) => setControls((prev) => ({
        ...prev,
        alertModeEnabled: Boolean(c.alert_mode_enabled),
        announcerEnabled: Boolean(c.announcer_enabled),
        announcerVolume: c.announcer_volume ?? 100,
        cameraFlipHorizontal: Boolean(c.camera_flip_horizontal),
      })))
      .catch(() => {})
    getGestureAttendanceSettings()
      .then((g) => setControls((prev) => ({ ...prev, gestureAttendanceEnabled: Boolean(g.gesture_attendance_enabled) })))
      .catch(() => {})
    getVoiceSettings()
      .then((v) => setControls((prev) => ({ ...prev, voiceGender: v.voice_gender || 'female' })))
      .catch(() => {})
  }, [loadStatus, loadAccounts])

  const setControl = (field, value) => setControls((prev) => ({ ...prev, [field]: value }))

  const saveControls = async () => {
    setControlsSaving(true)
    const saved = await confirm(async (password) => {
      await updateRuntimeControls({
        camera_flip_horizontal: controls.cameraFlipHorizontal,
        announcer_enabled: controls.announcerEnabled,
        announcer_volume: controls.announcerVolume,
        alert_mode_enabled: controls.alertModeEnabled,
      }, password)
      await updateGestureAttendanceSettings(controls.gestureAttendanceEnabled, password)
      await updateVoiceSettings(controls.voiceGender, password)
    }, {
      title: 'Confirm operational controls',
      description: 'Changing detection, announcer and voice settings requires your account password.',
      confirmLabel: 'Save controls',
    })
    setControlsSaving(false)
    if (!saved) return
    toast.success('Operational controls updated')
  }

  const savePrefs = () => {
    try {
      const merged = { ...readStoredSettings(), defaultAuditPageSize: Number(prefs.defaultAuditPageSize), liveFeedCamera: prefs.liveFeedCamera }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged))
      toast.success('Console preferences saved')
    } catch {
      toast.error('Could not save console preferences')
    }
  }

  const counts = accounts ? {
    total: accounts.length,
    teachers: accounts.filter((a) => a.role === 'teacher').length,
    admins: accounts.filter((a) => a.role === 'admin' || a.role === 'administrator').length,
    active: accounts.filter((a) => a.is_active).length,
    disabled: accounts.filter((a) => !a.is_active).length,
  } : null

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <div>
        <p className="text-xs text-slate-500">Infrastructure health, access policy, and operational controls. No live camera feed appears in the admin console.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1 — System health */}
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-300"><Activity size={18} /></div>
              <div>
                <h2 className="text-sm font-semibold text-white">System Health</h2>
                <p className="text-xs text-slate-500">Read-only infrastructure status</p>
              </div>
            </div>
            <button
              onClick={loadStatus}
              disabled={statusLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 rounded-lg transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={statusLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {statusLoading ? (
            <div className="py-12"><LoadingSpinner size="sm" /></div>
          ) : statusError || !status ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">Backend status unavailable.</p>
              <button onClick={loadStatus} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200">
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Chip tone={String(status.status).toLowerCase() === 'online' || status.status === 'ok' ? 'ok' : 'warn'}>
                  Status: {status.status}
                </Chip>
                <Chip tone={status.camera_active ? 'on' : 'off'}>Camera {status.camera_active ? 'active' : 'idle'}</Chip>
                <Chip tone={status.ai_active ? 'on' : 'off'}>AI {status.ai_active ? 'active' : 'idle'}</Chip>
                <Chip tone={status.attendance_recording ? 'on' : 'off'}>Attendance {status.attendance_recording ? 'recording' : 'paused'}</Chip>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Camera index" value={<span className="font-mono text-[11px]">{status.camera_index ?? '—'}</span>} />
                <Metric label="Capture FPS" value={<span className="font-mono text-[11px]">{status.fps ?? '—'}</span>} />
                <Metric label="Recognition model" value={status.recognition_model ?? '—'} />
                <Metric label="Active students" value={<span className="font-mono text-[11px]">{status.active_students_count ?? 0}</span>} />
                <Metric label="Unresolved alerts" value={<span className="font-mono text-[11px] text-amber-300">{status.unresolved_alerts_count ?? status.unresolved_alert_count ?? 0}</span>} />
              </div>
              <p className="text-[11px] text-slate-500">Values reflect the backend processing pipeline. Change these in the teacher monitoring console, not here.</p>
            </div>
          )}
        </div>

        {/* Card 2 — Access control */}
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-300"><Users size={18} /></div>
            <div>
              <h2 className="text-sm font-semibold text-white">Access Control</h2>
              <p className="text-xs text-slate-500">Read-only account overview</p>
            </div>
          </div>

          {accountsLoading ? (
            <div className="py-12"><LoadingSpinner size="sm" /></div>
          ) : !counts ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">Could not load accounts.</p>
              <button onClick={loadAccounts} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200">
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="Total accounts" value={<span className="font-mono text-[11px]">{counts.total}</span>} />
                <Metric label="Teachers" value={<span className="font-mono text-[11px]">{counts.teachers}</span>} />
                <Metric label="Administrators" value={<span className="font-mono text-[11px]">{counts.admins}</span>} />
                <Metric label="Active" value={<span className="font-mono text-[11px] text-cyan-300">{counts.active}</span>} />
                <Metric label="Disabled" value={<span className="font-mono text-[11px] text-amber-300">{counts.disabled}</span>} />
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
                <ShieldCheck size={16} className="text-cyan-300 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-400">
                  Accounts are provisioned in{' '}
                  <Link to="/admin/teachers" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4">Teacher Management</Link>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
                <Lock size={16} className="text-cyan-300 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-400">
                  New accounts require an administrator clearance code, which is never displayed in this console. Teacher logins are created directly in Teacher Management.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Operational controls */}
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-300"><SlidersHorizontal size={18} /></div>
            <div>
              <h2 className="text-sm font-semibold text-white">Operational Controls</h2>
              <p className="text-xs text-slate-500">Global backend behavior — saved to the server</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={16} className={controls.alertModeEnabled ? 'text-red-400' : 'text-slate-500'} />
                <div>
                  <span className="text-sm text-slate-300">Security alert mode</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real-time threat detection and alerts.</p>
                </div>
              </div>
              <ToggleButton value={controls.alertModeEnabled} onChange={(v) => setControl('alertModeEnabled', v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Volume2 size={16} className="text-cyan-300" />
                <div>
                  <span className="text-sm text-slate-300">Voice announcer</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Announce check-ins and alerts aloud.</p>
                </div>
              </div>
              <ToggleButton value={controls.announcerEnabled} onChange={(v) => setControl('announcerEnabled', v)} />
            </div>

            <div>
              <label className={labelCls}>Announcer volume ({controls.announcerVolume}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={controls.announcerVolume}
                onChange={(e) => setControl('announcerVolume', Number(e.target.value))}
                disabled={!controls.announcerEnabled}
                className="w-full accent-cyan-400 disabled:opacity-40"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <FlipHorizontal size={16} className="text-cyan-300" />
                <div>
                  <span className="text-sm text-slate-300">Flip camera horizontally</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mirror the monitored feed left to right.</p>
                </div>
              </div>
              <ToggleButton value={controls.cameraFlipHorizontal} onChange={(v) => setControl('cameraFlipHorizontal', v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#2d3148] bg-[#242836] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Hand size={16} className="text-cyan-300" />
                <div>
                  <span className="text-sm text-slate-300">Gesture attendance confirmation</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Require an open palm before recording attendance.</p>
                </div>
              </div>
              <ToggleButton value={controls.gestureAttendanceEnabled} onChange={(v) => setControl('gestureAttendanceEnabled', v)} />
            </div>

            <div>
              <label className={labelCls}>Announcer voice</label>
              <select value={controls.voiceGender} onChange={(e) => setControl('voiceGender', e.target.value)} className={inputCls}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={saveControls}
              disabled={controlsSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-cyan-400 text-black rounded-lg hover:bg-cyan-300 disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            >
              <Save size={16} />
              {controlsSaving ? 'Saving...' : 'Save Controls'}
            </button>
          </div>
        </div>

        {/* Card 4 — Console preferences */}
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-300"><Settings2 size={18} /></div>
            <div>
              <h2 className="text-sm font-semibold text-white">Console Preferences</h2>
              <p className="text-xs text-slate-500">Stored on this device only (localStorage)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Default audit page size</label>
              <select
                value={prefs.defaultAuditPageSize}
                onChange={(e) => setPrefs((prev) => ({ ...prev, defaultAuditPageSize: Number(e.target.value) }))}
                className={inputCls}
              >
                <option value={50}>50 events</option>
                <option value={100}>100 events</option>
                <option value={250}>250 events</option>
                <option value={500}>500 events</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Live feed source</label>
              <select
                value={prefs.liveFeedCamera}
                onChange={(e) => setPrefs((prev) => ({ ...prev, liveFeedCamera: e.target.value }))}
                className={inputCls}
              >
                <option value="virtual">Virtual Camera</option>
                <option value="webcam">Browser webcam</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                This preference applies to the teacher monitoring console, which reads it for its live window. The admin console has no camera feed, so changing it here does not preview video.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={savePrefs}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/20 transition-colors"
            >
              <Save size={16} />
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {dialog}
    </div>
  )
}
