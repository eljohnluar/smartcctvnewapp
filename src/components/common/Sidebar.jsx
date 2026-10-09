import { useEffect, useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
  Video,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/live', label: 'Live Feed', icon: Video },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar({ mobileOpen = false, onOpen = () => {}, onClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const handleChange = (event) => setIsDesktop(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  // The collapse affordance is desktop-only; the mobile drawer is always full width.
  const showLabels = !collapsed || !isDesktop

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 md:static md:translate-x-0 md:transition-all ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Brand */}
        <div className="flex min-h-[68px] items-center gap-3 border-b border-slate-200 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <GraduationCap size={20} />
          </div>
          {showLabels && (
            <div className="overflow-hidden">
              <p className="whitespace-nowrap text-sm font-bold leading-tight text-slate-900">
                SmartCCTV
              </p>
              <p className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                Teacher portal
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={showLabels ? undefined : label}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                  {showLabels && <span className="whitespace-nowrap">{label}</span>}
                  {isActive && showLabels && (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-emerald-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Teacher + sign out */}
        <div className="border-t border-slate-200 p-3">
          {showLabels && user && (
            <div className="mb-2 flex items-center gap-2.5 px-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {(user.full_name || user.username || 'T')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">{user.full_name}</p>
                <p className="truncate text-[11px] text-slate-500">{user.username}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              handleSignOut()
              onClose()
            }}
            title="Sign out"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={16} className="shrink-0" />
            {showLabels && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-16 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700 md:flex"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* Edge toggle (mobile): sits at the sidebar's right edge, shrunk to the screen edge when hidden */}
      <button
        type="button"
        onClick={mobileOpen ? onClose : onOpen}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        className={`fixed top-16 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-[left] duration-300 md:hidden ${
          mobileOpen ? 'left-[228px]' : 'left-0'
        }`}
      >
        {mobileOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </>
  )
}
