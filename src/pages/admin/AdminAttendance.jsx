import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Download, RotateCcw, Users, UserCheck, AlarmClock, Percent } from 'lucide-react'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getAdminSummary, getAttendanceOverview } from '../../services/api'
import { formatDate, formatTime, formatConfidence, toISODate, toPercent } from '../../utils/helpers'

const MOCK_OVERVIEW = {
  records: [
    { id: 1, student_id: 's-101', student_name: 'Maria Santos', student_code: 'STU-1001', section: 'Section A', status: 'present', check_in_time: '2026-09-06T07:45:00Z', confidence: 0.98, class_date: '2026-09-06' },
    { id: 2, student_id: 's-102', student_name: 'Juan Dela Cruz', student_code: 'STU-1002', section: 'Section A', status: 'late', check_in_time: '2026-09-06T08:15:00Z', confidence: 0.92, class_date: '2026-09-06' },
    { id: 3, student_id: 's-103', student_name: 'Carlos Mendoza', student_code: 'STU-1003', section: 'Section B', status: 'present', check_in_time: '2026-09-06T07:50:00Z', confidence: 0.94, class_date: '2026-09-06' },
    { id: 4, student_id: 's-104', student_name: 'Ana Reyes', student_code: 'STU-1004', section: 'Section B', status: 'present', check_in_time: '2026-09-07T07:48:00Z', confidence: 0.95, class_date: '2026-09-07' },
    { id: 5, student_id: 's-105', student_name: 'Miguel Torres', student_code: 'STU-1005', section: 'Section C', status: 'late', check_in_time: '2026-09-07T08:30:00Z', confidence: 0.90, class_date: '2026-09-07' },
    { id: 6, student_id: 's-106', student_name: 'Elena Garcia', student_code: 'STU-1006', section: 'Section C', status: 'present', check_in_time: '2026-09-07T07:52:00Z', confidence: 0.97, class_date: '2026-09-07' },
  ],
  daily: [
    { date: '2026-09-06', total: 3, present: 2, late: 1 },
    { date: '2026-09-07', total: 3, present: 2, late: 1 },
  ],
  total: 6,
}

function defaultRange() {
  const now = new Date()
  return {
    dateFrom: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: toISODate(now),
    section: '',
  }
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  )
}

export default function AdminAttendance() {
  const [draft, setDraft] = useState(defaultRange)
  const [applied, setApplied] = useState(defaultRange)
  const [overview, setOverview] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [usingMock, setUsingMock] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setOffline(false)
    try {
      const data = await getAttendanceOverview({
        date_from: applied.dateFrom,
        date_to: applied.dateTo,
        section: applied.section || undefined,
      })
      setOverview(data && data.records ? data : MOCK_OVERVIEW)
      setUsingMock(!(data && data.records))
    } catch (err) {
      setOverview(MOCK_OVERVIEW)
      setUsingMock(true)
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    getAdminSummary()
      .then((s) => setSections(Array.isArray(s.sections) ? s.sections : []))
      .catch(() => setSections([]))
  }, [])

  const records = overview?.records ?? []
  const daily = overview?.daily ?? []

  const sectionOptions = useMemo(() => {
    const set = new Set(sections)
    records.forEach((r) => r.section && set.add(r.section))
    return Array.from(set).sort()
  }, [sections, records])

  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length
    const late = records.filter((r) => r.status === 'late').length
    const distinct = new Set(records.map((r) => r.student_id || r.student_code)).size
    return { total, present, late, distinct, punctual: toPercent(present, total) }
  }, [records])

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const handleApply = () => setApplied(draft)

  const handleReset = () => {
    const d = defaultRange()
    setDraft(d)
    setApplied(d)
  }

  const handleExport = () => {
    const headers = ['Date', 'Student Name', 'Code', 'Section', 'Status', 'Check-in Time', 'Confidence']
    const rows = records.map((r) => [
      r.class_date,
      r.student_name,
      r.student_code,
      r.section,
      r.status,
      r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('en-US') : '',
      r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : '',
    ])
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((line) => line.map(escape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin_attendance_${applied.dateFrom}_to_${applied.dateTo}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50'
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <div>
        <p className="text-xs text-slate-500">Read-only review of attendance across all classes. No live camera feed is shown here.</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className={labelCls}>Start date</label>
            <input type="date" value={draft.dateFrom} onChange={(e) => updateDraft('dateFrom', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End date</label>
            <input type="date" value={draft.dateTo} onChange={(e) => updateDraft('dateTo', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Section</label>
            <select value={draft.section} onChange={(e) => updateDraft('section', e.target.value)} className={inputCls}>
              <option value="">All sections</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/20 transition-colors"
            >
              <CalendarDays size={15} />
              Apply
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-[#242836] border border-[#2d3148] rounded-lg hover:text-white transition-colors"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {offline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-300">Backend unreachable — showing sample data for review only.</p>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors">
            <RotateCcw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total check-ins" value={loading ? '—' : stats.total} accent="bg-cyan-400/10 text-cyan-300" />
        <StatCard icon={UserCheck} label="Present" value={loading ? '—' : stats.present} accent="bg-cyan-400/10 text-cyan-300" />
        <StatCard icon={AlarmClock} label="Late" value={loading ? '—' : stats.late} accent="bg-amber-500/10 text-amber-300" />
        <StatCard icon={Percent} label="Punctuality" value={loading ? '—' : stats.punctual} accent="bg-cyan-400/10 text-cyan-300" />
        <StatCard icon={Users} label="Distinct students" value={loading ? '—' : stats.distinct} accent="bg-slate-500/10 text-slate-300" />
      </div>

      {/* Per-day breakdown */}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148]">
          <h2 className="text-sm font-semibold text-white">Per-day breakdown</h2>
        </div>
        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : daily.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-600">No daily totals for this range</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#2d3148]">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Present</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Late</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Punctuality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3148]">
                {daily.map((d) => (
                  <tr key={d.date} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-3 text-slate-200">{formatDate(d.date)}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-300">{d.total}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-cyan-300">{d.present}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-amber-300">{d.late}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-300">{toPercent(d.present, d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed records */}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Attendance records</h2>
            <p className="text-xs text-slate-500">{usingMock ? 'Sample data' : `${records.length} check-ins`}</p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || records.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">No attendance records for the selected filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#2d3148]">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Student</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Code</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Section</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Check-in</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3148]">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-3 text-slate-200">{r.student_name}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-400">{r.student_code}</td>
                    <td className="px-6 py-3 text-slate-300">{r.section}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-400">{r.class_date}</td>
                    <td className="px-6 py-3"><Badge status={r.status} /></td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-300">{formatTime(r.check_in_time)}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-300">{formatConfidence(r.confidence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
