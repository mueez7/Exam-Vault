import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { FileText, ChevronDown, ArrowDown, Search, Bookmark, Download, Loader2 } from 'lucide-react';
import { fetchFilteredPapers, getSecureDownloadUrl, incrementViewCount } from '../lib/supabase-backend';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FILTERS = [
    { id: 'college',  label: 'College',   options: ['Stanford', 'MIT', 'Harvard'] },
    { id: 'degree',   label: 'Degree',    options: ['B.Tech', 'M.Tech', 'Ph.D'] },
    { id: 'branch',   label: 'Branch',    options: ['CS', 'Mech', 'EE', 'Civil'] },
    { id: 'year',     label: 'Year',      options: ['2024', '2023', '2022', '2021'] },
    { id: 'sem',      label: 'Sem',       options: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    { id: 'subject',  label: 'Subject',   options: ['OS', 'Database', 'Networks', 'ML'] },
    { id: 'examtype', label: 'Exam Type', options: ['Main', 'Supp', 'Mid-Term'] },
];

const EMPTY_FILTERS = {
    college: '', degree: '', branch: '', year: '', sem: '', subject: '', examtype: '',
};

export default function Archive() {
    const container = useRef(null);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [papers, setPapers]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [downloading, setDownloading] = useState(null);

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
        setDownloading(paper.id);
        incrementViewCount(paper.id); // fire-and-forget
        const url = await getSecureDownloadUrl(paper.file_path);
        setDownloading(null);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('Could not generate download link. Please try again.');
        }
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
                        Retrieve the <span className="italic font-light text-gray-500">Past.</span>
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
                                            className="appearance-none w-full cursor-pointer bg-[#0a0a0a] hover:bg-[#111] px-4 py-4 pr-10 border-b border-white/5 hover:border-white/20 transition-all text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold text-gray-300 focus:outline-none focus:border-blue-500/50 [&>option]:bg-[#050505]"
                                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                                        >
                                            <option value="" className="bg-[#050505] text-gray-500">{f.label}</option>
                                            {f.options.map(opt => (
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
                                        className="group flex flex-col bg-[#050505] border border-white/5 rounded-xl paper-card transition-all duration-300 ease-out cursor-pointer relative"
                                    >
                                        {/* Thumbnail Area */}
                                        <div className="w-full aspect-[3/4] bg-[#0a0a0a] relative p-4 flex items-center justify-center border border-transparent border-b-white/5 overflow-hidden rounded-t-xl group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out z-10">
                                            <div className="absolute top-3 left-3 bg-[#1a1a1a] text-gray-300 border border-white/5 text-[8px] font-bold px-2 py-1 rounded shadow-md z-10 uppercase tracking-widest">
                                                PDF
                                            </div>
                                            <div className="w-[65%] h-[80%] bg-[#111] border border-white/5 rounded-lg flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-white/10" />
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="flex flex-col p-4 grow">
                                            <h4 className="text-[14px] font-bold text-white leading-tight mb-1.5 line-clamp-2 hover:text-blue-400 transition-colors">
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
                                                        onClick={() => handleDownload(doc)}
                                                        disabled={downloading === doc.id}
                                                        title="Download PDF (60-second signed link)"
                                                        className="text-gray-600 hover:text-blue-400 transition-colors disabled:opacity-40"
                                                    >
                                                        {downloading === doc.id
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : <Download className="w-4 h-4" />
                                                        }
                                                    </button>
                                                    <button className="text-gray-600 hover:text-white transition-colors">
                                                        <Bookmark className="w-4 h-4 fill-current" />
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
        </div>
    );
}
