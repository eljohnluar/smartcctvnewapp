import { AtSign, BadgeCheck, GraduationCap, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getCurrentAccount } from '../services/api'
import { assignableSections } from '../utils/constants'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Profile() {
  const { user: localUser } = useAuth()
  const [account, setAccount] = useState(localUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCurrentAccount()
      .then((fresh) => {
        if (!cancelled && fresh) setAccount((prev) => ({ ...(prev || {}), ...fresh }))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading && !account) {
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    )
  }

  const user = account || localUser
  const initial = (user?.full_name || user?.username || 'T').slice(0, 1).toUpperCase()
  const sections = assignableSections(user?.year_levels ?? [], user?.sections ?? [])
  const yearLevels = user?.year_levels ?? []
  const letters = user?.sections ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        {/* Banner */}
        <div className="h-24 bg-emerald-50 sm:h-28" />

        {/* Identity */}
        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-10 flex items-end justify-between">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-emerald-100 text-3xl font-bold text-emerald-700 shadow-sm">
              {initial}
            </div>
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
              <BadgeCheck size={12} />
              {user?.role === 'admin' || user?.role === 'administrator' ? 'Administrator' : 'Teacher'}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">{user?.full_name || 'Faculty Instructor'}</h2>
          <p className="mt-1 font-mono text-xs text-slate-400">@{user?.username || 'teacher'}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Mail size={15} className="shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Email</p>
                <p className="truncate text-sm text-slate-700">{user?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <AtSign size={15} className="shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Username</p>
                <p className="truncate font-mono text-sm text-slate-700">{user?.username || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching scope */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <GraduationCap size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Classes handled</h3>
            <p className="text-xs text-slate-400">Attendance marking scope for this account</p>
          </div>
        </div>

        {sections.length === 0 ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              user?.role === 'teacher'
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            }`}
          >
            {user?.role === 'teacher'
              ? 'No sections are assigned to your account yet. Ask an administrator to assign your year levels and sections.'
              : 'Full access — this account can manage every year level and section.'}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {yearLevels.map((year) => (
                <span key={year} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  {year}
                </span>
              ))}
              {letters.map((letter) => (
                <span key={letter} className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                  Section {letter}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              {sections.length} class{sections.length === 1 ? '' : 'es'} in scope: {sections.join(', ')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
