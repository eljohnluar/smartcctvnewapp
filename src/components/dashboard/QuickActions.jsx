import { PlusCircle, RefreshCw, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function QuickActions({ onRefresh }) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-2 py-3 text-center text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 sm:flex-row"
          >
            <PlusCircle size={16} />
            <span>Add student</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-2 py-3 text-center text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 sm:flex-row"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-2 py-3 text-center text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 sm:flex-row"
          >
            <UserCheck size={16} />
            <span>Reports</span>
          </button>
        </div>
      </div>
    </div>
  )
}
