import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'

/**
 * Re-authentication prompt for destructive / admin actions. The password is handed to
 * onSubmit and verified by the API; it is never stored in the browser.
 */
export default function PasswordConfirmModal({
  open,
  title = 'Confirm your identity',
  description = 'This action requires your account password.',
  confirmLabel = 'Confirm',
  busy = false,
  error = '',
  onCancel,
  onSubmit,
}) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setVisible(false)
      const timer = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!password || busy) return
    onSubmit(password)
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">{description}</p>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your account password"
              autoComplete="current-password"
              className="w-full px-3 py-2 pl-9 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setVisible((previous) => !previous)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !password}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {busy ? 'Verifying…' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
