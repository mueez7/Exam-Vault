import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Database, Settings, Search, Plus, FileText, BarChart2, Loader2, Trash2, Eye, Download, X, CheckCircle, ChevronDown, Sparkles, Users, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAllPapers, deletePaper, getSecureViewUrl, getSecureDownloadUrl, fetchPaperFilePath, fetchFilterOptions, fetchVaultMetrics, fetchRawFilterData } from '../lib/supabase-backend';

// ── Fixed exam type options — NEVER free-text ────────────────────────────────
const EXAM_TYPES = ['IA 1', 'IA 2', 'IA 3', 'Sem End'];

// ── Data Core Filter Config ──────────────────────────────────────────────────
const ADMIN_FILTERS = [
    { id: 'college', label: 'College', dbCol: 'college' },
    { id: 'degree', label: 'Degree', dbCol: 'degree' },
    { id: 'branch', label: 'Branch', dbCol: 'branch' },
    { id: 'year', label: 'Year', dbCol: 'year' },
    { id: 'examtype', label: 'Exam Type', dbCol: 'exam_type' },
];

// ── Smart Select component for cascading upload form ─────────────────────────
function SmartSelect({ label, value, options, onChange, disabled, placeholder, allowCustom = true }) {
    const [custom, setCustom] = useState(false);
    const [customVal, setCustomVal] = useState('');

    const handleSelect = (e) => {
        if (e.target.value === '__new__') {
            setCustom(true);
            onChange('');
        } else {
            setCustom(false);
            onChange(e.target.value);
        }
    };

    const handleCustomChange = (e) => {
        setCustomVal(e.target.value);
        onChange(e.target.value);
    };

    // Reset custom mode if options are empty and not yet custom
    useEffect(() => {
        if (!custom && value && !options.includes(value)) {
            // Value came from parent but isn't in options — could be typed value
        }
    }, [options]);

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{label}</label>
            {custom ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customVal}
                        onChange={handleCustomChange}
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        autoFocus
                        className="flex-1 bg-[#111] border border-blue-500/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={() => { setCustom(false); setCustomVal(''); onChange(''); }}
                        className="px-3 py-2 text-gray-500 hover:text-white border border-white/5 rounded-lg text-xs transition-colors"
                        title="Back to list"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <select
                        value={value || ''}
                        onChange={handleSelect}
                        disabled={disabled}
                        className="appearance-none w-full cursor-pointer bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 pr-9 text-sm text-white focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ WebkitAppearance: 'none' }}
                    >
                        <option value="">{disabled ? 'Loading…' : placeholder || `Select ${label}`}</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {allowCustom && (
                            <option value="__new__">＋ Add New {label}</option>
                        )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            )}
        </div>
    );
}

export default function Admin() {
    const { session } = useAuth();

    // ── UI State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('upload');

    // ── Upload Form State ─────────────────────────────────────────────────────
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        college: '', degree: '', branch: '', year: '', sem: '', subject: '', examtype: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    // ── Subject Registry for smart dropdowns ─────────────────────────────────
    const [registry, setRegistry] = useState([]);
    const [loadingRegistry, setLoadingRegistry] = useState(false);

    // ── Data Core State ───────────────────────────────────────────────────────
    const [papers, setPapers] = useState([]);
    const [loadingPapers, setLoadingPapers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminFilters, setAdminFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [viewingPaper, setViewingPaper] = useState(null);
    const [viewUrl, setViewUrl] = useState(null);
    const [adminDownloading, setAdminDownloading] = useState(null);

    // ── Insights State ────────────────────────────────────────────────────────
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // ── Users & Traffic State ────────────────────────────────────────────────
    const [sysUsers, setSysUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [trafficLogs, setTrafficLogs] = useState(null);

    // ── Normalize State ───────────────────────────────────────────────────────
    const [normalizing, setNormalizing] = useState(false);
    const [normalizeResult, setNormalizeResult] = useState(null);

    // Lock scroll when modal open
    useEffect(() => {
        if (viewingPaper) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [viewingPaper]);

    // Load data per tab
    useEffect(() => {
        if (activeTab === 'upload' && registry.length === 0) {
            setLoadingRegistry(true);
            fetchRawFilterData().then(data => { setRegistry(data); setLoadingRegistry(false); });
        }
        if (activeTab === 'manage') {
            setLoadingPapers(true);
            fetchAllPapers('').then(data => { setPapers(data); setLoadingPapers(false); });
            fetchFilterOptions().then(setFilterOptions);
        }
        if ((activeTab === 'insights' || activeTab === 'traffic') && !metrics) {
            setLoadingMetrics(true);
            fetchVaultMetrics().then(m => { setMetrics(m); setLoadingMetrics(false); });
        }
        if ((activeTab === 'insights' || activeTab === 'traffic') && !trafficLogs) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            fetch(`${backendUrl}/api/admin/traffic`, { headers: { 'Authorization': `Bearer ${session?.access_token}` }})
                .then(res => res.json())
                .then(resData => setTrafficLogs(resData))
                .catch(e => setTrafficLogs({ error: true }));
        }
        if (activeTab === 'users' && sysUsers.length === 0) {
            setLoadingUsers(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            fetch(`${backendUrl}/api/admin/users`, { headers: { 'Authorization': `Bearer ${session?.access_token}` }})
                .then(res => res.json())
                .then(data => { setSysUsers(data.users || []); setLoadingUsers(false); })
                .catch(() => setLoadingUsers(false));
        }
    }, [activeTab]);

    // ── Cascading dropdown options for upload form ────────────────────────────
    const uploadOptions = useMemo(() => {
        const f = formData;
        const filter = (rows, ...checks) => rows.filter(r =>
            checks.every(([key, val]) => !val || String(r[key]).trim() === String(val).trim())
        );
        const unique = (rows, key) => [...new Set(rows.map(r => String(r[key]).trim()).filter(Boolean))].sort();

        const colleges = unique(registry, 'college');
        const degrees  = unique(filter(registry, ['college', f.college]), 'degree');
        const branches = unique(filter(registry, ['college', f.college], ['degree', f.degree]), 'branch');
        const years    = unique(filter(registry, ['college', f.college], ['degree', f.degree], ['branch', f.branch]), 'year');
        const sems     = unique(filter(registry, ['college', f.college], ['degree', f.degree], ['branch', f.branch], ['year', f.year]), 'semester');
        const subjects = unique(filter(registry, ['college', f.college], ['degree', f.degree], ['branch', f.branch], ['year', f.year], ['semester', f.sem]), 'subject');

        return { colleges, degrees, branches, years, sems, subjects };
    }, [registry, formData]);

    const setField = (field) => (value) => {
        // When a parent field changes, clear all child fields downstream
        const order = ['college', 'degree', 'branch', 'year', 'sem', 'subject', 'examtype'];
        const idx = order.indexOf(field);
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            order.slice(idx + 1).forEach(f => { next[f] = ''; });
            return next;
        });
    };

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

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!session?.access_token) { setUploadStatus({ type: 'error', message: 'Authentication session expired.' }); return; }
        if (!file) { setUploadStatus({ type: 'error', message: 'Please select a PDF file first.' }); return; }
        const required = ['college', 'degree', 'branch', 'year', 'sem', 'subject', 'examtype'];
        for (const key of required) {
            if (!formData[key]) { setUploadStatus({ type: 'error', message: `Please fill out the ${key} field.` }); return; }
        }
        setUploading(true); setUploadStatus(null);
        const data = new FormData();
        data.append('file', file);
        data.append('title', formData.subject);
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/admin/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: data
            });
            const result = await res.json();
            if (res.ok) {
                setUploadStatus({ type: 'success', message: `"${formData.subject} — ${formData.examtype}" injected successfully.` });
                setFile(null);
                setFormData({ college: formData.college, degree: formData.degree, branch: formData.branch, year: formData.year, sem: formData.sem, subject: '', examtype: '' });
                if (fileInputRef.current) fileInputRef.current.value = '';
                // Bust the filter cache so new paper shows up immediately
                sessionStorage.removeItem('vault_raw_filters');
                // Refresh registry
                fetchRawFilterData().then(setRegistry);
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
            if (dbKey && String(p[dbKey]).trim() !== String(val).trim()) return false;
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

    // ── Normalize Handler ─────────────────────────────────────────────────────
    const handleNormalize = async () => {
        setNormalizing(true);
        setNormalizeResult(null);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/admin/normalize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setNormalizeResult({ type: 'success', message: `Scanned ${result.checked} records — fixed ${result.fixed} with trailing spaces.` });
                sessionStorage.removeItem('vault_raw_filters');
            } else {
                setNormalizeResult({ type: 'error', message: result.error || 'Normalization failed.' });
            }
        } catch {
            setNormalizeResult({ type: 'error', message: 'Network error during normalization.' });
        } finally {
            setNormalizing(false);
        }
    };

    return (
        <div className="flex flex-col w-full bg-[#050505] min-h-screen relative pt-24 md:pt-32 pb-24 text-white">
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
                            { id: 'users', icon: Users, label: 'User Registry' },
                            { id: 'manage', icon: Database, label: 'Data Core' },
                            { id: 'insights', icon: BarChart2, label: 'Insights' },
                            { id: 'traffic', icon: Activity, label: 'Traffic & Metrics' },
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
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Upload a new academic document. Select from existing values to ensure consistency.</p>
                            </div>

                            <form onSubmit={handleUpload} className="flex flex-col gap-8 max-w-3xl">
                                {uploadStatus && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest border ${uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                        {uploadStatus.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                                        {uploadStatus.message}
                                    </div>
                                )}

                                {/* ── Step 1: Scope ── */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-4 h-px bg-blue-500/50" />Step 1 — Institution Scope
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <SmartSelect
                                            label="College"
                                            value={formData.college}
                                            options={uploadOptions.colleges}
                                            onChange={setField('college')}
                                            disabled={loadingRegistry}
                                        />
                                        <SmartSelect
                                            label="Degree"
                                            value={formData.degree}
                                            options={uploadOptions.degrees}
                                            onChange={setField('degree')}
                                            disabled={loadingRegistry || !formData.college}
                                        />
                                        <SmartSelect
                                            label="Branch"
                                            value={formData.branch}
                                            options={uploadOptions.branches}
                                            onChange={setField('branch')}
                                            disabled={loadingRegistry || !formData.degree}
                                        />
                                    </div>
                                </div>

                                {/* ── Step 2: Semester ── */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-4 h-px bg-blue-500/50" />Step 2 — Academic Period
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SmartSelect
                                            label="Year"
                                            value={formData.year}
                                            options={uploadOptions.years}
                                            onChange={setField('year')}
                                            disabled={loadingRegistry || !formData.branch}
                                            placeholder="Select Year"
                                        />
                                        <SmartSelect
                                            label="Semester"
                                            value={formData.sem}
                                            options={uploadOptions.sems.length ? uploadOptions.sems : ['1','2','3','4','5','6','7','8']}
                                            onChange={setField('sem')}
                                            disabled={!formData.year}
                                            allowCustom={false}
                                            placeholder="Select Semester"
                                        />
                                    </div>
                                </div>

                                {/* ── Step 3: Subject & Exam Type ── */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-4 h-px bg-blue-500/50" />Step 3 — Subject & Exam
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SmartSelect
                                            label="Subject"
                                            value={formData.subject}
                                            options={uploadOptions.subjects}
                                            onChange={setField('subject')}
                                            disabled={!formData.sem}
                                        />
                                        {/* Exam Type — fixed hardcoded list, no free text */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Exam Type</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.examtype}
                                                    onChange={e => setField('examtype')(e.target.value)}
                                                    disabled={!formData.subject}
                                                    className="appearance-none w-full cursor-pointer bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 pr-9 text-sm text-white focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    style={{ WebkitAppearance: 'none' }}
                                                >
                                                    <option value="">Select Exam Type</option>
                                                    {EXAM_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Step 4: File Upload ── */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-4 h-px bg-blue-500/50" />Step 4 — PDF File
                                    </p>
                                    <div
                                        className={`w-full h-40 rounded-2xl border-2 border-dashed ${file ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/50 bg-white/[0.02]'} flex flex-col items-center justify-center gap-3 group cursor-pointer transition-colors relative overflow-hidden`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} />
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {file ? (
                                            <>
                                                <FileText className="w-8 h-8 text-blue-500 relative z-10" />
                                                <div className="text-center relative z-10 px-4">
                                                    <p className="text-sm font-bold text-white truncate max-w-xs">{file.name}</p>
                                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Inject</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8 text-gray-600 group-hover:text-blue-500 transition-colors relative z-10" />
                                                <div className="text-center relative z-10">
                                                    <p className="text-sm font-bold text-gray-300">CLICK TO BROWSE PDF</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Accepts PDF Only (Max 50MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Summary preview */}
                                {formData.subject && formData.examtype && (
                                    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2">Upload Preview</p>
                                        <p className="text-sm font-bold text-white">{formData.subject} <span className="text-blue-400">— {formData.examtype}</span></p>
                                        <p className="text-[10px] text-gray-500">{formData.college} · {formData.degree} · {formData.branch} · Year {formData.year} · Sem {formData.sem}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={uploading || !file || !formData.examtype}
                                    className="mt-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-colors self-start shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
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
                                            <span className="text-sm md:text-base font-bold text-white truncate">{paper.subject}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.college}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.degree} / {paper.branch}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.year} / S{paper.semester}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{paper.exam_type}</span>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button onClick={() => handleViewPaper(paper)} title="View PDF" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleAdminDownload(paper)} disabled={adminDownloading === paper.id} title="Download PDF" className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-40">
                                                {adminDownloading === paper.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={() => setConfirmDelete(paper)} disabled={deletingId === paper.id} title="Delete paper" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40">
                                                {deletingId === paper.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                                                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${(item.count / max) * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-bold w-6 text-right shrink-0">{item.count}</span>
                                        </div>
                                    ));
                                };

                                return (
                                    <>
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

                                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                                            <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-500 mb-5">Most Viewed Papers</h3>
                                            <div className="flex flex-col gap-3">
                                                {metrics.topPapers.length === 0 && <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No data yet</p>}
                                                {metrics.topPapers.map((p, i) => (
                                                    <div key={p.id} className="flex items-center gap-4">
                                                        <span className={`text-[10px] font-black w-5 shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-700'}`}>#{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-white truncate">{p.subject}</p>
                                                            <p className="text-[10px] text-gray-600">{p.college} • {p.degree} • {p.exam_type}</p>
                                                        </div>
                                                        <div className="w-32 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                            <div className="h-full bg-blue-500/60 rounded-full transition-all duration-700" style={{ width: `${(p.view_count / maxViews) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-blue-400 font-black w-10 text-right">{p.view_count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

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

                    {/* ── USERS TAB ──────────────────────────────────────────────────────── */}
                    {activeTab === 'users' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">User Registry.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Monitor registered users and system access.</p>
                            </div>
                            
                            <div className="border border-white/5 rounded-2xl bg-[#080808] overflow-hidden">
                                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-white/5 bg-[#050505]">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">ID</span>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Name</span>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Email</span>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Joined</span>
                                </div>
                                {loadingUsers && <div className="p-8 text-center text-sm text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Loading...</div>}
                                {!loadingUsers && sysUsers.map((u, i) => (
                                    <div key={u.id} className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                        <span className="text-sm text-gray-500 font-medium font-mono">{u.id.substring(0,8)}</span>
                                        <span className="text-sm md:text-base font-bold text-white truncate">{u.displayName}</span>
                                        <span className="text-xs md:text-sm text-gray-400 truncate">{u.email}</span>
                                        <span className="text-xs md:text-sm text-gray-500 font-medium">{new Date(u.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── TRAFFIC TAB ──────────────────────────────────────────────────────── */}
                    {activeTab === 'traffic' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Traffic & Metrics.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Monitor website visits, downloads, and user engagement.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                                    <h3 className="text-xs uppercase font-black tracking-[0.25em] text-gray-500 mb-2">Total Downloads</h3>
                                    <span className="text-5xl font-black text-white">{metrics?.totalViews || 0}</span>
                                    <span className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">Across {metrics?.totalPapers || 0} Papers</span>
                                </div>
                                
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                                    <h3 className="text-xs uppercase font-black tracking-[0.25em] text-gray-500 mb-2">Total Website Hits</h3>
                                    <span className="text-5xl font-black text-white">{trafficLogs?.totals?.hits || 0}</span>
                                    <span className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">{trafficLogs?.totals?.uniqueVisitors || 0} Unique Visitors</span>
                                </div>
                            </div>
                            
                            {trafficLogs && trafficLogs.dailyVisits ? (
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 mb-4">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-500">Daily Website Traffic (Last 30 Days)</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Hits</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Unique</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1 h-32 overflow-hidden border-b border-white/5 pb-2">
                                        {trafficLogs.dailyVisits.length === 0 && <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold self-center mx-auto text-center">No traffic logged yet.</p>}
                                        {trafficLogs.dailyVisits.map((day, idx) => {
                                            const maxHits = Math.max(...trafficLogs.dailyVisits.map(d => d.hits), 1);
                                            const height = (day.hits / maxHits) * 100;
                                            return (
                                                <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-2 group relative">
                                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-2 py-1 rounded text-[9px] text-white font-bold whitespace-nowrap z-10 pointer-events-none">
                                                        {day.date} • {day.hits} hits / {day.visitors} uniq
                                                    </div>
                                                    <div className="w-full bg-blue-500/20 hover:bg-blue-500/80 rounded-t-sm transition-colors" style={{ height: `${height}%`, minHeight: '4px' }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#0a0a0a] border border-amber-500/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                                    <Activity className="w-8 h-8 text-amber-500 mb-4" />
                                    <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Tracking Not Active</p>
                                    <p className="text-[10px] text-gray-400 max-w-sm">Traffic data could not be loaded. Please ensure you have run the <span className="text-blue-500">create_site_traffic.sql</span> migration in your Supabase dashboard.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── CONFIG TAB ──────────────────────────────────────────────────────── */}
                    {activeTab === 'settings' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Config.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Maintenance tools for the vault database.</p>
                            </div>

                            {/* Normalize Tool */}
                            <div className="flex flex-col gap-4 p-6 border border-white/5 rounded-2xl bg-[#080808]">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-white mb-1">Normalize Database</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Scans all records and strips trailing/leading spaces from subject names, exam types, college, degree, and branch fields.
                                            Run this once to fix any inconsistencies from old uploads. New uploads are automatically trimmed.
                                        </p>
                                    </div>
                                </div>

                                {normalizeResult && (
                                    <div className={`p-3 rounded-xl text-xs font-bold uppercase tracking-widest border ${normalizeResult.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                        {normalizeResult.message}
                                    </div>
                                )}

                                <button
                                    onClick={handleNormalize}
                                    disabled={normalizing}
                                    className="self-start flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {normalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {normalizing ? 'Normalizing...' : 'Run Normalization'}
                                </button>
                            </div>
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
                        <p className="text-sm text-gray-400 mb-1"><span className="text-white font-bold">{confirmDelete.subject}</span></p>
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
                                <button onClick={closeViewer} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
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
