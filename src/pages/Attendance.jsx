import { useState } from 'react'
import { Menu, Printer, RefreshCw, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AttendanceTable from '../components/dashboard/AttendanceTable'
import StatsCards from '../components/dashboard/StatsCards'
import SectionScopeNotice from '../components/common/SectionScopeNotice'
import { useAttendance } from '../hooks/useAttendance'
import { usePasswordConfirm } from '../hooks/usePasswordConfirm'

export default function Attendance() {
  const { attendance, stats, loading, refetch, resetToday } = useAttendance()
  const { confirm, dialog } = usePasswordConfirm()
  const [resetting, setResetting] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      const done = await confirm((password) => resetToday(password), {
        title: 'Confirm attendance reset',
        description: 'This clears every check-in recorded today for all students.',
        confirmLabel: 'Reset attendance',
      })
      if (done) toast.success("Today's marked attendance has been reset")
    } catch (error) {
      toast.error(error.message || 'Failed to reset attendance')
    } finally {
      setResetting(false)
    }
  }

  const actions = (
    <>
      <button
        type="button"
        onClick={handleReset}
        disabled={resetting}
        title="Reset marked attendance for today"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw size={15} className={resetting ? 'animate-spin' : ''} />
        <span>{resetting ? 'Resetting…' : 'Reset attendance'}</span>
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <Printer size={15} />
        <span>Print</span>
      </button>
      <button
        type="button"
        onClick={refetch}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <RefreshCw size={15} />
        <span>Refresh</span>
      </button>
    </>
  )

  return (
    <>
      {dialog}
      <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
        <SectionScopeNotice />

        <div className="no-print hidden flex-wrap justify-end gap-2 sm:flex">{actions}</div>

        <StatsCards stats={stats} loading={loading} />

        <div className="print-area">
          <AttendanceTable records={attendance} loading={loading} />
        </div>
      </div>

      {/* Mobile action stack + floating hamburger toggle */}
      {actionsOpen && (
        <div className="no-print fixed bottom-20 right-5 z-40 flex w-52 flex-col gap-2 sm:hidden">
          {actions}
        </div>
      )}
      <button
        type="button"
        onClick={() => setActionsOpen((open) => !open)}
        aria-label={actionsOpen ? 'Hide actions' : 'Show actions'}
        aria-expanded={actionsOpen}
        className="no-print fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#172235] text-white shadow-lg transition-colors hover:bg-[#223247] sm:hidden"
      >
        {actionsOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </>
  )
}
