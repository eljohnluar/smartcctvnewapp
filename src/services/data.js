import supabase from './supabase'

const STUDENT_COLUMNS = 'id, student_id, full_name, section, grade_level, photo_url, has_face, created_at'

/** Fetch the whole roster in 1000-row pages (Supabase's per-request cap). */
export async function fetchAllStudents() {
  let all = []
  let from = 0
  const pageSize = 1000
  for (;;) {
    const { data, error } = await supabase
      .from('students')
      .select(STUDENT_COLUMNS)
      .order('full_name')
      .range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    all = all.concat(rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return all
}

/** Attendance rows for a date range, with the joined student profile. */
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

export const PHOTO_BUCKET = 'student-photos'
export const ENROLLMENT_ANGLES = ['front', 'left', 'right', 'upward']

export async function createStudent({ student_id, full_name, section, grade_level }) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      student_id: student_id.trim(),
      full_name: full_name.trim(),
      section,
      grade_level,
      has_face: false,
    })
    .select(STUDENT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

/**
 * Upload the four webcam enrollment captures to the public photo bucket and
 * mark the student as enrolled. The AI embeddings themselves are computed by
 * the main backend pipeline; the portal stores the source photos.
 */
export async function enrollStudentFace(student, captures) {
  const storage = supabase.storage.from(PHOTO_BUCKET)
  const urls = {}
  for (const angle of ENROLLMENT_ANGLES) {
    const blob = captures[angle]
    if (!blob) continue
    const path = `${student.id}/${angle}.jpg`
    const { error: uploadError } = await storage.upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (uploadError) throw uploadError
    urls[angle] = storage.getPublicUrl(path).data.publicUrl
  }
  if (!urls.front) throw new Error('Capture the front-facing photo before saving.')
  const { data, error } = await supabase
    .from('students')
    .update({
      photo_url: urls.front,
      face_storage_path: `${PHOTO_BUCKET}/${student.id}`,
      has_face: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', student.id)
    .select(STUDENT_COLUMNS)
    .single()
  if (error) throw error
  return data
}
