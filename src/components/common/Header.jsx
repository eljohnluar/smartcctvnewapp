import { useState } from 'react'
import { useAuth } from '../../context/useAuth'

export default function Header({ title }) {
  const { user } = useAuth()
  const [today] = useState(() =>
    new Date().toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  )

  return (
    <header className="flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
        <p className="truncate text-xs text-slate-500">{today}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
          {(user?.full_name || user?.username || 'T')[0]?.toUpperCase()}
        </div>
        <span className="hidden text-xs font-medium text-slate-700 sm:inline">
          {user?.full_name || user?.username}
        </span>
      </div>
    </header>
  )
}
