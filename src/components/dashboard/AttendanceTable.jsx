import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatTime } from '../../utils/helpers'
import Badge from '../common/Badge'
import LoadingSpinner from '../common/LoadingSpinner'

export default function AttendanceTable({ records = [], loading = false }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return (records || []).filter((r) => {
      const matchSearch =
        r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student_code?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [records, search, statusFilter])

  return (
    <div className="flex h-full min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Today's attendance</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">Live check-ins and manual records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
            <SlidersHorizontal size={12} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="present">Time in</option>
              <option value="late">Late</option>
              <option value="time_out">Time out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Student', 'ID', 'Section', 'Status', 'Time in', 'Time out'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id || `${r.student_id}-${r.check_in_time}`}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                          {r.student_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm text-slate-900 font-medium">{r.student_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{r.student_code}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{r.section}</td>
                    <td className="px-5 py-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatTime(r.check_in_time)}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {r.check_out_time ? formatTime(r.check_out_time) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
