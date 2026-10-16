import { useCallback, useEffect, useState } from 'react'
import { fetchRoster } from '../services/data'
import { useAuth } from '../context/useAuth'
import { assignableSections } from '../utils/constants'

/** The students registered with the signed-in teacher, and nobody else's. */
export function useScopedStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStudents = useCallback(async () => {
    if (!user?.id) {
      setStudents([])
      setLoading(false)
      return
    }
    try {
      const assigned = assignableSections(user?.year_levels, user?.sections)
      setStudents(await fetchRoster(user.id, assigned))
      setError(null)
    } catch (err) {
      setError(err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, JSON.stringify(user?.year_levels), JSON.stringify(user?.sections)])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return { students, loading, error, refetch: fetchStudents }
}

export default useScopedStudents
