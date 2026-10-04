import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createStudent } from '../../services/data'
import { useAuth } from '../../context/useAuth'
import { SECTION_LETTERS, YEAR_LEVELS, assignableSections, sectionLabel } from '../../utils/helpers'

const ALL_SECTIONS = YEAR_LEVELS.flatMap((year) =>
  SECTION_LETTERS.map((letter) => sectionLabel(year, letter)),
)

export default function AddStudentModal({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [section, setSection] = useState('')
  const [saving, setSaving] = useState(false)

  const sections = useMemo(() => {
    const scoped = assignableSections(user?.year_levels, user?.sections)
    return scoped.length ? scoped : ALL_SECTIONS
  }, [user])

  if (!open) return null

  const activeSection = section && sections.includes(section) ? section : sections[0]

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!studentId.trim()) {
      toast.error('Student ID is required.')
      return
    }
    if (!fullName.trim()) {
      toast.error('Full name is required.')
      return
    }
    setSaving(true)
    try {
      const created = await createStudent({
        student_id: studentId,
        full_name: fullName,
        section: activeSection,
        grade_level: activeSection.split(' - ')[0],
        teacher_id: user?.id,
      })
      toast.success(`${created.full_name} added to ${activeSection}.`)
      setStudentId('')
      setFullName('')
      setSection('')
      onCreated?.()
      onClose()
    } catch (err) {
      toast.error(
        err.code === '23505'
          ? 'That student ID already exists.'
          : err.message || 'Could not add the student.',
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Add student</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="student-id">
              Student ID
            </label>
            <input
              id="student-id"
              type="text"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="e.g. 2026-0142"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="full-name">
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Juan Dela Cruz"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="section">
              Section
            </label>
            <select
              id="section"
              value={activeSection}
              onChange={(event) => setSection(event.target.value)}
              className={inputClass}
            >
              {sections.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {sections.length < ALL_SECTIONS.length && (
              <p className="mt-1 text-[11px] text-slate-400">
                Only the sections assigned to your account are listed.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
