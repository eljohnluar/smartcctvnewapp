import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAttendanceRange } from '../../services/data'
import { useScopedStudents } from '../../hooks/useScopedStudents'
import { toISODate } from '../../utils/helpers'
import LoadingSpinner from '../common/LoadingSpinner'

function monthBounds(cursor) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
}

export default function AttendanceCalendar() {
  const { students, loading: studentsLoading } = useScopedStudents()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [dailyCounts, setDailyCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const scopedStudentIds = useMemo(() => new Set(students.map((student) => student.id)), [students])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { start, end } = monthBounds(cursor)
      const rows = await fetchAttendanceRange(start, end)
      const counts = {}
      for (const row of rows) {
        if (!scopedStudentIds.has(row.student_id)) continue
        counts[row.class_date] = (counts[row.class_date] || 0) + 1
      }
      setDailyCounts(counts)
    } catch (err) {
      toast.error(err.message || 'Could not load the attendance calendar.')
    } finally {
      setLoading(false)
    }
  }, [cursor, scopedStudentIds])

  useEffect(() => {
    if (!studentsLoading) load()
  }, [studentsLoading, load])

  const cells = useMemo(() => {
    const firstWeekday = cursor.getDay()
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const list = []
    for (let i = 0; i < firstWeekday; i += 1) list.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) list.push(day)
    return list
  }, [cursor])

  const enrolled = students.length
  const maxCount = Math.max(enrolled, ...Object.values(dailyCounts), 1)

  const tintFor = (count) => {
    if (!count) return ''
    const ratio = count / maxCount
    if (ratio < 0.25) return 'bg-emerald-50'
    if (ratio < 0.5) return 'bg-emerald-100'
    if (ratio < 0.75) return 'bg-emerald-200'
    return 'bg-emerald-300'
  }

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth()
  const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Attendance calendar</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">Daily check-ins for {monthLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading calendar…" />
      ) : (
        <div className="flex-1 px-3 py-3 sm:px-5 sm:py-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="pb-1 text-[11px] font-semibold text-slate-400">
                {d}
              </span>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <span key={`pad-${index}`} />
              const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
              const iso = toISODate(date)
              const count = dailyCounts[iso] || 0
              const isToday = isCurrentMonth && day === today.getDate()
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              return (
                <div
                  key={iso}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-lg py-1 sm:min-h-14 ${tintFor(count)} ${
                    isToday ? 'ring-2 ring-emerald-500' : ''
                  }`}
                  title={count ? `${count} check-in${count > 1 ? 's' : ''}` : 'No check-ins'}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? 'text-emerald-700' : isWeekend ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-800">{count}</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
            <span>Fewer</span>
            <span className="h-3 w-3 rounded bg-white ring-1 ring-slate-200" />
            <span className="h-3 w-3 rounded bg-emerald-50" />
            <span className="h-3 w-3 rounded bg-emerald-100" />
            <span className="h-3 w-3 rounded bg-emerald-200" />
            <span className="h-3 w-3 rounded bg-emerald-300" />
            <span>More</span>
          </div>
        </div>
      )}
    </section>
  )
}
