import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ChevronDown, ArrowDown, Search, Bookmark, Download, Loader2, X, ExternalLink } from 'lucide-react';
import { fetchFilteredPapers, getSecureDownloadUrl, getSecureViewUrl, incrementViewCount, fetchPaperFilePath, fetchFilterOptions, toggleSavedPaper, fetchSavedPaperIds } from '../lib/supabase-backend';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FILTERS = [
    { id: 'college', label: 'College', dbCol: 'college' },
    { id: 'degree', label: 'Degree', dbCol: 'degree' },
    { id: 'branch', label: 'Branch', dbCol: 'branch' },
    { id: 'year', label: 'Year', dbCol: 'year' },
    { id: 'sem', label: 'Sem', dbCol: 'semester' },
    { id: 'subject', label: 'Subject', dbCol: 'subject' },
    { id: 'examtype', label: 'Exam Type', dbCol: 'exam_type' },
];

const EMPTY_FILTERS = {
    college: '', degree: '', branch: '', year: '', sem: '', subject: '', examtype: '',
};

export default function Archive() {
    const container = useRef(null);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [viewingPaper, setViewingPaper] = useState(null);
    const [viewUrl, setViewUrl] = useState(null);
    const [loadingView, setLoadingView] = useState(false);
    const [filterOptions, setFilterOptions] = useState({});
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [savedIds, setSavedIds] = useState(new Set());

    // Fetch dynamic filter options from DB on mount
    useEffect(() => {
        fetchFilterOptions().then(opts => {
            setFilterOptions(opts);
            setLoadingFilters(false);
        });
        // Also load which papers the user has already saved
        fetchSavedPaperIds().then(ids => setSavedIds(ids));
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (viewingPaper) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto'; // or '' 
        }
        return () => {
            document.body.style.overflow = 'auto'; // Reset on unmount
        };
    }, [viewingPaper]);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 2 } });
            tl.to('.hero-elem', { opacity: 1, y: 0, stagger: 0.15, delay: 0.2 });

            gsap.fromTo('.filter-text',
                { opacity: 0, y: 10 },
                {
                    scrollTrigger: { trigger: '#vault-explorer', start: 'top 85%' },
                    opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out',
                }
            );
        }, container);
        return () => ctx.revert();
    }, []);

    const handleScroll = () => {
        const target = document.getElementById('vault-explorer');
        if (target) window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    };

    const handleFilterChange = (id, value) => {
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const handleApplyFilters = useCallback(async () => {
        setLoading(true);
        setFetched(false);
        const results = await fetchFilteredPapers(filters);
        setPapers(results);
        setLoading(false);
        setFetched(true);

        gsap.fromTo('.paper-card',
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' }
        );
    }, [filters]);

    const handleDownload = async (paper) => {
        try {
            setDownloading(paper.id);

            let filePath = paper.file_path;
            if (!filePath) {
                filePath = await fetchPaperFilePath(paper.id);
            }

            if (!filePath) {
                alert('File path not found for this paper.');
                return;
            }

            const url = await getSecureDownloadUrl(filePath);
            if (!url) {
                alert('Could not generate download link. Please try again.');
                return;
            }

            // Fetch as blob and trigger download directly — no new tab
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = `${paper.subject || 'exam-paper'}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download error:', err);
            alert('An error occurred during download.');
        } finally {
            setDownloading(null);
        }
    };

    const handleViewPaper = async (paper) => {
        try {
            setLoadingView(true);
            setViewingPaper(paper);
            incrementViewCount(paper.id); // atomic increment

            let filePath = paper.file_path;
            if (!filePath) {
                filePath = await fetchPaperFilePath(paper.id);
            }

            if (!filePath) {
                alert('Document path not found.');
                setViewingPaper(null);
                return;
            }

            const url = await getSecureViewUrl(filePath);
            if (url) {
                setViewUrl(url);
            } else {
                alert('Could not generate secure view link.');
                setViewingPaper(null);
            }
        } catch (error) {
            console.error('View error:', error);
            alert('An error occurred while opening the document.');
            setViewingPaper(null);
        } finally {
            setLoadingView(false);
        }
    };

    const closeViewer = () => {
        setViewingPaper(null);
        setViewUrl(null);
    };

    const handleBookmark = async (e, paperId) => {
        e.stopPropagation();
        const result = await toggleSavedPaper(paperId);
        if (result === null) return; // error
        setSavedIds(prev => {
            const next = new Set(prev);
            if (result) next.add(paperId);
            else next.delete(paperId);
            return next;
        });
    };

    const handleResetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setPapers([]);
        setFetched(false);
    };

    return (
        <div ref={container} className="flex flex-col w-full bg-[#050505] relative">

            {/* ── Hero Section ── */}
            <section className="w-full h-screen flex flex-col items-center justify-center text-center px-6 relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full opacity-30 pointer-events-none mx-auto max-w-4xl max-h-4xl"></div>

                <div className="flex flex-col items-center justify-center mt-auto">
                    <h2 className="hero-elem text-blue-500 text-[10px] md:text-xs uppercase tracking-[0.8em] mb-8 font-bold opacity-0 translate-y-10">
                        The Archival Vault
                    </h2>
                    <h1 className="hero-elem text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 opacity-0 translate-y-10">
                        Download the <span className="italic font-light text-gray-500">PYQs.</span>
                    </h1>
                    <p className="hero-elem text-gray-400 max-w-xl mx-auto text-sm md:text-base tracking-widest leading-relaxed opacity-0 translate-y-10">
                        ACCUMULATING DECADES OF ACADEMIC KNOWLEDGE INTO A SINGLE, HIGH-VELOCITY QUERY ENGINE EXCLUSIVE FOR PROTOCOL MEMBERS.
                    </p>
                </div>

                <button
                    onClick={handleScroll}
                    className="hero-elem opacity-0 translate-y-10 bg-transparent text-gray-500 hover:text-white px-10 py-5 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] transition-colors flex items-center gap-3 mt-auto mb-32 group"
                >
                    Scroll to Initialize <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
            </section>

            {/* ── Exploration Area ── */}
            <section id="vault-explorer" className="w-full bg-[#050505] min-h-screen border-t border-white/5 pt-20">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-12 lg:gap-24 relative">

                    {/* ── Left Sidebar — Filters ── */}
                    <aside className="w-full md:w-64 shrink-0 mb-12 md:mb-0 filter-text relative z-10 block">
                        <div className="sticky top-24 flex flex-col gap-6">
                            <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Filter Protocol</h3>

                            <button
                                onClick={handleApplyFilters}
                                disabled={loading}
                                className="w-full mb-2 bg-transparent hover:bg-blue-600/5 text-blue-500 border border-blue-500/20 hover:border-blue-500/40 px-8 py-4 rounded-xl text-[10px] md:text-xs uppercase tracking-[0.15em] font-black transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Querying…</>
                                    : <><Search className="w-4 h-4 group-hover:scale-110 transition-transform" /> Apply Sequence</>
                                }
                            </button>

                            {fetched && (
                                <button
                                    onClick={handleResetFilters}
                                    className="w-full mb-4 text-gray-600 hover:text-gray-400 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                                >
                                    ✕ Reset Filters
                                </button>
                            )}

                            <div className="flex flex-col gap-3">
                                {FILTERS.map(f => (
                                    <div key={f.id} className="relative group">
                                        <select
                                            value={filters[f.id] ?? ''}
                                            onChange={e => handleFilterChange(f.id, e.target.value)}
                                            disabled={loadingFilters}
                                            className="appearance-none w-full cursor-pointer bg-[#0a0a0a] hover:bg-[#111] px-4 py-4 pr-10 border-b border-white/5 hover:border-white/20 transition-all text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold text-gray-300 focus:outline-none focus:border-blue-500/50 [&>option]:bg-[#050505]"
                                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                                        >
                                            <option value="" className="bg-[#050505] text-gray-500">
                                                {loadingFilters ? 'Loading...' : f.label}
                                            </option>
                                            {(filterOptions[f.dbCol] || []).map(opt => (
                                                <option key={opt} value={opt} className="bg-[#050505] text-white">{opt}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Right Side — Results Grid ── */}
                    <main id="vault-grid" className="flex-1 flex flex-col pb-32">
                        <div className="flex items-center justify-between px-2 pb-6 border-b border-white/5 mb-6">
                            <h3 className="text-[17px] md:text-xl font-black text-white px-2 tracking-tight">
                                Archived Resources
                            </h3>
                            {fetched && (
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    {papers.length} result{papers.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* ── Loading Skeleton ── */}
                        {loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex flex-col bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden animate-pulse">
                                        <div className="w-full aspect-[3/4] bg-white/[0.03]" />
                                        <div className="p-4 flex flex-col gap-3">
                                            <div className="h-3 bg-white/[0.05] rounded w-3/4" />
                                            <div className="h-2 bg-white/[0.03] rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Empty State (before first fetch) ── */}
                        {!loading && !fetched && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                                <Search className="w-12 h-12 text-gray-700" />
                                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
                                    Select filters and apply sequence to query the vault.
                                </p>
                            </div>
                        )}

                        {/* ── No Results ── */}
                        {!loading && fetched && papers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                                <FileText className="w-12 h-12 text-gray-700" />
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                    No records match the selected sequence.
                                </p>
                                <button
                                    onClick={handleResetFilters}
                                    className="text-blue-500 text-[10px] font-bold uppercase tracking-widest hover:text-blue-400 transition-colors mt-2"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}

                        {/* ── Results Grid ── */}
                        {!loading && papers.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                                {papers.map(doc => (
                                    <div
                                        key={doc.id}
                                        onClick={() => handleViewPaper(doc)}
                                        className="group flex flex-col bg-[#050505] border border-white/5 rounded-xl paper-card transition-all duration-300 ease-out cursor-pointer relative hover:bg-[#0a0a0a]"
                                    >
                                        {/* Thumbnail Area */}
                                        <div className="w-full aspect-[3/4] bg-[#0a0a0a] relative p-4 flex items-center justify-center border border-transparent border-b-white/5 overflow-hidden rounded-t-xl group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out z-10 w-full">
                                            {/* Top right - Loading Indicator */}
                                            {loadingView && viewingPaper?.id === doc.id && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                                </div>
                                            )}

                                            <div className="absolute top-3 left-3 bg-[#1a1a1a] text-gray-300 border border-white/5 text-[8px] font-bold px-2 py-1 rounded shadow-md z-10 uppercase tracking-widest">
                                                PDF
                                            </div>
                                            <div className="w-[65%] h-[80%] bg-[#111] border border-white/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-out">
                                                <FileText className="w-8 h-8 text-white/10 group-hover:text-blue-500/30 transition-colors" />
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="flex flex-col p-4 grow">
                                            <h4 className="text-[14px] font-bold text-white leading-tight mb-1.5 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                                {doc.subject}
                                            </h4>
                                            <span className="text-[10px] text-gray-500 font-medium mb-1">
                                                {doc.degree} • {doc.branch}
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-medium mb-auto">
                                                {doc.college}
                                            </span>

                                            <div className="flex items-center justify-between mt-6">
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                    {doc.exam_type} • {doc.year}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleBookmark(e, doc.id)}
                                                        className={`transition-colors p-1 ${savedIds.has(doc.id) ? 'text-blue-400' : 'text-gray-600 hover:text-white'}`}
                                                        title={savedIds.has(doc.id) ? 'Unsave paper' : 'Save paper'}
                                                    >
                                                        <Bookmark className={`w-4 h-4 ${savedIds.has(doc.id) ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>

                </div>
            </section>

            <PdfViewerModal
                viewingPaper={viewingPaper}
                viewUrl={viewUrl}
                downloading={downloading}
                onDownload={() => handleDownload(viewingPaper)}
                onClose={closeViewer}
            />
        </div>
    );
}

/* ── Extracted PDF Viewer Modal (portaled to document.body) ── */
function PdfViewerModal({ viewingPaper, viewUrl, downloading, onDownload, onClose }) {
    if (!viewingPaper || !viewUrl) return null;
    return createPortal(
        <div
            className="fixed inset-0 flex flex-col"
            style={{ zIndex: 99999 }}
            role="dialog"
            aria-modal="true"
        >
            {/* Dark scrollbar styling scoped to this portal */}
            <style>{`
                .pdf-modal-inner ::-webkit-scrollbar { width: 5px; height: 5px; }
                .pdf-modal-inner ::-webkit-scrollbar-track { background: #111; }
                .pdf-modal-inner ::-webkit-scrollbar-thumb { background: #333; border-radius: 8px; }
                .pdf-modal-inner ::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Panel — sits above the backdrop */}
            <div className="pdf-modal-inner relative flex flex-col w-full h-full max-w-6xl mx-auto my-6 pointer-events-none">
                {/* Inner box with pointer-events re-enabled */}
                <div className="pointer-events-auto flex flex-col w-full h-full bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">

                    {/* ── Header bar ── */}
                    <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070707]">
                        <div className="flex flex-col min-w-0 mr-4">
                            <h3 className="text-white font-bold text-sm leading-tight truncate">
                                {viewingPaper.subject}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
                                {viewingPaper.degree} • {viewingPaper.branch} • {viewingPaper.year}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={onDownload}
                                disabled={downloading === viewingPaper.id}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
                            >
                                {downloading === viewingPaper.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Download className="w-4 h-4" />
                                }
                                Download
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Close Viewer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* ── PDF Frame ── */}
                    <div className="flex-1 relative bg-[#111] min-h-0">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
                        </div>
                        <iframe
                            src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            title={viewingPaper.subject}
                            className="relative w-full h-full border-none"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
