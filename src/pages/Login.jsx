import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { registerAccount } from '../services/api'

function LogoMark({ className = 'h-4 w-4 rounded-full object-cover' }) {
  return (
    <img
      src="/logo-mark.jpg"
      alt=""
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

export default function Login() {
  const { user, login, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [authMode, setAuthMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [registrationCode, setRegistrationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loading = authLoading || submitting

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleLoginSubmit = async (event) => {
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

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Username and password are required.')
      return
    }
    if (!registrationCode.trim()) {
      toast.error('Clearance code is required.')
      return
    }
    setSubmitting(true)
    try {
      await registerAccount({
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
        registration_code: registrationCode.trim().toUpperCase(),
      })
      toast.success('Account created. Signing you in…')
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar with home button */}
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-end">
          <Link
            to="/landing"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
              <LogoMark className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SmartCamera</h1>
              <p className="text-sm text-slate-500">
                {authMode === 'signin' ? 'Sign in to your account' : 'Create an administrator account'}
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            {/* Sign in / Register toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  authMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Lock size={13} />
                <span>Sign in</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <KeyRound size={13} />
                <span>Register</span>
              </button>
            </div>

            {authMode === 'signin' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      className={inputClass}
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
                      className={`${inputClass} pr-10`}
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
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="reg-name" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Maria Santos"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="reg-username" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      autoComplete="username"
                      placeholder="required"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="required"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Email (optional)
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@school.internal"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label htmlFor="reg-code" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <KeyRound size={13} />
                    Clearance code (required)
                  </label>
                  <input
                    id="reg-code"
                    type="text"
                    placeholder="Enter administrator code"
                    value={registrationCode}
                    onChange={(event) => setRegistrationCode(event.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-slate-900 placeholder-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                  <p className="mt-1.5 text-[10px] leading-relaxed text-amber-700/80">
                    Only administrator accounts register here. Teacher accounts are created by an administrator.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
