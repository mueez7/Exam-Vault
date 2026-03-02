// src/lib/supabase-backend.ts
//
// Typed API helpers for the ExamVault Archive.
// All queries are designed for the composite index: (college, degree, branch, year, semester)
// Never fetch full rows when a partial select is sufficient.

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// 0. fetchFilterOptions — Dynamic dropdown values from real data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches distinct values for each filterable column.
 * Powers the Browse page dropdowns with real data from the vault.
 */
export async function fetchFilterOptions(): Promise<Record<string, string[]>> {
    const columns = ['college', 'degree', 'branch', 'year', 'semester', 'subject', 'exam_type'] as const;
    const results: Record<string, string[]> = {};

    await Promise.all(
        columns.map(async (col) => {
            const { data, error } = await supabase
                .from('exam_papers')
                .select(col)
                .order(col, { ascending: true });

            if (!error && data) {
                // Dedupe and stringify
                const unique = [...new Set(data.map((r: any) => String(r[col])).filter(Boolean))];
                results[col] = unique;
            } else {
                results[col] = [];
            }
        })
    );

    return results;
}

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

    if (filters.college) query = query.eq('college', filters.college);
    if (filters.degree) query = query.eq('degree', filters.degree);
    if (filters.branch) query = query.eq('branch', filters.branch);
    if (filters.subject) query = query.eq('subject', filters.subject);

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
        .createSignedUrl(filePath, 60, { download: true });  // Forces Content-Disposition: attachment

    if (error || !data?.signedUrl) {
        console.error('[ExamVault] getSecureDownloadUrl error:', error?.message);
        return null;
    }

    return data.signedUrl;
}

/**
 * Generates a 60-second signed URL for inline PDF viewing (no download header).
 * Use this for the embedded iframe viewer.
 */
export async function getSecureViewUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from('exam-vault-assets')
        .createSignedUrl(filePath, 60);  // No download flag — inline view

    if (error || !data?.signedUrl) {
        console.error('[ExamVault] getSecureViewUrl error:', error?.message);
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

// ─────────────────────────────────────────────────────────────────────────────
// 5. fetchPaperFilePath
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the file_path for a specific paper.
 * Needed because fetchFilteredPapers excludes file_path to save bandwidth.
 *
 * @param id UUID of the exam paper
 * @returns The file_path string or null
 */
export async function fetchPaperFilePath(id: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('exam_papers')
        .select('file_path')
        .eq('id', id)
        .single();

    if (error) {
        console.error('[ExamVault] fetchPaperFilePath error:', error.message);
        return null;
    }
    return data?.file_path || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Saved / Bookmark Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles the saved state of a paper for the current user.
 * Inserts a row in saved_papers if not saved, deletes it if already saved.
 * @returns true if now saved, false if now unsaved, null on error
 */
export async function toggleSavedPaper(paperId: string): Promise<boolean | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if already saved
    const { data: existing } = await supabase
        .from('saved_papers')
        .select('id')
        .eq('user_id', user.id)
        .eq('paper_id', paperId)
        .single();

    if (existing) {
        // Already saved → unsave it
        const { error } = await supabase
            .from('saved_papers')
            .delete()
            .eq('user_id', user.id)
            .eq('paper_id', paperId);

        if (error) { console.error('[ExamVault] unsave error:', error.message); return null; }
        return false;
    } else {
        // Not saved → save it
        const { error } = await supabase
            .from('saved_papers')
            .insert({ user_id: user.id, paper_id: paperId });

        if (error) { console.error('[ExamVault] save error:', error.message); return null; }
        return true;
    }
}

/**
 * Fetches the set of paper IDs saved by the current user.
 * Used to show filled bookmark icons on the Browse page.
 */
export async function fetchSavedPaperIds(): Promise<Set<string>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();

    const { data, error } = await supabase
        .from('saved_papers')
        .select('paper_id')
        .eq('user_id', user.id);

    if (error) { console.error('[ExamVault] fetchSavedPaperIds error:', error.message); return new Set(); }
    return new Set((data ?? []).map((r: any) => r.paper_id));
}

/**
 * Fetches full paper details for all papers saved by the current user.
 * Used on the Saved page.
 */
export async function fetchSavedPapers(): Promise<ExamPaper[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('saved_papers')
        .select(`
            paper_id,
            exam_papers (
                id, college, degree, branch, year, semester, subject, exam_type, view_count
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) { console.error('[ExamVault] fetchSavedPapers error:', error.message); return []; }

    return (data ?? [])
        .map((r: any) => r.exam_papers)
        .filter(Boolean) as ExamPaper[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Admin Management Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all exam papers for the admin Data Core view.
 * Returns full rows including file_path for admin use only.
 */
export async function fetchAllPapers(search = ''): Promise<ExamPaper[]> {
    let query = supabase
        .from('exam_papers')
        .select('id, college, degree, branch, year, semester, subject, exam_type, view_count, file_path')
        .order('view_count', { ascending: false })
        .limit(500);

    if (search.trim()) {
        query = query.ilike('subject', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) { console.error('[ExamVault] fetchAllPapers error:', error.message); return []; }
    return (data as any[]) ?? [];
}

/**
 * Deletes an exam paper by calling the backend admin API (uses service role).
 * The frontend anon key cannot delete rows due to RLS.
 * @returns true on success, false on failure
 */
export async function deletePaper(paperId: string, _filePath: string | null): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        console.error('[ExamVault] deletePaper: no session');
        return false;
    }

    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';
    try {
        const res = await fetch(`${backendUrl}/api/admin/delete/${paperId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok) {
            console.error('[ExamVault] deletePaper backend error:', json.error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[ExamVault] deletePaper fetch error:', err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Vault Metrics (Insights Tab)
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultMetrics {
    totalPapers: number;
    totalViews: number;
    topPapers: { id: string; subject: string; college: string; degree: string; branch: string; year: number; exam_type: string; view_count: number }[];
    byCollege: { label: string; count: number }[];
    byDegree: { label: string; count: number }[];
    byExamType: { label: string; count: number }[];
    byBranch: { label: string; count: number }[];
}

export async function fetchVaultMetrics(): Promise<VaultMetrics> {
    // Fetch all papers with fields needed for aggregation
    const { data, error } = await supabase
        .from('exam_papers')
        .select('id, subject, college, degree, branch, year, exam_type, view_count')
        .order('view_count', { ascending: false });

    if (error || !data) {
        console.error('[ExamVault] fetchVaultMetrics error:', error?.message);
        return { totalPapers: 0, totalViews: 0, topPapers: [], byCollege: [], byDegree: [], byExamType: [], byBranch: [] };
    }

    const totalPapers = data.length;
    const totalViews = data.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const topPapers = data.slice(0, 8);

    const groupBy = (key: string) => {
        const counts: Record<string, number> = {};
        data.forEach((p: any) => {
            const val = p[key] || 'Unknown';
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);
    };

    return {
        totalPapers,
        totalViews,
        topPapers,
        byCollege: groupBy('college'),
        byDegree: groupBy('degree'),
        byExamType: groupBy('exam_type'),
        byBranch: groupBy('branch'),
    };
}





