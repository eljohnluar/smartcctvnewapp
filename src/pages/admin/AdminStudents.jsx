import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createStudent, deleteStudent, getStudents, getTeacherAccounts, updateStudent } from '../../services/api'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'
import { SECTION_LETTERS, YEAR_LEVELS, sectionLabel, yearLevelOfSection } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

const EMPTY_FORM = {
  student_id: '',
  full_name: '',
  teacher_id: '',
  year: '',
  letter: '',
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50'
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

// Legacy databases store teacher sections as TEXT like '["A","B"]'; accept both
// shapes. Section names are free text (e.g. 'A' or '12345'), whatever the admin
// typed in Teacher Management.
const lettersOf = (account) => {
  const raw = Array.isArray(account.sections)
    ? account.sections
    : String(account.sections || '').replace(/[\[\]"]/g, '').split(',')
  const letters = raw.map((s) => String(s).trim()).filter(Boolean)
  return [...new Set(letters)]
}

const rankLetter = (letter) => {
  const i = SECTION_LETTERS.indexOf(letter.toUpperCase())
  return i === -1 ? SECTION_LETTERS.length : i
}

const yearsOf = (account) => (Array.isArray(account.year_levels) ? account.year_levels : []).filter((y) => YEAR_LEVELS.includes(y))

const sortBy = (values, order) => [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b))

export default function AdminStudents() {
  const { confirm, dialog } = usePasswordConfirm()

  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, accounts] = await Promise.all([
        getStudents(),
        getTeacherAccounts({ role: 'teacher' }).catch(() => ({ accounts: [] })),
      ])
      setStudents(data ?? [])
      setTeachers((accounts?.accounts ?? []).filter((t) => t.is_active && yearsOf(t).length && lettersOf(t).length))
    } catch (err) {
      toast.error(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const teacherNames = useMemo(() => new Map(teachers.map((t) => [String(t.id), t.full_name])), [teachers])

  const sectionsInUse = useMemo(() => {
    const known = new Set(students.map((s) => s.section).filter(Boolean))
    return [...known].sort()
  }, [students])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      if (yearFilter !== 'all' && yearLevelOfSection(s.section) !== yearFilter) return false
      if (sectionFilter !== 'all' && s.section !== sectionFilter) return false
      if (q && !(s.full_name.toLowerCase().includes(q) || (s.student_id || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [students, search, yearFilter, sectionFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (student) => {
    setEditing(student)
    setForm({
      student_id: student.student_id || '',
      full_name: student.full_name || '',
      teacher_id: student.teacher_id != null ? String(student.teacher_id) : '',
      year: yearLevelOfSection(student.section),
      letter: (student.section || '').match(/Section\s+([A-Za-z])/)?.[1].toUpperCase() ?? '',
    })
    setFormOpen(true)
  }

  const selectedTeacher = teachers.find((t) => String(t.id) === form.teacher_id) || null
  const yearOptions = selectedTeacher ? sortBy(yearsOf(selectedTeacher), YEAR_LEVELS) : []
  const letterOptions = selectedTeacher
    ? [...lettersOf(selectedTeacher)].sort((a, b) => rankLetter(a) - rankLetter(b) || a.localeCompare(b))
    : []

  const handleTeacherChange = (id) => {
    const teacher = teachers.find((t) => String(t.id) === id)
    setForm((f) => ({
      ...f,
      teacher_id: id,
      year: teacher && yearsOf(teacher).includes(f.year) ? f.year : '',
      letter: teacher && lettersOf(teacher).includes(f.letter) ? f.letter : '',
    }))
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.full_name.trim()
    const code = form.student_id.trim()
    if (!name || !code || !form.teacher_id || !form.year || !form.letter) {
      return toast.error('Name, student number, teacher, year level and section are required')
    }
    const section = sectionLabel(form.year, form.letter)
    const payload = { full_name: name, student_id: code, section, teacher_id: Number(form.teacher_id) }

    setSaving(true)
    try {
      if (editing) {
        const updated = await updateStudent(editing.id, payload)
        setStudents((prev) => prev.map((s) => (s.id === editing.id ? updated : s)))
        toast.success('Student updated')
      } else {
        const done = await confirm((password) => createStudent(payload, password), {
          title: 'Confirm new student',
          description: `Adding ${name} (${code}) to ${section} under ${teacherNames.get(form.teacher_id)} requires your password.`,
          confirmLabel: 'Add student',
        })
        if (!done) {
          setSaving(false)
          return
        }
        toast.success(`Student ${code} enrolled`)
        await load()
      }
      setFormOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save student')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (student) => {
    const done = await confirm((password) => deleteStudent(student.id, password), {
      title: 'Confirm student deletion',
      description: `Removing ${student.full_name} (${student.student_id}) also hides their attendance history. Enter your password to continue.`,
      confirmLabel: 'Delete student',
    })
    if (!done) return
    setStudents((prev) => prev.filter((s) => s.id !== student.id))
    toast.success('Student deleted')
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Every section across all year levels. Teachers only see their assigned classes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-[#242836] hover:bg-white/5 border border-[#2d3148] rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-lg transition-colors"
          >
            <Plus size={14} /> New student
          </button>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search name or student number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#242836] border border-[#2d3148] rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-1.5 bg-[#242836] border border-[#2d3148] rounded-lg px-2.5 py-1.5 sm:w-auto">
            <Filter size={13} className="text-slate-500" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="min-w-0 max-w-full text-xs bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All year levels</option>
              {YEAR_LEVELS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-slate-600">/</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="min-w-0 max-w-[160px] text-xs bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All sections</option>
              {sectionsInUse.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Students</h2>
          <span className="text-xs text-slate-500">{filtered.length} of {students.length}</span>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">No students match the current filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Name</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Student No.</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Section</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Teacher</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Face</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Enrolled</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3148]">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{student.full_name}</td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-400">{student.student_id}</td>
                    <td className="px-4 py-4">
                      {student.section ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold border bg-slate-500/10 text-slate-300 border-slate-500/20 whitespace-nowrap">
                          {student.section}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {teacherNames.get(String(student.teacher_id)) || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${
                        student.has_face
                          ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {student.has_face ? 'Enrolled' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-500">{formatDate(student.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(student)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit student' : 'New student'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                placeholder="e.g. Maria Santos"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Student number</label>
              <input
                type="text"
                value={form.student_id}
                onChange={(e) => setField('student_id', e.target.value)}
                placeholder="e.g. STU-001"
                className={inputCls}
                required
              />
            </div>
          </div>
          {teachers.length === 0 ? (
            <p className="text-xs text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
              No teachers have year levels and sections assigned yet. Set those up in Teacher Management first.
            </p>
          ) : (
            <>
              <div>
                <label className={labelCls}>Class teacher</label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select a teacher…</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} — {yearsOf(teacher).map((y) => y.replace(' Year', '')).join('/')} {lettersOf(teacher).join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Year level</label>
                  <select
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                    className={inputCls}
                    disabled={!selectedTeacher}
                    required
                  >
                    <option value="">{selectedTeacher ? 'Select a year level…' : 'Pick a teacher first'}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Section</label>
                  <select
                    value={form.letter}
                    onChange={(e) => setField('letter', e.target.value)}
                    className={inputCls}
                    disabled={!selectedTeacher}
                    required
                  >
                    <option value="">{selectedTeacher ? 'Select a section…' : 'Pick a teacher first'}</option>
                    {letterOptions.map((letter) => (
                      <option key={letter} value={letter}>Section {letter}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.year && form.letter && (
                <p className="text-[11px] text-slate-500">Enrolls in <span className="text-cyan-300">{sectionLabel(form.year, form.letter)}</span></p>
              )}
            </>
          )}
          <p className="flex items-center gap-2 text-[11px] text-slate-500">
            <UserRound size={13} />
            Face enrollment is done by the class teacher from their Students page.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-400 text-black rounded-lg hover:bg-cyan-300 disabled:opacity-50 transition-colors">
              <UserRound size={14} />{saving ? 'Saving…' : editing ? 'Save changes' : 'Enroll student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
