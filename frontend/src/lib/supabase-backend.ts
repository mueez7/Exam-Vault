// src/lib/supabase-backend.ts
//
// Typed API helpers for the ExamVault Archive.
// All queries are designed for the composite index: (college, degree, branch, year, semester)
// Never fetch full rows when a partial select is sufficient.

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of a single exam paper returned by fetchFilteredPapers.
 * `file_path` is intentionally excluded — fetch it only when the user requests a download.
 */
export interface ExamPaper {
    id: string;
    college: string;
    degree: string;
    branch: string;
    year: number;
    semester: number;
    subject: string;
    exam_type: string;
    view_count: number;
}

/**
 * Filter state as named in the Archive.jsx FILTERS array.
 * Keys use the frontend naming (sem, examtype) which are mapped to DB columns below.
 */
export interface FilterState {
    college?: string;
    degree?: string;
    branch?: string;
    year?: string | number;   // comes as string from <select>, coerced to number
    sem?: string | number;    // frontend key → DB column: semester
    subject?: string;
    examtype?: string;        // frontend key → DB column: exam_type
}

/**
 * Minimal shape for list views (no file_path, no view_count).
 * Used by the Single-Fetch strategy when only id + label is needed.
 */
export interface ExamPaperSummary {
    id: string;
    subject: string;
    degree: string;
    branch: string;
    exam_type: string;
    year: number;
    semester: number;
    college: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. fetchFilteredPapers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches exam papers matching the supplied filters.
 *
 * Strategy:
 * - Selects only the columns needed for the card grid (no `file_path` waste).
 * - Applies .eq() per active filter; omits any filter whose value is '' or undefined.
 * - Leverages the composite index (college, degree, branch, year, semester) for O(1) lookups.
 * - Falls back gracefully to an empty array on error.
 *
 * @param filters  Partial FilterState from the UI
 * @param limit    Max rows to return (default 100)
 */
export async function fetchFilteredPapers(
    filters: FilterState = {},
    limit = 100
): Promise<ExamPaper[]> {
    let query = supabase
        .from('exam_papers')
        .select('id, college, degree, branch, year, semester, subject, exam_type, view_count')
        .order('view_count', { ascending: false })
        .limit(limit);

    // ── Apply filters (only if value is present) ──

    if (filters.college)  query = query.eq('college',   filters.college);
    if (filters.degree)   query = query.eq('degree',    filters.degree);
    if (filters.branch)   query = query.eq('branch',    filters.branch);
    if (filters.subject)  query = query.eq('subject',   filters.subject);

    // year & sem arrive as strings from <select> — coerce to numbers for the integer column
    if (filters.year && filters.year !== '') {
        query = query.eq('year', Number(filters.year));
    }
    if (filters.sem && filters.sem !== '') {
        query = query.eq('semester', Number(filters.sem));
    }

    // Frontend key 'examtype' → DB column 'exam_type'
    if (filters.examtype) query = query.eq('exam_type', filters.examtype);

    const { data, error } = await query;

    if (error) {
        console.error('[ExamVault] fetchFilteredPapers error:', error.message);
        return [];
    }

    return (data as ExamPaper[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. fetchPaperSummaries (Single-Fetch lite variant)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns only id + subject — use for autocomplete / search-preview where
 * full metadata is unnecessary.
 *
 * @param searchTerm  Partial subject string
 */
export async function fetchPaperSummaries(searchTerm: string): Promise<ExamPaperSummary[]> {
    const { data, error } = await supabase
        .from('exam_papers')
        .select('id, subject, degree, branch, exam_type, year, semester, college')
        .textSearch('search_vector', searchTerm, { type: 'websearch' })
        .limit(20);

    if (error) {
        console.error('[ExamVault] fetchPaperSummaries error:', error.message);
        return [];
    }

    return (data as ExamPaperSummary[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. getSecureDownloadUrl
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a 60-second signed URL for a private PDF in the exam-vault-assets bucket.
 * The URL expires after 60 seconds to prevent hotlinking.
 *
 * Pattern: call this only at the moment the user clicks "Download",
 * NOT when rendering the card.
 *
 * @param filePath  Value of `exam_papers.file_path` (e.g. "cs/os-2024-main.pdf")
 * @returns  Signed URL string, or null on failure
 */
export async function getSecureDownloadUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from('exam-vault-assets')
        .createSignedUrl(filePath, 60);   // 60-second TTL

    if (error || !data?.signedUrl) {
        console.error('[ExamVault] getSecureDownloadUrl error:', error?.message);
        return null;
    }

    return data.signedUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. incrementViewCount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically increments view_count for a paper using a DB-side function.
 * Fire-and-forget — do not await in the critical render path.
 *
 * @param id  UUID of the exam paper
 */
export async function incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_view_count', { paper_id: id });
    if (error) {
        console.warn('[ExamVault] incrementViewCount error:', error.message);
    }
}
