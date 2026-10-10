import { RefreshCw, Clock, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/useAuth'
import { todayLabel } from '../../utils/helpers'
import { SYSTEM_STATUS } from '../../utils/constants'
import ThemeToggle from './ThemeToggle'

export default function AdminHeader({ title }) {
  const { systemStatus, refreshStatus } = useApp()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time24 = currentTime.toLocaleTimeString('en-GB', { hour12: false })

  const statusColor = {
    [SYSTEM_STATUS.ONLINE]: 'text-green-400',
    [SYSTEM_STATUS.PROCESSING]: 'text-amber-400',
    [SYSTEM_STATUS.OFFLINE]: 'text-slate-500',
    [SYSTEM_STATUS.ERROR]: 'text-red-400',
  }[systemStatus] ?? 'text-slate-500'

  const statusDot = {
    [SYSTEM_STATUS.ONLINE]: 'bg-green-400',
    [SYSTEM_STATUS.PROCESSING]: 'bg-amber-400 animate-pulse',
    [SYSTEM_STATUS.OFFLINE]: 'bg-slate-500',
    [SYSTEM_STATUS.ERROR]: 'bg-red-400',
  }[systemStatus] ?? 'bg-slate-500'

  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-[#263449] bg-[#080d15]/80 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-0.5 text-xs text-slate-500">{todayLabel()}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#263449] bg-[#111a27]/80 px-3 py-1.5 font-mono text-xs text-cyan-300 shadow-sm">
          <Clock size={13} className="text-cyan-400" />
          <span className="font-semibold tracking-wider">{time24}</span>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[#263449] bg-[#111a27]/80 px-3 py-1.5 sm:flex">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className={`text-xs font-medium capitalize ${statusColor}`}>{systemStatus}</span>
        </div>

        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        <button
          onClick={refreshStatus}
          aria-label="Refresh status"
          className="hidden md:inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <RefreshCw size={16} />
        </button>

        <div className="hidden md:flex items-center gap-2 rounded-xl border border-[#263449] bg-[#111a27]/80 px-3 py-1.5">
          <ShieldCheck size={14} className="text-cyan-300" />
          <div className="leading-tight">
            <p className="font-mono text-[11px] text-white">{user?.username ?? 'admin'}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
