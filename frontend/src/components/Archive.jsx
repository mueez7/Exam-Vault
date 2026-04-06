import React, { useLayoutEffect, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ChevronDown, ArrowDown, Search, Bookmark, Download, Loader2, X, ExternalLink, Settings2, ChevronRight } from 'lucide-react';
import { fetchFilteredPapers, getSecureDownloadUrl, getSecureViewUrl, incrementViewCount, fetchPaperFilePath, fetchRawFilterData, toggleSavedPaper, fetchSavedPaperIds } from '../lib/supabase-backend';
import { useAuth } from '../context/AuthContext';
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
    const [rawFilterData, setRawFilterData] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [savedIds, setSavedIds] = useState(new Set());
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const { user } = useAuth();
    const filterOptionsLoaded = useRef(false);
    const savedIdsLoaded = useRef(false); // guard against repeated auth state fires

    // 1. Load saved IDs only once when user ID becomes available
    useEffect(() => {
        if (!user?.id || savedIdsLoaded.current) return;
        savedIdsLoaded.current = true;
        fetchSavedPaperIds(user.id).then(ids => setSavedIds(ids));
    }, [user?.id]); // stable primitive — won't fire on object re-renders

    // 2. Load filter options lazily — called on first filter panel open
    const ensureFilterOptions = useCallback(() => {
        if (filterOptionsLoaded.current) return;
        filterOptionsLoaded.current = true;
        setLoadingFilters(true);
        fetchRawFilterData().then(data => {
            setRawFilterData(data);
            setLoadingFilters(false);
        });
    }, []);

    // 3. Dynamically compute cascading filter options
    const filterOptions = useMemo(() => {
        const result = {};
        if (!rawFilterData.length) return result;

        for (const filterMeta of FILTERS) {
            // Apply all OTHER active filters to the raw data
            const validRows = rawFilterData.filter(row => {
                for (const otherMeta of FILTERS) {
                    if (otherMeta.id === filterMeta.id) continue;
                    const activeVal = filters[otherMeta.id];
                    if (activeVal && String(row[otherMeta.dbCol]).trim() !== String(activeVal).trim()) {
                        return false; // Row eliminated by other active filter
                    }
                }
                return true;
            });
            // Extract unique values for this filter
            result[filterMeta.dbCol] = [...new Set(validRows.map(r => String(r[filterMeta.dbCol]).trim()).filter(Boolean))].sort();
        }
        return result;
    }, [rawFilterData, filters]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (viewingPaper || isMobileFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto'; // or '' 
        }
        return () => {
            document.body.style.overflow = 'auto'; // Reset on unmount
        };
    }, [viewingPaper, isMobileFilterOpen]);

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

        // Smooth scroll to results
        setTimeout(() => {
            const grid = document.getElementById('vault-grid');
            if (grid) {
                const yOffset = -100; // Account for floating capsule navbar
                const y = grid.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
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

            {/* ── App Header ── */}
            <section className="w-full bg-[#050505] min-h-screen pt-28 md:pt-32">
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex flex-col mb-4 relative">
                    <div className="absolute top-0 left-1/4 bg-white/5 blur-[100px] w-64 h-64 rounded-full pointer-events-none"></div>
                    
                    <h1 className="hero-elem text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 opacity-0 translate-y-4">
                        Download PYQs.
                    </h1>
                    <p className="hero-elem text-gray-500 text-sm md:text-base font-medium opacity-0 translate-y-4">
                        Search and download previous year question papers.
                    </p>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-24 relative">

                    {/* ── Left Sidebar — Filters ── */}
                    {/* Background Overlay for Mobile */}
                    {isMobileFilterOpen && (
                        <div 
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                            onClick={() => setIsMobileFilterOpen(false)}
                        />
                    )}

                    <aside
                        className={`w-full md:w-64 shrink-0 filter-text relative z-50 block 
                                     fixed inset-x-0 bottom-0 md:static
                                     bg-[#0a0a0a] md:bg-transparent
                                     rounded-t-3xl md:rounded-none
                                     border-t border-white/10 md:border-0
                                     p-6 md:p-0
                                     transform transition-transform duration-300 ease-out
                                     max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible
                                     ${isMobileFilterOpen ? 'translate-y-0 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]' : 'translate-y-full md:translate-y-0'}
                                   `}
                        onMouseEnter={ensureFilterOptions}
                        onFocus={ensureFilterOptions}
                        onTouchStart={ensureFilterOptions}
                    >
                        {/* Drag Handle & Close Button for Mobile */}
                        <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.15em]">Filter Protocol</h3>
                            <button 
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="sticky top-24 flex flex-col gap-6">
                            <h3 className="hidden md:block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.15em]">Filter Protocol</h3>

                            <button
                                onClick={() => {
                                    handleApplyFilters();
                                    if (window.innerWidth < 768) setIsMobileFilterOpen(false);
                                }}
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
                                            className="appearance-none w-full cursor-pointer bg-transparent hover:bg-white/[0.02] px-4 py-4 pr-10 border-b border-white/5 hover:border-white/20 transition-colors text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold text-gray-400 focus:outline-none focus:border-blue-500/50 [&>option]:bg-[#050505]"
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
                            <div className="flex flex-col">
                                <h3 className="text-[17px] md:text-xl font-black text-white tracking-tight">
                                    Archived Resources
                                </h3>
                                {fetched && (
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        {papers.length} result{papers.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            
                            {/* Mobile Filter Toggle */}
                            <button 
                                onClick={() => {
                                    ensureFilterOptions();
                                    setIsMobileFilterOpen(true);
                                }}
                                className="md:hidden flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 px-4 py-2.5 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest text-white shadow-lg active:scale-95"
                            >
                                <Settings2 className="w-4 h-4 text-blue-500" />
                                Filters
                            </button>
                        </div>

                        {/* ── Loading Skeleton ── */}
                        {loading && (
                            <>
                                <style>{`
                                    @keyframes shimmer {
                                        100% { transform: translateX(100%); }
                                    }
                                `}</style>
                                <div className="flex flex-col w-full">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="relative border-b border-white/5 h-[76px] w-full overflow-hidden">
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" style={{ animation: 'shimmer 2s infinite ease-in-out', animationDelay: `${i * 0.1}s` }} />
                                        </div>
                                    ))}
                                </div>
                            </>
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

                        {/* ── Results List ── */}
                        {!loading && papers.length > 0 && (
                            <div className="flex flex-col w-full">
                                {papers.map(doc => (
                                    <div
                                        key={doc.id}
                                        onClick={() => handleViewPaper(doc)}
                                        className="group relative w-full border-b border-white/5 paper-card transition-colors duration-200 ease-out cursor-pointer hover:bg-white/[0.02]"
                                    >
                                        <div className="flex flex-row items-center py-3.5 sm:py-4 gap-4 md:gap-6">
                                            {/* Flat Icon */}
                                            <div className="w-8 md:w-10 h-8 md:h-10 shrink-0 flex items-center justify-center relative">
                                                {loadingView && viewingPaper?.id === doc.id ? (
                                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                ) : (
                                                    <FileText className="w-5 md:w-6 h-5 md:h-6 text-gray-600" />
                                                )}
                                            </div>
                                            
                                            {/* Content Area */}
                                            <div className="flex-1 flex flex-col min-w-0 justify-center">
                                                <div className="flex items-baseline gap-3 mb-1">
                                                    <span className="px-2 py-[2px] rounded text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-gray-300 border border-white/10 backdrop-blur-md shadow-[0_0_10px_rgba(255,255,255,0.02)]">
                                                        {doc.exam_type}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase">
                                                        {doc.year}
                                                    </span>
                                                </div>
                                                <h4 className="text-[14px] md:text-base font-bold text-white leading-tight mb-0.5 truncate group-hover:text-blue-400 transition-colors">
                                                    {doc.subject}
                                                </h4>
                                                <span className="truncate text-[10px] md:text-xs text-gray-500 font-medium tracking-wide">
                                                    {doc.degree} • {doc.branch} <span className="hidden md:inline">• {doc.college}</span>
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="shrink-0 flex items-center gap-2 pl-4">
                                                <button
                                                    onClick={(e) => handleBookmark(e, doc.id)}
                                                    className={`transition-colors p-2 rounded-full ${savedIds.has(doc.id) ? 'text-blue-400' : 'bg-transparent text-gray-500 hover:text-white'}`}
                                                    title={savedIds.has(doc.id) ? 'Unsave paper' : 'Save paper'}
                                                >
                                                    <Bookmark className={`w-4 md:w-5 h-4 md:h-5 ${savedIds.has(doc.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <div className="w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                    <ChevronRight className="w-4 md:w-5 h-4 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
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
                            src={`/pdfjs/minimal.html?file=${encodeURIComponent(viewUrl)}`}
                            title={`${viewingPaper.subject} - Mobile`}
                            className="relative w-full h-full border-none md:hidden z-10"
                        />
                        <iframe
                            src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            title={viewingPaper.subject}
                            className="relative w-full h-full border-none hidden md:block z-10"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
