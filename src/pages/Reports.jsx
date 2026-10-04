import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarCheck2, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchAttendanceRange } from '../services/data'
import { useScopedStudents } from '../hooks/useScopedStudents'
import { daysAgoISO, toISODate } from '../utils/helpers'
import LoadingSpinner from '../components/common/LoadingSpinner'

function buildDailySeries(days) {
  const series = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    series.push({
      date: toISODate(date),
      label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      present: 0,
      late: 0,
    })
  }
  return series
}

export default function Reports() {
  const { students, loading: studentsLoading } = useScopedStudents()
  const [days, setDays] = useState(14)
  const [records, setRecords] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  const scopedStudentIds = useMemo(() => new Set(students.map((student) => student.id)), [students])

  const load = useCallback(async () => {
    try {
      const startISO = daysAgoISO(days - 1)
      const attendance = await fetchAttendanceRange(startISO, toISODate(new Date()))
      const scopedRecords = attendance.filter((record) =>
        scopedStudentIds.has(record.student_id),
      )
      setRecords(scopedRecords)

      const series = buildDailySeries(days)
      for (const record of scopedRecords) {
        const day = series.find((entry) => entry.date === record.class_date)
        if (day) day[record.status === 'late' ? 'late' : 'present'] += 1
      }
      setChartData(series)
    } catch (err) {
      toast.error(err.message || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [days, scopedStudentIds])

  useEffect(() => {
    if (!studentsLoading) load()
  }, [studentsLoading, load])

  const handleRangeChange = (nextDays) => {
    if (nextDays === days) return
    setDays(nextDays)
    setLoading(true)
  }

  const sectionStats = useMemo(() => {
    const bySection = new Map()
    for (const student of students) {
      const key = student.section || 'No section'
      if (!bySection.has(key)) {
        bySection.set(key, { section: key, enrolled: 0, present: 0, late: 0 })
      }
      bySection.get(key).enrolled += 1
    }
    for (const record of records) {
      const section = record.students?.section || 'No section'
      const entry = bySection.get(section)
      if (entry) entry[record.status === 'late' ? 'late' : 'present'] += 1
    }
    return [...bySection.values()]
      .map((entry) => ({
        ...entry,
        rate: entry.enrolled > 0 ? Math.round((entry.present / entry.enrolled) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [students, records])

  const totalCheckIns = records.length
  const totalPresent = records.filter((record) => record.status === 'present').length
  const avgRate =
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, day) => sum + day.present, 0) / (chartData.length * Math.max(1, students.length)) * 100)
      : 0
  const peakDay = [...chartData].sort((a, b) => b.present + b.late - (a.present + a.late))[0]

  const summary = [
    {
      label: 'Average daily rate',
      value: `${avgRate}%`,
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Check-ins recorded',
      value: totalCheckIns,
      hint: `${totalPresent} on time`,
      icon: CalendarCheck2,
      tone: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Busiest day',
      value: peakDay && peakDay.present + peakDay.late > 0 ? peakDay.label : '—',
      hint: peakDay ? `${peakDay.present + peakDay.late} check-ins` : 'No activity yet',
      icon: BarChart3,
      tone: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Range toggle */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Attendance analytics</h2>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          {[7, 14].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleRangeChange(option)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === option ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last {option} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {summary.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Daily check-ins</h3>
        <p className="mt-0.5 text-xs text-slate-400">On-time versus late arrivals per day.</p>
        {loading ? (
          <LoadingSpinner label="Crunching numbers…" />
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradientPresent)"
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  name="Late"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#gradientLate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Section breakdown */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Users size={15} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">By section</h3>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : sectionStats.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No section data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Section</th>
                  <th className="px-5 py-3 font-semibold">Enrolled</th>
                  <th className="px-5 py-3 font-semibold">On time</th>
                  <th className="px-5 py-3 font-semibold">Late</th>
                  <th className="px-5 py-3 font-semibold">On-time rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sectionStats.map((entry) => (
                  <tr key={entry.section} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900">{entry.section}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{entry.enrolled}</td>
                    <td className="px-5 py-3 text-xs text-emerald-600">{entry.present}</td>
                    <td className="px-5 py-3 text-xs text-amber-600">{entry.late}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${entry.rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{entry.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
