import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ScanFace, Search, UserPlus, Users } from 'lucide-react'
import { useScopedStudents } from '../hooks/useScopedStudents'
import { formatDate, initials } from '../utils/helpers'
import LoadingSpinner from '../components/common/LoadingSpinner'
import AddStudentModal from '../components/students/AddStudentModal'
import FaceEnrollModal from '../components/students/FaceEnrollModal'

const PAGE_SIZE = 25

export default function Students() {
  const { students, loading, error, refetch } = useScopedStudents()
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [enrollTarget, setEnrollTarget] = useState(null)

  const yearLevels = useMemo(
    () => [...new Set(students.map((student) => student.grade_level).filter(Boolean))].sort(),
    [students],
  )
  const sections = useMemo(
    () => [...new Set(students.map((student) => student.section).filter(Boolean))].sort(),
    [students],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.full_name.toLowerCase().includes(query) ||
        student.student_id.toLowerCase().includes(query)
      const matchesYear = yearFilter === 'all' || student.grade_level === yearFilter
      const matchesSection = sectionFilter === 'all' || student.section === sectionFilter
      return matchesSearch && matchesYear && matchesSection
    })
  }, [students, search, yearFilter, sectionFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {loading ? 'Loading roster…' : `${students.length} students in your sections`}
        </p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <UserPlus size={14} />
          Add student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or student ID…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={yearFilter}
            onChange={(event) => {
              setYearFilter(event.target.value)
              setPage(0)
            }}
            className={selectClass}
          >
            <option value="all">All year levels</option>
            {yearLevels.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={sectionFilter}
            onChange={(event) => {
              setSectionFilter(event.target.value)
              setPage(0)
            }}
            className={selectClass}
          >
            <option value="all">All sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Student roster</h2>
          </div>
          <span className="text-xs text-slate-400">
            {filtered.length} of {students.length} students
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading students…" />
        ) : error ? (
          <p className="py-16 text-center text-sm text-slate-400">
            Could not load the roster. {error.message}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            No students match the current filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Student ID</th>
                  <th className="px-5 py-3 font-semibold">Section</th>
                  <th className="px-5 py-3 font-semibold">Year level</th>
                  <th className="px-5 py-3 font-semibold">Face enrolled</th>
                  <th className="px-5 py-3 font-semibold">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((student) => (
                  <tr key={student.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                            {initials(student.full_name)}
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{student.student_id}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{student.section || '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{student.grade_level || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {student.has_face ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <ScanFace size={12} />
                            Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Not enrolled
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setEnrollTarget(student)}
                          className="text-[11px] font-medium text-emerald-600 hover:underline"
                        >
                          {student.has_face ? 'Retake' : 'Enroll'}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(student.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Page {safePage + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={safePage === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                disabled={safePage >= pageCount - 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refetch} />
      <FaceEnrollModal
        open={!!enrollTarget}
        student={enrollTarget}
        onClose={() => setEnrollTarget(null)}
        onEnrolled={refetch}
      />
    </div>
  )
}
