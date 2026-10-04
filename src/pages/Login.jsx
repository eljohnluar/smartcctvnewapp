import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Please enter your username and password.')
      return
    }
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Sign in failed. Check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SmartCCTV</h1>
            <p className="text-sm text-slate-500">Teacher portal</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sign in</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Use your teacher account to access attendance and reports.
            </p>
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-700">
              Username or email
            </label>
            <div className="relative">
              <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. teacher"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Teacher accounts only. Contact your administrator if you need access.
          </p>
        </form>
      </div>
    </div>
  )
}
