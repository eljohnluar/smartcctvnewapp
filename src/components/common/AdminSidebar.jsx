import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/useAuth'

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/teachers', label: 'Teacher Management', icon: GraduationCap },
  { to: '/admin/students', label: 'Student Management', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ mobileOpen = false, onOpen = () => {}, onClose = () => {} }) {
  const { sidebarOpen, toggleSidebar } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const handleChange = (event) => setIsDesktop(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  // The collapse affordance is desktop-only; the mobile drawer is always full width.
  const showLabels = sidebarOpen || !isDesktop

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col
          border-r border-[#263449] bg-[#0d1521]/95 backdrop-blur-xl
          transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:transition-all
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarOpen ? 'md:w-60' : 'md:w-16'}
        `}
      >
        {/* Logo */}
        <div className="flex min-h-[76px] items-center gap-3 border-b border-[#263449] px-4 py-5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 shadow-[0_0_22px_rgba(0,240,255,0.18)]"
            aria-hidden="true"
          >
            <ShieldCheck size={19} />
          </div>
          {showLabels && (
            <div className="overflow-hidden">
              <p className="whitespace-nowrap text-sm font-semibold leading-tight text-white">
                SmartCamera
              </p>
              <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-300/70">
                Admin Control
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-x-0 space-y-1 overflow-x-hidden overflow-y-auto px-2 py-5">
          {adminNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={showLabels ? undefined : label}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-colors duration-150 group relative
                ${isActive
                  ? 'bg-cyan-400/10 text-cyan-200 shadow-[inset_2px_0_0_#00f0ff]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'}`}
                  />
                  {showLabels && <span className="whitespace-nowrap">{label}</span>}
                  {!showLabels && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 rounded-md
                      border border-[#263449] bg-[#172235] text-xs text-white whitespace-nowrap
                      opacity-0 group-hover:opacity-100 pointer-events-none
                      transition-opacity z-50
                    ">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Account badge */}
        <div className="border-t border-[#263449] p-3 space-y-2">
          {showLabels && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <ShieldCheck size={12} className="text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  {user ? user.username : 'ADMIN CONSOLE'}
                </span>
              </div>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                ADMIN
              </span>
            </div>
          )}

          {user && (
            <button
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
              title="Sign out of Administrator console"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} className="shrink-0" />
              {showLabels && <span className="font-mono text-[11px]">Sign Out</span>}
            </button>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="
            absolute -right-3 top-20
            hidden md:flex
            items-center justify-center w-6 h-6
            rounded-full border border-[#3b536f] bg-[#172235]
            text-slate-400 hover:bg-[#263449] hover:text-white
            transition-colors z-10
          "
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Edge toggle (mobile): sits at the sidebar's right edge, shrunk to the screen edge when hidden */}
      <button
        type="button"
        onClick={mobileOpen ? onClose : onOpen}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        className={`fixed top-16 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-[#3b536f] bg-[#172235] text-slate-300 shadow-md transition-[left] duration-300 md:hidden ${
          mobileOpen ? 'left-[228px]' : 'left-0'
        }`}
      >
        {mobileOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </>
  )
}
