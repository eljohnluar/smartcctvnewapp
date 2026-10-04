import supabase from './supabase'

const STUDENT_COLUMNS =
  'id, student_id, full_name, section, grade_level, face_storage_path, has_face, teacher_id, created_at'

/**
 * The private bucket the main backend reads for face recognition. Objects live
 * at students/<id>/enrollment-<angle>.jpg, which is the exact path the backend
 * matches on, so the portal must use the same layout.
 */
export const FACE_BUCKET = 'face-enrollments'
export const FACE_FOLDER = 'students'
const PHOTO_URL_TTL = 3600

/**
 * The roster registered with one teacher, in 1000-row pages (Supabase's
 * per-request cap). A teacher never receives another teacher's students.
 */
export async function fetchRoster(teacherId) {
  let all = []
  let from = 0
  const pageSize = 1000
  for (;;) {
    const { data, error } = await supabase
      .from('students')
      .select(STUDENT_COLUMNS)
      .eq('teacher_id', teacherId)
      .order('full_name')
      .range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    all = all.concat(rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return withPhotoUrls(all)
}

/**
 * Enrollment photos are private, so the roster carries a short-lived signed URL
 * per student instead of a stored public one.
 */
async function withPhotoUrls(rows) {
  const paths = [...new Set(rows.map((row) => row.face_storage_path).filter(Boolean))]
  if (paths.length === 0) return rows.map((row) => ({ ...row, photo_url: null }))
  const { data } = await supabase.storage.from(FACE_BUCKET).createSignedUrls(paths, PHOTO_URL_TTL)
  const signed = new Map()
  ;(data ?? []).forEach((entry, index) => {
    if (entry?.signedUrl) signed.set(paths[index], entry.signedUrl)
  })
  return rows.map((row) => ({ ...row, photo_url: signed.get(row.face_storage_path) ?? null }))
}

/**
 * Attendance rows for a date range, with the joined student profile. Callers
 * narrow these to their own roster, since a row is only visible through the
 * student it belongs to.
 */
export async function fetchAttendanceRange(startISO, endISO) {
  const { data, error } = await supabase
    .from('attendance')
    .select(
      'id, class_date, check_in_time, status, confidence, student_id, students(full_name, student_id, section, grade_level)',
    )
    .gte('class_date', startISO)
    .lte('class_date', endISO)
    .order('check_in_time', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const ENROLLMENT_ANGLES = ['front', 'left', 'right', 'upward']

/** The object path the main backend expects for a student's capture. */
const enrollmentPath = (studentId, angle) => `${FACE_FOLDER}/${studentId}/enrollment-${angle}.jpg`

export async function createStudent({ student_id, full_name, section, grade_level, teacher_id }) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      student_id: student_id.trim(),
      full_name: full_name.trim(),
      section,
      grade_level,
      has_face: false,
      teacher_id: teacher_id ?? null,
    })
    .select(STUDENT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

/**
 * Upload the four webcam captures to the backend's private enrollment bucket and
 * point the student row at the front one. The AI embeddings themselves are
 * computed by the main backend pipeline; the portal stores the source photos.
 */
export async function enrollStudentFace(student, captures) {
  if (!captures.front) throw new Error('Capture the front-facing photo before saving.')
  const storage = supabase.storage.from(FACE_BUCKET)
  for (const angle of ENROLLMENT_ANGLES) {
    const blob = captures[angle]
    if (!blob) continue
    const { error: uploadError } = await storage.upload(enrollmentPath(student.id, angle), blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (uploadError) throw uploadError
  }
  const { data, error } = await supabase
    .from('students')
    .update({
      face_storage_path: enrollmentPath(student.id, 'front'),
      has_face: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', student.id)
    .select(STUDENT_COLUMNS)
    .single()
  if (error) throw error
  return data
}
