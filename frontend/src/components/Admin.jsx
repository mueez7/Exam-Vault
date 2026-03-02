import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Database, Settings, Search, Plus, FileText, BarChart2, Loader2, Trash2, Eye, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAllPapers, deletePaper, getSecureViewUrl, getSecureDownloadUrl, fetchPaperFilePath, fetchFilterOptions, fetchVaultMetrics } from '../lib/supabase-backend';

// ── Data Core Filter Config ──────────────────────────────────────────────────
const ADMIN_FILTERS = [
    { id: 'college', label: 'College', dbCol: 'college' },
    { id: 'degree', label: 'Degree', dbCol: 'degree' },
    { id: 'branch', label: 'Branch', dbCol: 'branch' },
    { id: 'year', label: 'Year', dbCol: 'year' },
    { id: 'examtype', label: 'Exam Type', dbCol: 'exam_type' },
];

export default function Admin() {
    const { session } = useAuth();

    // ── UI State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('upload');

    // ── Upload Form State ─────────────────────────────────────────────────────
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '', college: '', degree: '', branch: '',
        year: '', sem: '', subject: '', examtype: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    // ── Data Core State ───────────────────────────────────────────────────────
    const [papers, setPapers] = useState([]);
    const [loadingPapers, setLoadingPapers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminFilters, setAdminFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // paper to confirm delete
    const [viewingPaper, setViewingPaper] = useState(null);
    const [viewUrl, setViewUrl] = useState(null);
    const [adminDownloading, setAdminDownloading] = useState(null);

    // ── Insights State ────────────────────────────────────────────────────────
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Lock scroll when modal open
    useEffect(() => {
        if (viewingPaper) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [viewingPaper]);

    // Load papers + filter options when Data Core tab opens
    useEffect(() => {
        if (activeTab === 'manage') {
            setLoadingPapers(true);
            fetchAllPapers('').then(data => { setPapers(data); setLoadingPapers(false); });
            fetchFilterOptions().then(setFilterOptions);
        }
        if (activeTab === 'insights' && !metrics) {
            setLoadingMetrics(true);
            fetchVaultMetrics().then(m => { setMetrics(m); setLoadingMetrics(false); });
        }
    }, [activeTab]);

    // ── Upload Handlers ───────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            if (f.type !== 'application/pdf') { setUploadStatus({ type: 'error', message: 'Only PDF files are allowed.' }); return; }
            if (f.size > 50 * 1024 * 1024) { setUploadStatus({ type: 'error', message: 'File is larger than 50MB limit.' }); return; }
            setFile(f);
            setUploadStatus(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!session?.access_token) { setUploadStatus({ type: 'error', message: 'Authentication session expired.' }); return; }
        if (!file) { setUploadStatus({ type: 'error', message: 'Please select a PDF file first.' }); return; }
        for (const [key, value] of Object.entries(formData)) {
            if (!value) { setUploadStatus({ type: 'error', message: `Please fill out the ${key} field.` }); return; }
        }
        setUploading(true); setUploadStatus(null);
        const data = new FormData();
        data.append('file', file);
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/admin/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: data
            });
            const result = await res.json();
            if (res.ok) {
                setUploadStatus({ type: 'success', message: 'Document injected successfully to Vault.' });
                setFile(null);
                setFormData({ title: '', college: '', degree: '', branch: '', year: '', sem: '', subject: '', examtype: '' });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setUploadStatus({ type: 'error', message: result.error || 'Failed to upload.' });
            }
        } catch {
            setUploadStatus({ type: 'error', message: 'Network error occurred during upload.' });
        } finally {
            setUploading(false);
        }
    };

    // ── Data Core Handlers ────────────────────────────────────────────────────
    const handleSearch = useCallback(async (q) => {
        setSearchQuery(q);
        setLoadingPapers(true);
        const data = await fetchAllPapers(q);
        setPapers(data);
        setLoadingPapers(false);
    }, []);

    const filteredPapers = papers.filter(p => {
        for (const [key, val] of Object.entries(adminFilters)) {
            if (!val) continue;
            const colMap = { college: 'college', degree: 'degree', branch: 'branch', year: 'year', examtype: 'exam_type' };
            const dbKey = colMap[key];
            if (dbKey && String(p[dbKey]) !== String(val)) return false;
        }
        return true;
    });

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        setDeletingId(confirmDelete.id);
        setConfirmDelete(null);
        const ok = await deletePaper(confirmDelete.id, confirmDelete.file_path ?? null);
        if (ok) setPapers(prev => prev.filter(p => p.id !== confirmDelete.id));
        setDeletingId(null);
    };

    const handleViewPaper = async (paper) => {
        setViewingPaper(paper);
        let filePath = paper.file_path;
        if (!filePath) filePath = await fetchPaperFilePath(paper.id);
        if (!filePath) { alert('Document path not found.'); setViewingPaper(null); return; }
        const url = await getSecureViewUrl(filePath);
        if (url) setViewUrl(url);
        else { alert('Could not generate view link.'); setViewingPaper(null); }
    };

    const handleAdminDownload = async (paper) => {
        try {
            setAdminDownloading(paper.id);
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
            document.body.appendChild(anchor); anchor.click(); anchor.remove();
            URL.revokeObjectURL(blobUrl);
        } catch { alert('Download error occurred.'); }
        finally { setAdminDownloading(null); }
    };

    const closeViewer = () => { setViewingPaper(null); setViewUrl(null); };

    return (
        <div className="flex flex-col w-full bg-[#050505] min-h-screen relative pt-12 text-white">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row gap-12 pb-32">

                {/* Admin Sidebar */}
                <aside className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0 md:pr-8">
                    <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-500 mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        Admin Protocol
                    </h2>
                    <nav className="flex flex-col gap-2">
                        {[
                            { id: 'upload', icon: UploadCloud, label: 'Upload Node' },
                            { id: 'manage', icon: Database, label: 'Data Core' },
                            { id: 'insights', icon: BarChart2, label: 'Insights' },
                            { id: 'settings', icon: Settings, label: 'Config' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0">

                    {/* ── UPLOAD TAB ─────────────────────────────────────────────────────── */}
                    {activeTab === 'upload' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Ingress Data.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Upload a new academic document into the high-velocity retrieval engine.</p>
                            </div>
                            <form onSubmit={handleUpload} className="flex flex-col gap-8 max-w-3xl">
                                {uploadStatus && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest border ${uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                        {uploadStatus.message}
                                    </div>
                                )}
                                <div
                                    className={`w-full h-48 rounded-2xl border-2 border-dashed ${file ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/50 bg-white/[0.02]'} flex flex-col items-center justify-center gap-4 group cursor-pointer transition-colors relative overflow-hidden`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} />
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {file ? (
                                        <>
                                            <FileText className="w-10 h-10 text-blue-500 relative z-10" />
                                            <div className="text-center relative z-10 px-4">
                                                <p className="text-sm font-bold text-white truncate max-w-xs">{file.name}</p>
                                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Inject</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-10 h-10 text-gray-600 group-hover:text-blue-500 transition-colors relative z-10" />
                                            <div className="text-center relative z-10">
                                                <p className="text-sm font-bold text-gray-300">CLICK TO BROWSE PDF</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Accepts PDF Only (Max 50MB)</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Document Title</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Quantum Physics Mid-Term 2024" className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                                    </div>
                                    {[
                                        { id: 'college', label: 'College', placeholder: 'e.g. GM University' },
                                        { id: 'degree', label: 'Degree', placeholder: 'e.g. B.Tech' },
                                        { id: 'branch', label: 'Branch', placeholder: 'e.g. CSE' },
                                        { id: 'year', label: 'Year', placeholder: 'e.g. 2024' },
                                        { id: 'sem', label: 'Semester', placeholder: 'e.g. 3' },
                                        { id: 'subject', label: 'Subject', placeholder: 'e.g. Engineering Chemistry' },
                                        { id: 'examtype', label: 'Exam Type', placeholder: 'e.g. Mid-Term' },
                                    ].map(f => (
                                        <div key={f.id} className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{f.label}</label>
                                            <input type="text" name={f.id} value={formData[f.id]} onChange={handleInputChange} placeholder={f.placeholder}
                                                className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" disabled={uploading} className="mt-4 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-colors self-start shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 disabled:opacity-50">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {uploading ? 'Processing Ingress...' : 'Inject to Vault'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── DATA CORE TAB ───────────────────────────────────────────────────── */}
                    {activeTab === 'manage' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Data Core.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">View, filter, and terminate existing data records.</p>
                            </div>

                            {/* Search + Filters */}
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Search by subject..."
                                        className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ADMIN_FILTERS.map(f => (
                                        <select
                                            key={f.id}
                                            value={adminFilters[f.id] ?? ''}
                                            onChange={e => setAdminFilters(prev => ({ ...prev, [f.id]: e.target.value }))}
                                            className="bg-[#0a0a0a] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-3 py-2 text-[10px] text-gray-400 focus:text-white uppercase tracking-widest font-bold focus:outline-none transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="">{f.label}</option>
                                            {(filterOptions[f.dbCol] || []).map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ))}
                                    {Object.values(adminFilters).some(Boolean) && (
                                        <button onClick={() => setAdminFilters({})} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest px-3 py-2 transition-colors">
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats Bar */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    {loadingPapers ? 'Loading...' : `${filteredPapers.length} records`}
                                </span>
                            </div>

                            {/* Table */}
                            <div className="border border-white/5 rounded-2xl bg-[#080808] overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 bg-[#050505]">
                                    {['Subject', 'College', 'Degree / Branch', 'Year / Sem', 'Exam Type', 'Actions'].map(h => (
                                        <span key={h} className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{h}</span>
                                    ))}
                                </div>

                                {loadingPapers && (
                                    <div className="flex items-center justify-center py-16 gap-3 text-gray-600 text-xs uppercase tracking-widest font-bold">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading records...
                                    </div>
                                )}

                                {!loadingPapers && filteredPapers.length === 0 && (
                                    <div className="py-16 text-center text-xs text-gray-600 font-bold uppercase tracking-widest">
                                        No records found
                                    </div>
                                )}

                                {!loadingPapers && filteredPapers.map((paper, i) => (
                                    <div
                                        key={paper.id}
                                        className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                            <span className="text-xs font-bold text-white truncate">{paper.subject}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.college}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.degree} / {paper.branch}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.year} / S{paper.semester}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.exam_type}</span>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                                onClick={() => handleViewPaper(paper)}
                                                title="View PDF"
                                                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleAdminDownload(paper)}
                                                disabled={adminDownloading === paper.id}
                                                title="Download PDF"
                                                className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-40"
                                            >
                                                {adminDownloading === paper.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Download className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(paper)}
                                                disabled={deletingId === paper.id}
                                                title="Delete paper"
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
                                            >
                                                {deletingId === paper.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── INSIGHTS TAB ────────────────────────────────────────────────────── */}
                    {activeTab === 'insights' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Metrics.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Live usage statistics pulled directly from the database.</p>
                            </div>

                            {loadingMetrics && (
                                <div className="flex items-center gap-3 text-gray-500 text-xs uppercase tracking-widest font-bold">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading metrics...
                                </div>
                            )}

                            {!loadingMetrics && metrics && (() => {
                                const maxViews = Math.max(...metrics.topPapers.map(p => p.view_count), 1);
                                const makeBar = (items, color) => {
                                    const max = Math.max(...items.map(i => i.count), 1);
                                    return items.slice(0, 6).map(item => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider w-28 shrink-0 truncate">{item.label}</span>
                                            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${color} transition-all duration-700`}
                                                    style={{ width: `${(item.count / max) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-bold w-6 text-right shrink-0">{item.count}</span>
                                        </div>
                                    ));
                                };

                                return (
                                    <>
                                        {/* KPI Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Total Papers', value: metrics.totalPapers, color: 'text-blue-400' },
                                                { label: 'Total Views', value: metrics.totalViews.toLocaleString(), color: 'text-green-400' },
                                                { label: 'Colleges', value: metrics.byCollege.length, color: 'text-purple-400' },
                                                { label: 'Avg Views / Paper', value: metrics.totalPapers ? Math.round(metrics.totalViews / metrics.totalPapers) : 0, color: 'text-yellow-400' },
                                            ].map(kpi => (
                                                <div key={kpi.label} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                                                    <span className="text-[9px] uppercase font-black tracking-[0.25em] text-gray-600">{kpi.label}</span>
                                                    <span className={`text-3xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Most Viewed Papers */}
                                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                                            <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-500 mb-5">Most Viewed Papers</h3>
                                            <div className="flex flex-col gap-3">
                                                {metrics.topPapers.length === 0 && (
                                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No data yet</p>
                                                )}
                                                {metrics.topPapers.map((p, i) => (
                                                    <div key={p.id} className="flex items-center gap-4">
                                                        <span className={`text-[10px] font-black w-5 shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-700'}`}>
                                                            #{i + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-white truncate">{p.subject}</p>
                                                            <p className="text-[10px] text-gray-600">{p.college} • {p.degree} • {p.exam_type}</p>
                                                        </div>
                                                        <div className="w-32 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500/60 rounded-full transition-all duration-700"
                                                                style={{ width: `${(p.view_count / maxViews) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-blue-400 font-black w-10 text-right">{p.view_count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Breakdown Grids */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { title: 'Papers by Degree', items: metrics.byDegree, color: 'bg-blue-500/60' },
                                                { title: 'Papers by Exam Type', items: metrics.byExamType, color: 'bg-purple-500/60' },
                                                { title: 'Papers by College', items: metrics.byCollege, color: 'bg-green-500/60' },
                                                { title: 'Papers by Branch', items: metrics.byBranch, color: 'bg-yellow-500/60' },
                                            ].map(section => (
                                                <div key={section.title} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
                                                    <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-500 mb-4">{section.title}</h3>
                                                    <div className="flex flex-col gap-3">
                                                        {section.items.length === 0
                                                            ? <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No data</p>
                                                            : makeBar(section.items, section.color)
                                                        }
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Refresh Button */}
                                        <button
                                            onClick={() => { setMetrics(null); setLoadingMetrics(true); fetchVaultMetrics().then(m => { setMetrics(m); setLoadingMetrics(false); }); }}
                                            className="self-start text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest border border-white/5 hover:border-white/20 rounded-lg px-4 py-2 transition-colors"
                                        >
                                            Refresh Metrics
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── CONFIG TAB ──────────────────────────────────────────────────────── */}
                    {activeTab === 'settings' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 text-center text-sm border border-white/5 rounded-2xl font-bold tracking-widest bg-white/[0.02] text-gray-500 uppercase">Settings Managed via Core Protocol</div>
                        </div>
                    )}

                </main>
            </div>

            {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
            {confirmDelete && createPortal(
                <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-black text-white mb-2">Delete Paper?</h3>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="text-white font-bold">{confirmDelete.subject}</span>
                        </p>
                        <p className="text-xs text-gray-600 mb-6">This will permanently delete the record and its PDF from storage. This cannot be undone.</p>
                        <div className="flex items-center gap-3 justify-end">
                            <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── PDF Viewer Modal ─────────────────────────────────────────────────── */}
            {viewingPaper && viewUrl && createPortal(
                <div className="fixed inset-0 flex flex-col" style={{ zIndex: 99999 }} role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeViewer} />
                    <div className="relative flex flex-col w-full h-full max-w-6xl mx-auto my-6 pointer-events-none">
                        <div className="pointer-events-auto flex flex-col w-full h-full bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070707]">
                                <div className="flex flex-col min-w-0 mr-4">
                                    <h3 className="text-white font-bold text-sm leading-tight truncate">{viewingPaper.subject}</h3>
                                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
                                        {viewingPaper.degree} • {viewingPaper.branch} • {viewingPaper.year}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
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
