import { useCallback, useEffect, useState } from 'react'
import { fetchAllStudents } from '../services/data'
import { studentInScope } from '../utils/helpers'
import { useAuth } from '../context/useAuth'

/** The roster, limited to the signed-in teacher's assigned sections. */
export function useScopedStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStudents = useCallback(async () => {
    try {
      const all = await fetchAllStudents()
      const scoped = all.filter((student) =>
        studentInScope(student, user?.year_levels, user?.sections),
      )
      setStudents(scoped)
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
