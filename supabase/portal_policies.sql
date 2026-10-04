-- ==============================================================================
-- SmartCCTV Teacher Portal — Supabase policies
-- ==============================================================================
-- The teacher portal (smartcctvnewapp) talks to Supabase directly with the
-- anon key; it has no backend. These policies let the portal read the roster,
-- attendance and alerts, mark alerts as resolved, add students, and upload
-- webcam face-enrollment photos into the students/ folder of the existing
-- private "face-enrollments" bucket that the main backend reads from.
--
-- ROSTER PRIVACY IS APPLIED IN THE APP, NOT HERE. Each student row carries
-- students.teacher_id, the account that registered them, and the portal only ever
-- queries that teacher's own students (src/services/data.js -> fetchRoster) and
-- narrows attendance to that roster. These policies cannot tell which teacher is
-- asking because there is no Supabase Auth session, so they stay permissive; the
-- API enforces the same rule from the signed session token. Tightening this to
-- real row level security requires moving the portal onto Supabase Auth.
--
-- Run this in Supabase Studio → SQL Editor. Safe to re-run.
-- Apply backend/database/teacher_ownership.sql first so students have owners.
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

-- ── Storage: enroll into the backend's private face-enrollments bucket ───────
-- The bucket already exists (backend/database/schema.sql) and stays private:
-- the portal shows thumbnails through short-lived signed URLs, never a public
-- one. Objects are written as students/<student id>/enrollment-<angle>.jpg,
-- which is the exact path the backend's attendance confirmation matches on.

DROP POLICY IF EXISTS "Portal read student photos" ON storage.objects;
CREATE POLICY "Portal read student photos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'face-enrollments');

DROP POLICY IF EXISTS "Portal upload student photos" ON storage.objects;
CREATE POLICY "Portal upload student photos"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        bucket_id = 'face-enrollments'
        AND (storage.foldername(name))[1] = 'students'
    );

DROP POLICY IF EXISTS "Portal replace student photos" ON storage.objects;
CREATE POLICY "Portal replace student photos"
    ON storage.objects
    FOR UPDATE
    TO anon, authenticated
    USING (
        bucket_id = 'face-enrollments'
        AND (storage.foldername(name))[1] = 'students'
    )
    WITH CHECK (
        bucket_id = 'face-enrollments'
        AND (storage.foldername(name))[1] = 'students'
    );
