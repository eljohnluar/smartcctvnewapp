import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  GraduationCap,
  Layers,
  RefreshCw,
  ShieldCheck,
  Users,
  UserCog,
} from 'lucide-react'
import { getAdminSummary, getAuditLog } from '../../services/api'
import { useApp } from '../../context/AppContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const MOCK_SUMMARY = {
  teacher_count: 8,
  active_teacher_count: 6,
  admin_count: 2,
  student_count: 214,
  section_count: 5,
  attendance_today: { total: 214, present: 189, late: 12 },
  unresolved_alert_count: 3,
  sections: ['Section A', 'Section B', 'Section C', 'Section D', 'Section E'],
  recent_accounts: [
    {
      id: 12,
      username: 'j.delacruz',
      full_name: 'Juan Dela Cruz',
      email: 'juan.delacruz@smartcctv.edu',
      role: 'teacher',
      is_active: true,
      last_login_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 11,
      username: 'm.ramos',
      full_name: 'Maria Ramos',
      email: 'maria.ramos@smartcctv.edu',
      role: 'teacher',
      is_active: true,
      last_login_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 10,
      username: 'a.santos',
      full_name: 'Andres Santos',
      email: 'andres.santos@smartcctv.edu',
      role: 'admin',
      is_active: false,
      last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    },
  ],
}

const MOCK_ACTIVITY = [
  {
    id: 501,
    action: 'teacher.create',
    description: 'Provisioned account j.delacruz',
    actor_username: 'admin',
    actor_role: 'admin',
    target: 'j.delacruz',
    severity: 'info',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 500,
    action: 'auth.login',
    description: 'Administrator signed in',
    actor_username: 'admin',
    actor_role: 'admin',
    target: 'session',
    severity: 'info',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
  },
  {
    id: 499,
    action: 'teacher.disable',
    description: 'Disabled account a.santos',
    actor_username: 'admin',
    actor_role: 'admin',
    target: 'a.santos',
    severity: 'warning',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

function relativeTime(iso) {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function severityChip(severity) {
  switch (severity) {
    case 'error':
    case 'critical':
      return 'bg-red-500/10 text-red-300 border-red-500/30'
    case 'warning':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    default:
      return 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
  }
}

function StatCard({ icon: Icon, label, value, sub, hint }) {
  return (
    <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-cyan-400/10">
          <Icon size={18} className="text-cyan-300" />
        </div>
        {hint && <span className="text-[11px] text-slate-600 mt-1">{hint}</span>}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white mt-4">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs mt-2 font-medium text-cyan-300">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { systemStatus } = useApp()
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [auditAvailable, setAuditAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let usingMock = false
    let data = null
    try {
      data = await getAdminSummary()
    } catch {
      data = MOCK_SUMMARY
      usingMock = true
    }
    setSummary(data)
    setOffline(usingMock)

    try {
      const log = await getAuditLog({ limit: 6 })
      if (log && Array.isArray(log.events)) {
        setActivity(log.events.slice(0, 6))
        setAuditAvailable(true)
      } else {
        setActivity(usingMock ? MOCK_ACTIVITY : [])
        setAuditAvailable(!usingMock)
      }
    } catch {
      setActivity(usingMock ? MOCK_ACTIVITY : [])
      setAuditAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const statusChip = {
    online: { text: 'System Online', cls: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20', dot: 'bg-cyan-400' },
    processing: { text: 'Processing', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400' },
    error: { text: 'System Error', cls: 'text-red-300 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
    offline: { text: 'Backend Offline', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
  }[systemStatus] || { text: 'Unknown', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' }

  const attendance = summary?.attendance_today || { total: 0, present: 0, late: 0 }
  const rate = attendance.total ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <p className="text-xs text-slate-500">Provisioning, attendance overview and audit activity for the campus.</p>
        </div>
        <div className="py-24"><LoadingSpinner /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6 text-center space-y-4">
          <AlertTriangle size={22} className="text-red-400 mx-auto" />
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Provisioning, attendance overview and audit activity for the campus.</p>
        </div>
        <div className="flex items-center gap-2">
          {offline && (
            <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Mock data
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusChip.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusChip.dot}`} />
            {statusChip.text}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Users}
          label="Faculty accounts"
          value={`${summary.active_teacher_count}/${summary.teacher_count}`}
          sub={`${summary.admin_count} admin${summary.admin_count === 1 ? '' : 's'}`}
        />
        <StatCard icon={GraduationCap} label="Students enrolled" value={summary.student_count} />
        <StatCard icon={Layers} label="Sections" value={summary.section_count} />
        <StatCard
          icon={CalendarCheck}
          label="Attendance today"
          value={`${attendance.present + attendance.late}`}
          sub={`${attendance.present} present · ${attendance.late} late`}
          hint={`${rate}%`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Unresolved alerts"
          value={summary.unresolved_alert_count}
          sub={summary.unresolved_alert_count > 0 ? 'Needs review' : 'All clear'}
        />
        <StatCard
          icon={ShieldCheck}
          label="System status"
          value={statusChip.text}
          hint="Live"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent sign-ups / accounts</h2>
            <span className="text-xs text-slate-500">{summary.recent_accounts?.length ?? 0} shown</span>
          </div>
          {(summary.recent_accounts ?? []).length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600">No accounts provisioned yet</div>
          ) : (
            <div className="divide-y divide-[#2d3148]">
              {summary.recent_accounts.map((acct) => (
                <div key={acct.id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">{acct.full_name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${
                        acct.role === 'admin'
                          ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                          : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                      }`}>
                        {acct.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-mono text-[11px] text-slate-400">@{acct.username}</span>
                      {' · '}last seen {relativeTime(acct.last_login_at)}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border shrink-0 ${
                    acct.is_active
                      ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {acct.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Latest activity</h2>
            <span className="text-xs text-slate-500">Last {activity.length} events</span>
          </div>
          {!auditAvailable ? (
            <div className="px-6 py-10 text-center">
              <Activity size={20} className="text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Audit history is not available yet — run
                {' '}<span className="font-mono text-[11px] text-cyan-300">backend/database/admin_schema.sql</span>
                {' '}in Supabase.
              </p>
            </div>
          ) : activity.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600">No recorded activity yet</div>
          ) : (
            <div className="divide-y divide-[#2d3148]">
              {activity.map((ev) => (
                <div key={ev.id} className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-cyan-300">{ev.action}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${severityChip(ev.severity)}`}>
                        {ev.severity || 'info'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{ev.description}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      by <span className="font-mono text-slate-500">{ev.actor_username}</span>
                      {ev.target ? ` · ${ev.target}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">{relativeTime(ev.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white">Quick links</h2>
        <p className="text-xs text-slate-500 mt-1">Jump to a console section.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mt-4">
          <Link
            to="/admin/teachers"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <UserCog size={15} /> Faculty
          </Link>
          <Link
            to="/admin/attendance"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <CalendarCheck size={15} /> Attendance
          </Link>
          <Link
            to="/admin/audit"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <Activity size={15} /> Audit log
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <ShieldCheck size={15} /> Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
