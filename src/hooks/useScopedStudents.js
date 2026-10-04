import { useCallback, useEffect, useState } from 'react'
import { fetchRoster } from '../services/data'
import { useAuth } from '../context/useAuth'

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
      setStudents(await fetchRoster(user.id))
      setError(null)
    } catch (err) {
      setError(err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return { students, loading, error, refetch: fetchStudents }
}

export default useScopedStudents
