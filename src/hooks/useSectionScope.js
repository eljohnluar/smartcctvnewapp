import { useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { assignableSections, COLLEGE_SECTIONS } from '../utils/constants'

/**
 * Section access for the signed-in account.
 *
 * Teachers only work inside their assigned year levels x section letters, and an
 * account with nothing assigned sees nothing. Administrators are unrestricted.
 */
export function useSectionScope() {
  const { user } = useAuth()

  return useMemo(() => {
    const isTeacher = user?.role === 'teacher'
    const assigned = assignableSections(user?.year_levels, user?.sections)
    return {
      user,
      isTeacher,
      assignedSections: assigned,
      allowedSections: isTeacher ? assigned : COLLEGE_SECTIONS,
      needsAssignment: isTeacher && assigned.length === 0,
      // What the realtime socket may deliver: null means every section.
      wsSectionScope: isTeacher ? assigned : null,
    }
  }, [user])
}

export default useSectionScope
