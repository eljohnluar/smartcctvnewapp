import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createTeacherAccount,
  deleteTeacherAccount,
  getTeacherAccounts,
  updateTeacherAccount,
} from '../../services/api'
import { useAuth } from '../../context/useAuth'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'
import { formatDate, formatTime } from '../../utils/helpers'
import { YEAR_LEVELS } from '../../utils/constants'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

const MOCK_ACCOUNTS = [
  { id: 12, username: 'j.delacruz', full_name: 'Juan Dela Cruz', email: 'juan.delacruz@smartcctv.edu', role: 'teacher', is_active: true, year_levels: ['1st Year', '2nd Year'], sections: 'A', last_login_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString() },
  { id: 11, username: 'm.ramos', full_name: 'Maria Ramos', email: 'maria.ramos@smartcctv.edu', role: 'teacher', is_active: true, year_levels: [], sections: null, last_login_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
  { id: 10, username: 'a.santos', full_name: 'Andres Santos', email: 'andres.santos@smartcctv.edu', role: 'admin', is_active: true, year_levels: ['3rd Year'], sections: 'B', last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString() },
]

const EMPTY_FORM = {
  username: '',
  password: 'password123',
  full_name: '',
  email: '',
  role: 'teacher',
  year_levels: [],
  sections: [''],
}

// Accepts ['A','B'], 'A, B' or the legacy TEXT value '["A","B"]' and always
// returns one non-empty input row at minimum.
const toSectionRows = (value) => {
  const list = Array.isArray(value)
    ? value
    : value ? String(value).replace(/[\[\]"]/g, '').split(',') : []
  const rows = list.map((s) => String(s).trim()).filter(Boolean)
  return rows.length ? rows : ['']
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[#242836] border border-[#2d3148] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50'
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

const yearShort = (year) => year.replace(' Year', '')

function ScopePills({ title, options, selected, onToggle, onSelectAll, onClearAll }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className={labelCls + ' mb-0'}>{title}</span>
        <div className="flex items-center gap-2">
          {onSelectAll && (
            <button type="button" onClick={onSelectAll} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
              All
            </button>
          )}
          {onClearAll && (
            <button type="button" onClick={onClearAll} className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <label
              key={opt}
              className={`cursor-pointer select-none px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                active
                  ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30'
                  : 'bg-[#242836] text-slate-400 border-[#2d3148] hover:border-slate-500/60 hover:text-slate-300'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={active} onChange={() => onToggle(opt)} />
              {opt}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function TeacherManagement() {
  const { user } = useAuth()
  const currentUsername = user?.username
  const { confirm, dialog } = usePasswordConfirm()

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = roleFilter !== 'all' ? { role: roleFilter } : {}
    if (search.trim()) params.search = search.trim()
    try {
      const res = await getTeacherAccounts(params)
      setAccounts(res?.accounts ?? [])
      setOffline(false)
    } catch (err) {
      const q = search.trim().toLowerCase()
      setAccounts(MOCK_ACCOUNTS.filter((a) =>
        (roleFilter === 'all' || a.role === roleFilter) &&
        (!q || a.full_name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q))
      ))
      setOffline(true)
      setError(err.message || null)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  const adminCount = useMemo(() => accounts.filter((a) => a.role === 'admin' && a.is_active).length, [accounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (offline || !q) return accounts
    return accounts.filter((a) =>
      a.full_name.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    )
  }, [accounts, search, offline])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (acct) => {
    setEditing(acct)
    setForm({
      username: acct.username,
      password: '',
      full_name: acct.full_name,
      email: acct.email || '',
      role: acct.role,
      year_levels: acct.year_levels ?? [],
      sections: toSectionRows(acct.sections),
    })
    setFormOpen(true)
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setSectionRow = (index, value) => setForm((f) => ({
    ...f,
    sections: f.sections.map((row, i) => (i === index ? value : row)),
  }))
  const addSectionRow = () => setForm((f) => ({ ...f, sections: [...f.sections, ''] }))
  const removeSectionRow = (index) => setForm((f) => {
    const sections = f.sections.filter((_, i) => i !== index)
    return { ...f, sections: sections.length ? sections : [''] }
  })

  const handleFullNameChange = (name) => {
    setForm((f) => {
      const next = { ...f, full_name: name }
      if (!editing && (!f.username || f._autoUsername)) {
        const parts = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)
        if (parts.length >= 2 && parts[0] && parts[1]) {
          next.username = `${parts[0][0]}.${parts.slice(1).join('')}`
        } else if (parts[0]) {
          next.username = parts[0]
        }
        if (next.username) {
          next.email = `${next.username}@smartcctv.edu`
        }
        next._autoUsername = true
      }
      return next
    })
  }

  const toggleIn = (k, v) => setForm((f) => ({
    ...f,
    [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.full_name.trim()
    if (!name) return toast.error('Full name is required')

    let username = form.username.trim().toLowerCase().replace(/\s+/g, '')
    if (!editing) {
      if (!username) {
        const parts = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)
        username = parts.length >= 2 ? `${parts[0][0]}.${parts.slice(1).join('')}` : (parts[0] || 'teacher')
      }
      if (username.length < 3) {
        return toast.error('Username must be at least 3 characters long')
      }
    }

    const password = (form.password || 'password123').trim()
    if (!editing && password.length < 4) {
      return toast.error('Password must be at least 4 characters long')
    }

    const sections = [...new Set(form.sections.map((s) => s.trim()).filter(Boolean))]

    setSaving(true)
    try {
      if (editing) {
        const payload = {
          full_name: name,
          email: form.email.trim() || null,
          role: form.role,
          year_levels: form.year_levels,
          sections,
        }
        if (form.password && form.password.trim()) payload.password = form.password.trim()
        await updateTeacherAccount(editing.id, payload)
        toast.success('Account updated')
      } else {
        await createTeacherAccount({
          username,
          password,
          full_name: name,
          email: form.email.trim() || `${username}@smartcctv.edu`,
          role: form.role,
          year_levels: form.year_levels,
          sections,
        })
        toast.success(`Account @${username} created with password: ${password}`)
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error(err.message || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (acct) => {
    if (acct.username === currentUsername) return toast.error('You cannot disable your own account')
    if (acct.role === 'admin' && acct.is_active && adminCount <= 1) return toast.error('Cannot disable the last administrator')
    const nextActive = !acct.is_active
    const done = await confirm((password) => updateTeacherAccount(acct.id, { is_active: nextActive }, password), {
      title: nextActive ? 'Enable account' : 'Disable account',
      description: `${nextActive ? 'Enabling' : 'Disabling'} @${acct.username} changes what this staff member can do right now. Confirm with your password.`,
      confirmLabel: nextActive ? 'Enable' : 'Disable',
    })
    if (!done) return
    toast.success(nextActive ? 'Account enabled' : 'Account disabled')
    await load()
  }

  const handleDelete = async (acct) => {
    if (acct.username === currentUsername) return toast.error('You cannot delete your own account')
    if (acct.role === 'admin' && adminCount <= 1) return toast.error('Cannot delete the last administrator')
    setConfirmId(null)
    const done = await confirm((password) => deleteTeacherAccount(acct.id, password), {
      title: 'Delete account',
      description: `Permanently remove @${acct.username}. Confirm with your password.`,
      confirmLabel: 'Delete account',
    })
    if (!done) return
    toast.success('Account deleted')
    await load()
  }

  const confirmTarget = accounts.find((a) => a.id === confirmId)

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Public registration is disabled — create staff accounts here.</p>
        </div>
        <div className="flex items-center gap-2">
          {offline && (
            <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Mock data
            </span>
          )}
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
            <Plus size={14} /> New account
          </button>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search name, username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#242836] border border-[#2d3148] rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-[#242836] border border-[#2d3148] rounded-lg px-2.5 py-1.5">
            <Filter size={13} className="text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All roles</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Accounts</h2>
          <span className="text-xs text-slate-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">No accounts match the current filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Name</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Username</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Email</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Role</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Year Levels</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Sections</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Last login</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Created</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3148]">
                {filtered.map((acct) => {
                  const isSelf = acct.username === currentUsername
                  const isLastAdmin = acct.role === 'admin' && acct.is_active && adminCount <= 1
                  const disableDelete = isSelf || isLastAdmin
                  const yearLevels = acct.year_levels ?? []
                  const sectionList = Array.isArray(acct.sections)
                    ? acct.sections
                    : acct.sections ? [acct.sections] : []
                  return (
                    <tr key={acct.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{acct.full_name}</td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">@{acct.username}</td>
                      <td className="px-4 py-4 text-slate-400 text-xs">{acct.email || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${
                          acct.role === 'admin'
                            ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                            : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                        }`}>
                          {acct.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {yearLevels.length === 0 ? (
                          <span className="text-[11px] text-slate-600">
                            {acct.role === 'admin' ? 'All' : 'None'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 whitespace-nowrap">
                            {yearLevels.map(yearShort).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {sectionList.length > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold border bg-slate-500/10 text-slate-300 border-slate-500/20">
                            {sectionList.join(', ')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">
                            {acct.role === 'admin' ? 'All' : 'None'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${
                          acct.is_active
                            ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {acct.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500">
                        {acct.last_login_at ? `${formatDate(acct.last_login_at, { month: 'short', day: 'numeric', year: 'numeric' })} ${formatTime(acct.last_login_at)}` : 'Never'}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500">{formatDate(acct.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(acct)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive(acct)}
                            disabled={isSelf || isLastAdmin}
                            title={isSelf ? 'Your own account' : isLastAdmin ? 'Last administrator' : acct.is_active ? 'Disable' : 'Enable'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                          >
                            {acct.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                          <button
                            onClick={() => setConfirmId(acct.id)}
                            disabled={disableDelete}
                            title={isSelf ? 'Your own account' : isLastAdmin ? 'Last administrator' : 'Delete'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit account' : 'New account'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="e.g. Maria Ramos"
              className={inputCls}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelCls}>Username</label>
                <span className="text-[10px] text-slate-500">Min 3 chars</span>
              </div>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setField('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                disabled={!!editing}
                placeholder="e.g. m.ramos"
                className={`${inputCls} ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={form.role} onChange={(e) => setField('role', e.target.value)} className={inputCls}>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="name@smartcctv.edu" className={inputCls} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelCls}>Password</label>
                <span className="text-[10px] text-cyan-400">Default: password123</span>
              </div>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={editing ? 'Leave blank to keep current' : 'password123'}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <ScopePills
              title="Year levels handled"
              options={YEAR_LEVELS}
              selected={form.year_levels}
              onToggle={(v) => toggleIn('year_levels', v)}
              onSelectAll={() => setField('year_levels', [...YEAR_LEVELS])}
              onClearAll={() => setField('year_levels', [])}
            />
            <div>
              <label className={labelCls}>Sections handled</label>
              <div className="space-y-2">
                {form.sections.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row}
                      onChange={(e) => setSectionRow(index, e.target.value)}
                      placeholder={index === 0 ? 'e.g. A' : 'Another section…'}
                      className={inputCls}
                    />
                    {form.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSectionRow(index)}
                        title="Remove this section"
                        className="shrink-0 p-2 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {index === form.sections.length - 1 && row.trim() && (
                      <button
                        type="button"
                        onClick={addSectionRow}
                        title="Add another section"
                        className="shrink-0 p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 border border-cyan-400/20 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-400 text-black rounded-lg hover:bg-cyan-300 disabled:opacity-50 transition-colors">
              <UserCog size={14} />{saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmTarget} onClose={() => setConfirmId(null)} title="Confirm delete" size="sm">
        {confirmTarget && (
          <div className="space-y-5">
            <p className="text-sm text-slate-300">
              Delete <span className="text-white font-medium">{confirmTarget.full_name}</span>
              {' '}(<span className="font-mono text-[11px] text-slate-400">@{confirmTarget.username}</span>)? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmTarget)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
              >
                <Trash2 size={14} />Delete account
              </button>
            </div>
          </div>
        )}
      </Modal>

      {dialog}
    </div>
  )
}
