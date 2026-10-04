import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, RefreshCw, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAttendanceRange } from '../services/data'
import { useScopedStudents } from '../hooks/useScopedStudents'
import { formatTime, initials, toISODate } from '../utils/helpers'
import LoadingSpinner from '../components/common/LoadingSpinner'

function StatusBadge({ status }) {
  const isLate = status === 'late'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isLate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isLate ? <Clock size={11} /> : <CheckCircle2 size={11} />}
      {isLate ? 'Late' : 'Present'}
    </span>
  )
}

export default function Dashboard() {
  const { students, loading: studentsLoading } = useScopedStudents()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const scopedStudentIds = useMemo(() => new Set(students.map((student) => student.id)), [students])

  const load = useCallback(async () => {
    try {
      const todayISO = toISODate(new Date())
      const records = await fetchAttendanceRange(todayISO, todayISO)
      setAttendance(records.filter((record) => scopedStudentIds.has(record.student_id)))
    } catch (err) {
      toast.error(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [scopedStudentIds])

  useEffect(() => {
    if (!studentsLoading) load()
  }, [studentsLoading, load])

  const handleRefresh = () => {
    setLoading(true)
    load()
  }

  const present = attendance.filter((record) => record.status === 'present').length
  const late = attendance.filter((record) => record.status === 'late').length
  const rate = students.length > 0 ? Math.round(((present + late) / students.length) * 100) : 0

  const stats = [
    {
      label: 'Checked in today',
      value: present + late,
      hint: `${students.length} students enrolled`,
      icon: UserCheck,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Arrived late',
      value: late,
      hint: 'After the cut-off time',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Attendance rate',
      value: `${rate}%`,
      hint: 'Of your enrolled students',
      icon: CheckCircle2,
      tone: 'bg-sky-50 text-sky-600',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Today&apos;s overview</h2>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{loading && !attendance.length ? '—' : value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
            <p className="text-[11px] text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      {/* Today's check-ins */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Today&apos;s check-ins</h3>
            <span className="text-xs text-slate-400">{attendance.length} recorded</span>
          </div>
          {loading && !attendance.length ? (
            <LoadingSpinner label="Loading attendance…" />
          ) : attendance.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">
              No check-ins recorded yet today.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attendance.slice(0, 12).map((record) => (
                <li key={record.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {initials(record.students?.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {record.students?.full_name ?? `Student #${record.student_id}`}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {record.students?.student_id} · {record.students?.section || 'No section'}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium text-slate-700">{formatTime(record.check_in_time)}</p>
                    <p className="text-[11px] text-slate-400">
                      {record.confidence ? `${Math.round(record.confidence * 100)}% match` : 'Manual entry'}
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  )
}
