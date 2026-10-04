import { useCallback, useEffect, useState } from 'react'
import supabase from '../services/supabase'
import { hashPassword } from '../utils/helpers'
import { AuthContext } from './auth-context'

const USER_STORAGE_KEY = 'smartcctvnewapp_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const identity = username.trim().toLowerCase()
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, password_hash, full_name, role, is_active, year_levels, sections, last_login_at')
        .or(`username.eq.${identity},email.eq.${identity}`)
        .limit(1)
        .maybeSingle()

      if (error) throw new Error('Unable to reach the database. Please try again.')

      if (!data) throw new Error('Invalid username or password.')
      if (!data.is_active) throw new Error('This account has been deactivated.')
      if (data.role !== 'teacher') throw new Error('This portal is for teachers only.')

      const candidateHash = await hashPassword(password)
      if (candidateHash !== data.password_hash) {
        throw new Error('Invalid username or password.')
      }

      const teacherUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        year_levels: data.year_levels ?? [],
        sections: data.sections ?? [],
      }
      setUser(teacherUser)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(teacherUser))

      // Fire-and-forget: keep the last-login stamp fresh.
      supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id)
        .then(() => {})

      return teacherUser
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === USER_STORAGE_KEY) {
        try {
          setUser(event.newValue ? JSON.parse(event.newValue) : null)
        } catch {
          setUser(null)
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
