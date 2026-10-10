import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, RefreshCw, Download, ShieldAlert, Database, RotateCcw } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'
import { clearAuditLog, getAuditLog } from '../../services/api'
import { formatDate, formatTime, debounce } from '../../utils/helpers'

const MOCK_EVENTS = [
  { id: 1, action: 'auth.login', description: 'Administrator signed in', actor_username: 'admin', actor_role: 'admin', target: 'session', severity: 'info', ip_address: '10.0.0.12', created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
  { id: 2, action: 'teacher.create', description: 'Provisioned teacher account jdelacruz', actor_username: 'admin', actor_role: 'admin', target: 'teacher:jdelacruz', severity: 'warning', ip_address: '10.0.0.12', created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { id: 3, action: 'registration.approve', description: 'Approved pending registration for Grade 8 section A', actor_username: 'admin', actor_role: 'admin', target: 'registration:88', severity: 'info', ip_address: '10.0.0.12', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 4, action: 'teacher.disable', description: 'Disabled compromised teacher account tmarasigan', actor_username: 'admin', actor_role: 'admin', target: 'teacher:tmarasigan', severity: 'critical', ip_address: '10.0.0.31', created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
]

const MOCK_ACTIONS = ['auth.login', 'teacher.create', 'teacher.disable', 'registration.approve']

const SEVERITY_STYLES = {
  info: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  critical: 'bg-red-500/10 text-red-300 border-red-500/30',
}

function SeverityChip({ severity }) {
  const cls = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
  return (
    <span className={`inline-block px-2 py-0.5 rounded uppercase text-[10px] font-semibold tracking-wider border ${cls}`}>
      {severity}
    </span>
  )
}

const CONNECTION_FAILURE = /network error|timeout of|econnrefused|enotfound|socket hang up|failed to fetch|err_network|err_connection|err_internet_disconnected/i
const isConnectionFailure = (msg) => CONNECTION_FAILURE.test(String(msg))

export default function AuditLog() {
  const [events, setEvents] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [limit, setLimit] = useState(100)
  const [offline, setOffline] = useState(false)
  const [setupMissing, setSetupMissing] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const [detail, setDetail] = useState(null)
  const reloadTokenRef = useRef(0)
  const { confirm, dialog } = usePasswordConfirm()

  const appliedSearch = useMemo(() => search.trim(), [search])

  const loadAudit = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLog({ limit, action: action === 'all' ? undefined : action, search: appliedSearch || undefined })
      setEvents(Array.isArray(data.events) ? data.events : [])
      setActions(Array.isArray(data.actions) ? data.actions : [])
      setOffline(false)
      setSetupMissing(false)
      setServerMessage('')
    } catch (err) {
      const msg = err?.message || 'Request failed'
      if (isConnectionFailure(msg)) {
        setEvents(MOCK_EVENTS)
        setActions(MOCK_ACTIONS)
        setOffline(true)
        setSetupMissing(false)
      } else {
        setEvents([])
        setActions([])
        setOffline(false)
        setSetupMissing(true)
        setServerMessage(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [limit, action, appliedSearch])

  useEffect(() => {
    loadAudit()
  }, [loadAudit])

  const commitSearch = useMemo(() => debounce((val) => setSearch(val), 400), [])

  const handleRefresh = () => {
    reloadTokenRef.current += 1
    loadAudit()
  }

  const handleExport = () => {
    const headers = ['Timestamp', 'Severity', 'Action', 'Actor', 'Role', 'Target', 'IP', 'Description']
    const rows = events.map((e) => [
      e.created_at,
      e.severity,
      e.action,
      e.actor_username,
      e.actor_role,
      e.target,
      e.ip_address,
      e.description,
    ])
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((line) => line.map(escape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    confirm(
      async (password) => {
        await clearAuditLog(password)
        loadAudit()
      },
      {
        title: 'Reset the audit log',
        description: `This permanently deletes all ${events.length} recorded event(s). Only the reset itself stays behind, so the wipe is not a silent gap in the history.`,
        confirmLabel: 'Clear log',
      },
    )
  }

  const inputCls = 'px-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50'

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      {dialog}
      <div>
        <p className="text-xs text-slate-500">Review who did what across the system — logins, account changes, and registrations.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search actor, action, or description..."
              defaultValue={search}
              onChange={(e) => commitSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputCls} w-full min-w-0 max-w-full lg:w-auto`}>
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={`${inputCls} w-full min-w-0 lg:w-auto`}>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={250}>Last 250</option>
            <option value={500}>Last 500</option>
          </select>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 rounded-lg transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={events.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-[#242836] border border-[#2d3148] rounded-lg hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={handleReset}
              disabled={loading || offline || setupMissing || events.length === 0}
              title="Permanently delete every recorded event"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              Reset log
            </button>
          </div>
        </div>
      </div>

      {offline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-300">Backend unreachable — showing sample audit events for review only.</p>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors">
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {setupMissing && (
        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-400/10 text-cyan-300 shrink-0">
              <Database size={18} />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-white">Audit persistence is not set up yet</h2>
              <p className="text-xs text-slate-400">
                The audit log table does not exist in the database. Open the Supabase SQL Editor and run
                <span className="font-mono text-[11px] text-cyan-300"> backend/database/admin_schema.sql</span> to create it, then refresh this page.
              </p>
              {serverMessage && (
                <p className="text-[11px] font-mono text-slate-500 bg-[#242836] border border-[#2d3148] rounded-lg px-3 py-2">
                  {serverMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events table */}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recorded events</h2>
          <span className="text-xs text-slate-400">{setupMissing ? '0 events' : `${events.length} loaded`}</span>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : events.length === 0 && !setupMissing ? (
          <div className="py-16 text-center text-sm text-slate-600">No audit events match the criteria</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <ShieldAlert size={16} className="text-slate-500" />
            Awaiting audit persistence setup
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#2d3148]">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Time</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Severity</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Action</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Actor</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Target</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3148]">
                {events.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setDetail(e)}
                    className="hover:bg-white/[0.01] cursor-pointer"
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-slate-300">{formatDate(e.created_at)}</span>
                      <span className="font-mono text-[11px] text-slate-500 ml-2">{formatTime(e.created_at)}</span>
                    </td>
                    <td className="px-6 py-3"><SeverityChip severity={e.severity} /></td>
                    <td className="px-6 py-3 font-mono text-[11px] text-cyan-300">{e.action}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-slate-200">{e.actor_username}</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">{e.actor_role}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-400">{e.target}</td>
                    <td className="px-6 py-3 text-slate-300">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Audit event detail" size="md">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-cyan-300">{detail.action}</span>
              <SeverityChip severity={detail.severity} />
            </div>
            <p className="text-slate-200">{detail.description}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-slate-500 uppercase tracking-wide">Actor</dt>
              <dd className="text-slate-200">{detail.actor_username} <span className="text-slate-500">({detail.actor_role})</span></dd>
              <dt className="text-slate-500 uppercase tracking-wide">Target</dt>
              <dd className="font-mono text-[11px] text-slate-300">{detail.target}</dd>
              <dt className="text-slate-500 uppercase tracking-wide">IP address</dt>
              <dd className="font-mono text-[11px] text-slate-300">{detail.ip_address}</dd>
              <dt className="text-slate-500 uppercase tracking-wide">Raw timestamp</dt>
              <dd className="font-mono text-[11px] text-slate-300 break-all">{detail.created_at}</dd>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}
