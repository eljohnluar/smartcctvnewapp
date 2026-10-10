import { useMemo } from 'react'
import { UserCheck, Users } from 'lucide-react'
import { useAttendance } from '../hooks/useAttendance'
import { useScopedStudents } from '../hooks/useScopedStudents'
import SectionScopeNotice from '../components/common/SectionScopeNotice'
import AttendanceCalendar from '../components/dashboard/AttendanceCalendar'
import QuickActions from '../components/dashboard/QuickActions'
import { formatTime } from '../utils/helpers'

function CountCard({ icon: Icon, tint, value, label, sub }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { attendance, stats, loading, refetch } = useAttendance()
  const { students } = useScopedStudents()

  const markedToday = stats.present + stats.late + stats.time_out

  const summary = useMemo(() => {
    const today = new Date().toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (loading) return null

    const times = attendance
      .map((r) => (r.check_in_time ? new Date(r.check_in_time).getTime() : null))
      .filter((t) => t != null)
      .sort((a, b) => a - b)
    const first = times.length > 0 ? formatTime(new Date(times[0]).toISOString()) : null
    const last = times.length > 0 ? formatTime(new Date(times[times.length - 1]).toISOString()) : null
    const notYetMarked = Math.max(0, stats.total - markedToday)

    const parts = [
      `Today, ${today}, ${markedToday} of ${stats.total} enrolled students have been marked present (${stats.present} on time, ${stats.late} late, ${stats.time_out} timed out).`,
    ]
    if (first && last) {
      parts.push(`The first check-in was recorded at ${first} and the latest at ${last}.`)
    }
    if (stats.total === 0) {
      parts.push('No students are enrolled in your sections yet. An administrator assigns sections before students appear here.')
    } else if (notYetMarked > 0) {
      parts.push(`${notYetMarked} student${notYetMarked > 1 ? 's are' : ' is'} still unmarked — check the Attendance page to review or mark them manually.`)
    } else {
      parts.push('Everyone on the roster has been marked for today.')
    }
    return parts
  }, [attendance, stats, markedToday, loading])

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <SectionScopeNotice />

      <div className="grid gap-4 sm:grid-cols-2">
        <CountCard
          icon={UserCheck}
          tint="bg-emerald-50 text-emerald-600"
          value={loading ? '—' : markedToday}
          label="Attendance today"
          sub={stats.total > 0 ? `${stats.rate}% of enrolled marked` : 'No students enrolled yet'}
        />
        <CountCard
          icon={Users}
          tint="bg-sky-50 text-sky-600"
          value={loading ? '—' : stats.total}
          label="Total students"
          sub="Enrolled in your sections"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceCalendar />
        </div>

        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Information</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">Today at a glance</p>
          </div>
          <div className="flex-1 space-y-3 px-5 py-4">
            {summary ? (
              summary.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-400">Loading today's summary…</p>
            )}
            <p className="text-sm leading-relaxed text-slate-600">
              The calendar shows daily check-in totals. Use the arrows to move between months, and
              visit Reports for on-time versus late trends.
            </p>
          </div>
        </section>
      </div>

      <QuickActions onRefresh={refetch} />
    </div>
  )
}
