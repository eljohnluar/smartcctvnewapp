const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export default function LoadingSpinner({ label = 'Loading…', size = 'md' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div
        className={`${sizes[size] || sizes.md} animate-spin rounded-full border-2 border-emerald-600 border-t-transparent`}
      />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
