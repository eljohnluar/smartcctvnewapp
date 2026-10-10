import { Clock, TrendingDown, TrendingUp, UserCheck, UserMinus, Users } from 'lucide-react'

const cards = [
  {
    key: 'rate',
    label: 'Attendance Rate',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    getValue: (s) => `${s.rate}%`,
    sub: (s) => (s.rate >= 75 ? 'Above target' : 'Below target'),
    subColor: (s) => (s.rate >= 75 ? 'text-emerald-600' : 'text-red-600'),
  },
  {
    key: 'present',
    label: 'Time In',
    icon: UserCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    getValue: (s) => s.present,
    sub: (s) => (s.late > 0 ? `${s.late} late check-ins` : 'All on time'),
    subColor: () => 'text-emerald-600',
  },
  {
    key: 'late',
    label: 'Late',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    getValue: (s) => s.late,
    sub: (s) => (s.late > 0 ? `${s.late} past 30m grace` : 'None today'),
    subColor: () => 'text-amber-600',
  },
  {
    key: 'time_out',
    label: 'Time Out',
    icon: UserMinus,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    getValue: (s) => s.time_out ?? 0,
    sub: (s) => ((s.time_out ?? 0) > 0 ? 'Left after the Time out' : 'None today'),
    subColor: (s) => ((s.time_out ?? 0) > 0 ? 'text-rose-600' : 'text-slate-500'),
  },
  {
    key: 'total',
    label: 'Total Students',
    icon: Users,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    getValue: (s) => s.total,
    sub: () => 'Enrolled',
    subColor: () => 'text-slate-500',
  },
]

export default function StatsCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, color, bg, getValue, sub, subColor }) => (
        <div
          key={key}
          className="min-h-40 rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className={`rounded-xl p-2.5 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <TrendingUp size={12} className="mt-1 text-slate-300" />
          </div>
          {loading ? (
            <div className="h-8 w-16 rounded bg-slate-200 animate-pulse mb-1" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{getValue(stats)}</p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          {!loading && (
            <p className={`text-xs mt-2 font-medium ${subColor(stats)}`}>{sub(stats)}</p>
          )}
        </div>
      ))}
    </div>
  )
}
