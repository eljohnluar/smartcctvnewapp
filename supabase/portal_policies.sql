-- ==============================================================================
-- SmartCCTV Teacher Portal — Supabase policies
-- ==============================================================================
-- The teacher portal (smartcctvnewapp) talks to Supabase directly with the
-- anon key; it has no backend. These policies let the portal read the roster,
-- attendance and alerts, mark alerts as resolved, add students, and upload
-- webcam face-enrollment photos to the public "student-photos" bucket.
--
-- Run this in Supabase Studio → SQL Editor. Safe to re-run.
--
-- Note: the users table already allows anon reads (users_schema.sql), so no
-- policy is needed there.
-- ==============================================================================

-- ── Students: read-only for the portal ───────────────────────────────────────
DROP POLICY IF EXISTS "Teacher portal read students" ON students;
CREATE POLICY "Teacher portal read students"
    ON students
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ── Attendance: read-only for the portal ─────────────────────────────────────
DROP POLICY IF EXISTS "Teacher portal read attendance" ON attendance;
CREATE POLICY "Teacher portal read attendance"
    ON attendance
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ── Alerts: read, plus resolve (mark is_resolved = true) ─────────────────────
DROP POLICY IF EXISTS "Teacher portal read alerts" ON alerts;
CREATE POLICY "Teacher portal read alerts"
    ON alerts
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Teacher portal resolve alerts" ON alerts;
CREATE POLICY "Teacher portal resolve alerts"
    ON alerts
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ── Students: the portal can add roster rows ─────────────────────────────────
DROP POLICY IF EXISTS "Teacher portal insert students" ON students;
CREATE POLICY "Teacher portal insert students"
    ON students
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ── Students: face enrollment updates photo_url / has_face ───────────────────
DROP POLICY IF EXISTS "Teacher portal update students" ON students;
CREATE POLICY "Teacher portal update students"
    ON students
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ── Storage: public bucket for webcam enrollment photos ──────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Portal read student photos" ON storage.objects;
CREATE POLICY "Portal read student photos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "Portal upload student photos" ON storage.objects;
CREATE POLICY "Portal upload student photos"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "Portal replace student photos" ON storage.objects;
CREATE POLICY "Portal replace student photos"
    ON storage.objects
    FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'student-photos')
    WITH CHECK (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "Portal delete student photos" ON storage.objects;
CREATE POLICY "Portal delete student photos"
    ON storage.objects
    FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'student-photos');
