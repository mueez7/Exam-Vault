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

            {/* Hero Section */}
            <section className="w-full h-screen flex flex-col items-center justify-center text-center px-6 relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full opacity-30 pointer-events-none mx-auto max-w-4xl max-h-4xl" />

                <div className="flex flex-col items-center justify-center mt-auto">
                    <h2 className="hero-elem text-blue-500 text-[10px] md:text-xs uppercase tracking-[0.8em] mb-8 font-bold opacity-0 translate-y-10">
                        The Saved Vault
                    </h2>
                    <h1 className="hero-elem text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 opacity-0 translate-y-10">
                        Your <span className="italic font-light text-gray-500">Saved.</span>
                    </h1>
                    <p className="hero-elem text-gray-400 max-w-xl mx-auto text-sm md:text-base tracking-widest leading-relaxed opacity-0 translate-y-10">
                        ALL YOUR BOOKMARKED ACADEMIC PAPERS, RETRIEVED INSTANTLY.
                    </p>
                </div>

                <button
                    onClick={handleScroll}
                    className="hero-elem opacity-0 translate-y-10 bg-transparent text-gray-500 hover:text-white px-10 py-5 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] transition-colors flex items-center gap-3 mt-auto mb-32 group"
                >
                    Scroll to Initialize <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
            </section>

            {/* Saved Papers Grid */}
            <section id="vault-explorer" className="w-full bg-[#050505] min-h-screen border-t border-white/5 pt-20">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                            {Array.from({ length: 4 }).map((_, i) => (
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

                    {!loading && papers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                            <Bookmark className="w-12 h-12 text-gray-700" />
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                No saved papers yet. Bookmark papers from the Archive.
                            </p>
                        </div>
                    )}

                    {!loading && papers.length > 0 && (
                        <div id="vault-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                            {papers.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => handleViewPaper(doc)}
                                    className="group flex flex-col bg-[#050505] border border-white/5 rounded-xl paper-card transition-all duration-300 ease-out cursor-pointer relative hover:bg-[#0a0a0a]"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full aspect-[3/4] bg-[#0a0a0a] relative p-4 flex items-center justify-center border border-transparent border-b-white/5 overflow-hidden rounded-t-xl group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out z-10">
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
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                                    disabled={downloading === doc.id}
                                                    title="Download PDF"
                                                    className="text-gray-600 hover:text-blue-400 transition-colors disabled:opacity-40 p-1"
                                                >
                                                    {downloading === doc.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Download className="w-4 h-4" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={(e) => handleUnsave(e, doc.id)}
                                                    className="text-blue-400 hover:text-red-400 transition-colors p-1"
                                                    title="Remove from saved"
                                                >
                                                    <Bookmark className="w-4 h-4 fill-current" />
                                                </button>
                                            </div>
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
            )}
        </div>
    );
}
