import { statusColors, statusLabel } from '../../utils/helpers'

export default function Badge({ status, label }) {
  const colors = statusColors(status)
  const text = label ?? (status ? statusLabel(status) : '—')
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {text}
    </span>
  )
}
