-- =============================================================================
-- ExamVault — Initial Schema Migration
-- =============================================================================
-- Run order:
--   1. exam_papers table + indexes
--   2. Full-text search trigger
--   3. Row-level security policies
--   4. Storage bucket + storage policies
--   5. Atomic view-count RPC
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_papers (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    college       text        NOT NULL,
    degree        text        NOT NULL,
    branch        text        NOT NULL,
    year          integer     NOT NULL CHECK (year >= 1900 AND year <= 2100),
    semester      integer     NOT NULL CHECK (semester >= 1 AND semester <= 8),
    subject       text        NOT NULL,
    exam_type     text        NOT NULL,
    file_path     text        NOT NULL,
    view_count    bigint      NOT NULL DEFAULT 0,
    search_vector tsvector    GENERATED ALWAYS AS (
                                  to_tsvector('english', subject)
                              ) STORED,
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.exam_papers IS
    'Stores academic exam paper metadata. PDFs live in the exam-vault-assets storage bucket.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Primary composite index — the 7-layer filter query will hit this first.
-- Ordering: most-selective → least-selective for maximum prefix usage.
CREATE INDEX IF NOT EXISTS idx_exam_papers_filters
    ON public.exam_papers (college, degree, branch, year, semester);

-- Individual indexes for single-column filter scenarios
CREATE INDEX IF NOT EXISTS idx_exam_papers_college    ON public.exam_papers (college);
CREATE INDEX IF NOT EXISTS idx_exam_papers_degree     ON public.exam_papers (degree);
CREATE INDEX IF NOT EXISTS idx_exam_papers_branch     ON public.exam_papers (branch);
CREATE INDEX IF NOT EXISTS idx_exam_papers_year       ON public.exam_papers (year);
CREATE INDEX IF NOT EXISTS idx_exam_papers_semester   ON public.exam_papers (semester);
CREATE INDEX IF NOT EXISTS idx_exam_papers_subject    ON public.exam_papers (subject);
CREATE INDEX IF NOT EXISTS idx_exam_papers_exam_type  ON public.exam_papers (exam_type);

-- GIN index for full-text search on the generated tsvector column
CREATE INDEX IF NOT EXISTS idx_exam_papers_fts
    ON public.exam_papers USING GIN (search_vector);

-- Partial index for popular papers (fast leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_exam_papers_popular
    ON public.exam_papers (view_count DESC)
    WHERE view_count > 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can read exam papers
CREATE POLICY "public_select"
    ON public.exam_papers
    FOR SELECT
    USING (true);

-- Only service_role (server-side / admin backend) can write
CREATE POLICY "service_role_insert"
    ON public.exam_papers
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_update"
    ON public.exam_papers
    FOR UPDATE
    USING  (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_delete"
    ON public.exam_papers
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the private PDF bucket (public = false prevents direct URL access)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
    'exam-vault-assets',
    'exam-vault-assets',
    false,
    ARRAY['application/pdf'],
    52428800  -- 50 MB per file
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to generate a signed URL (SELECT on objects)
CREATE POLICY "storage_public_read"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'exam-vault-assets');

-- Only service_role can upload PDFs
CREATE POLICY "storage_service_insert"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'exam-vault-assets'
        AND auth.role() = 'service_role'
    );

-- Only service_role can delete PDFs
CREATE POLICY "storage_service_delete"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'exam-vault-assets'
        AND auth.role() = 'service_role'
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ATOMIC VIEW-COUNT RPC
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_view_count(paper_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.exam_papers
    SET    view_count = view_count + 1
    WHERE  id = paper_id;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon, authenticated;
