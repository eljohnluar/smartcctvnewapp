import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAllAlerts, resolveAlert } from '../services/data'
import { formatDateTime } from '../utils/helpers'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_META = {
  weapon_detected: { label: 'Weapon detected', icon: ShieldAlert, tone: 'bg-rose-50 text-rose-600' },
  trespasser: { label: 'Trespasser', icon: UserX, tone: 'bg-orange-50 text-orange-600' },
  compliance_violation: { label: 'Uniform compliance', icon: Shield, tone: 'bg-amber-50 text-amber-600' },
  unknown_face: { label: 'Unknown face', icon: Users, tone: 'bg-sky-50 text-sky-600' },
}

const SEVERITY_BADGE = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      setAlerts(await fetchAllAlerts())
    } catch (err) {
      toast.error(err.message || 'Could not load alerts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id)
      setAlerts((previous) =>
        previous.map((alert) => (alert.id === id ? { ...alert, is_resolved: true } : alert)),
      )
      toast.success('Alert marked as resolved.')
    } catch (err) {
      toast.error(err.message || 'Could not update the alert.')
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return alerts.filter((alert) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? !alert.is_resolved
            : alert.is_resolved
      const matchesType = typeFilter === 'all' || alert.type === typeFilter
      const matchesSearch =
        !query ||
        (alert.description || '').toLowerCase().includes(query) ||
        (alert.type || '').toLowerCase().includes(query)
      return matchesStatus && matchesType && matchesSearch
    })
  }, [alerts, statusFilter, typeFilter, search])

  const activeCount = alerts.filter((alert) => !alert.is_resolved).length

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="cursor-pointer bg-transparent text-xs text-slate-700 focus:outline-none"
            >
              <option value="active">Active only</option>
              <option value="resolved">Resolved only</option>
              <option value="all">All statuses</option>
            </select>
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={`${selectClass} cursor-pointer`}
          >
            <option value="all">All event types</option>
            {Object.entries(TYPE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-900">Security incidents</h2>
          </div>
          <span className="text-xs text-slate-400">
            {activeCount} active · {filtered.length} shown
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading alerts…" />
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            No incidents match the current filters.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((alert) => {
              const meta = TYPE_META[alert.type] || TYPE_META.unknown_face
              const Icon = meta.icon
              return (
                <li
                  key={alert.id}
                  className={`flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between ${
                    alert.is_resolved ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-slate-900">{alert.description}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            alert.is_resolved
                              ? 'bg-slate-100 text-slate-500'
                              : SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.low
                          }`}
                        >
                          {alert.is_resolved ? 'Resolved' : alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {meta.label} · {formatDateTime(alert.created_at)}
                      </p>
                    </div>
                  </div>

                  {!alert.is_resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolve(alert.id)}
                      className="flex shrink-0 items-center gap-1.5 self-end rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 sm:self-auto"
                    >
                      <CheckCircle2 size={14} />
                      Mark resolved
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
