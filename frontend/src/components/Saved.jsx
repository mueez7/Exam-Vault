import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { FileText, ArrowDown, Bookmark, Loader2, Download, X } from 'lucide-react';
import { fetchSavedPapers, toggleSavedPaper, fetchPaperFilePath, getSecureDownloadUrl, getSecureViewUrl, incrementViewCount } from '../lib/supabase-backend';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Saved() {
    const container = useRef(null);
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [viewingPaper, setViewingPaper] = useState(null);
    const [viewUrl, setViewUrl] = useState(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (viewingPaper) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [viewingPaper]);

    useEffect(() => {
        fetchSavedPapers().then(data => {
            setPapers(data);
            setLoading(false);
        });
    }, []);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 2 } });
            tl.to('.hero-elem', { opacity: 1, y: 0, stagger: 0.15, delay: 0.2 });
        }, container);
        return () => ctx.revert();
    }, []);

    const handleScroll = () => {
        const target = document.getElementById('vault-explorer');
        if (target) window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    };

    const handleDownload = async (paper) => {
        try {
            setDownloading(paper.id);
            let filePath = paper.file_path;
            if (!filePath) filePath = await fetchPaperFilePath(paper.id);
            if (!filePath) { alert('File path not found.'); return; }

            const url = await getSecureDownloadUrl(filePath);
            if (!url) { alert('Could not generate download link.'); return; }

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
            setViewingPaper(paper);
            incrementViewCount(paper.id);
            let filePath = paper.file_path;
            if (!filePath) filePath = await fetchPaperFilePath(paper.id);
            if (!filePath) { alert('Document path not found.'); setViewingPaper(null); return; }
            const url = await getSecureViewUrl(filePath);
            if (url) setViewUrl(url);
            else { alert('Could not generate view link.'); setViewingPaper(null); }
        } catch (err) {
            console.error('View error:', err);
            setViewingPaper(null);
        }
    };

    const closeViewer = () => { setViewingPaper(null); setViewUrl(null); };

    const handleUnsave = async (e, paperId) => {
        e.stopPropagation();
        await toggleSavedPaper(paperId); // toggles → removes since it's already saved
        setPapers(prev => prev.filter(p => p.id !== paperId));
    };

    return (
        <div ref={container} className="flex flex-col w-full bg-[#050505] relative">

            <section className="w-full bg-[#050505] pb-8 pt-28 md:pt-32">
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex flex-col relative">
                    <div className="absolute top-0 right-1/4 bg-blue-500/10 blur-[100px] w-64 h-64 rounded-full pointer-events-none"></div>
                    <h1 className="hero-elem text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 opacity-0 translate-y-4">
                        Saved Papers.
                    </h1>
                    <p className="hero-elem text-gray-500 text-sm md:text-base font-medium opacity-0 translate-y-4">
                        All your bookmarked documents instantly retrieved.
                    </p>
                </div>
            </section>

            {/* Saved Papers List */}
            <section id="vault-explorer" className="w-full bg-transparent min-h-[50vh]">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-32">
                    <div className="flex items-center justify-between px-2 pb-6 border-b border-white/5 mb-6">
                        <h3 className="text-[17px] md:text-xl font-black text-white px-2 tracking-tight">Saved Resources</h3>
                        {!loading && (
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                {papers.length} paper{papers.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {loading && (
                        <div className="flex flex-col w-full">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="relative border-b border-white/5 h-[76px] w-full overflow-hidden animate-pulse bg-white/[0.01]" />
                            ))}
                        </div>
                    )}

                    {!loading && papers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                            <Bookmark className="w-12 h-12 text-gray-700" />
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                No saved papers yet. Bookmark papers from the Archive.
                            </p>
                        </div>
                    )}

                    {!loading && papers.length > 0 && (
                        <div className="flex flex-col w-full mt-2">
                            {papers.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => handleViewPaper(doc)}
                                    className="group relative w-full border-b border-white/5 paper-card transition-colors duration-200 ease-out cursor-pointer hover:bg-white/[0.02]"
                                >
                                    <div className="flex flex-row items-center py-3.5 sm:py-4 gap-4 md:gap-6">
                                        {/* Icon */}
                                        <div className="w-8 md:w-10 h-8 md:h-10 shrink-0 flex items-center justify-center relative">
                                            {viewingPaper?.id === doc.id ? (
                                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            ) : (
                                                <FileText className="w-5 md:w-6 h-5 md:h-6 text-gray-600" />
                                            )}
                                        </div>
                                        
                                        {/* Content */}
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
                                                onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                                disabled={downloading === doc.id}
                                                className="text-gray-500 hover:text-white transition-colors disabled:opacity-40 p-2 rounded-full hover:bg-white/5"
                                                title="Download PDF"
                                            >
                                                {downloading === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 md:w-5 h-4 md:h-5" />}
                                            </button>
                                            <button
                                                onClick={(e) => handleUnsave(e, doc.id)}
                                                className="text-blue-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                                                title="Remove from saved"
                                            >
                                                <Bookmark className="w-4 md:w-5 h-4 md:h-5 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* PDF Viewer Modal (portaled) */}
            {viewingPaper && viewUrl && createPortal(
                <div className="fixed inset-0 flex flex-col" style={{ zIndex: 99999 }} role="dialog" aria-modal="true">
                    <style>{`
                        .saved-modal-inner ::-webkit-scrollbar { width: 5px; }
                        .saved-modal-inner ::-webkit-scrollbar-track { background: #111; }
                        .saved-modal-inner ::-webkit-scrollbar-thumb { background: #333; border-radius: 8px; }
                    `}</style>
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeViewer} />
                    <div className="saved-modal-inner relative flex flex-col w-full h-full max-w-6xl mx-auto my-6 pointer-events-none">
                        <div className="pointer-events-auto flex flex-col w-full h-full bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070707]">
                                <div className="flex flex-col min-w-0 mr-4">
                                    <h3 className="text-white font-bold text-sm leading-tight truncate">{viewingPaper.subject}</h3>
                                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
                                        {viewingPaper.degree} • {viewingPaper.branch} • {viewingPaper.year}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleDownload(viewingPaper)}
                                        disabled={downloading === viewingPaper.id}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                    >
                                        {downloading === viewingPaper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        Download
                                    </button>
                                    <button onClick={closeViewer} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 relative bg-[#111] min-h-0">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
                                </div>
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true`}
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
            )}
        </div>
    );
}
