import React, { useState, useRef } from 'react';
import { UploadCloud, Database, Settings, Search, Plus, FileText, BarChart2, Users, Download, Eye, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export default function Admin() {
    // Auth Context
    const { session } = useAuth();

    // Admin UI State
    const [activeTab, setActiveTab] = useState('upload');

    // Upload Form State
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        college: '',
        degree: '',
        branch: '',
        year: '',
        sem: '',
        subject: '',
        examtype: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: '' }

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                setUploadStatus({ type: 'error', message: 'Only PDF files are allowed.' });
                return;
            }
            if (selectedFile.size > 50 * 1024 * 1024) {
                setUploadStatus({ type: 'error', message: 'File is larger than 50MB limit.' });
                return;
            }
            setFile(selectedFile);
            setUploadStatus(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!session?.access_token) {
            setUploadStatus({ type: 'error', message: 'Authentication session expired. Please log in again.' });
            return;
        }

        if (!file) {
            setUploadStatus({ type: 'error', message: 'Please select a PDF file first.' });
            return;
        }

        // Check required fields
        for (const [key, value] of Object.entries(formData)) {
            if (!value) {
                setUploadStatus({ type: 'error', message: `Please fill out the ${key} field.` });
                return;
            }
        }

        setUploading(true);
        setUploadStatus(null);

        const data = new FormData();
        data.append('file', file);
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                    // Do NOT set Content-Type, fetch sets it automatically with boundary for FormData
                },
                body: data
            });

            const result = await res.json();

            if (res.ok) {
                setUploadStatus({ type: 'success', message: 'Document injected successfully to Vault.' });
                setFile(null);
                setFormData({
                    title: '',
                    college: '',
                    degree: '',
                    branch: '',
                    year: '',
                    sem: '',
                    subject: '',
                    examtype: ''
                });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setUploadStatus({ type: 'error', message: result.error || 'Failed to upload.' });
            }
        } catch (err) {
            setUploadStatus({ type: 'error', message: 'Network error occurred during upload.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col w-full bg-[#050505] min-h-screen relative pt-12 text-white">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row gap-12 pb-32">

                {/* Admin Sidebar */}
                <aside className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0 md:pr-8">
                    <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-500 mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                        Admin Protocol
                    </h2>

                    <nav className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <UploadCloud className="w-4 h-4" /> Upload Node
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'manage' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <Database className="w-4 h-4" /> Data Core
                        </button>
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <BarChart2 className="w-4 h-4" /> Insights
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings className="w-4 h-4" /> Config
                        </button>

                        <div className="mt-12">
                            <button
                                onClick={() => { setIsLoggedIn(false); setAdminToken(''); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all w-full"
                            >
                                Suspend Session
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 flex flex-col min-w-0">

                    {/* TABS */}
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

                                {/* Drag & Drop Zone */}
                                <div
                                    className={`w-full h-48 rounded-2xl border-2 border-dashed ${file ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/50 bg-white/[0.02]'} flex flex-col items-center justify-center gap-4 group cursor-pointer transition-colors relative overflow-hidden`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                    />
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

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
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Quantum Physics Mid-Term 2024"
                                            className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                                        />
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
                                            <input
                                                type="text"
                                                name={f.id}
                                                value={formData[f.id]}
                                                onChange={handleInputChange}
                                                placeholder={f.placeholder}
                                                className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="mt-4 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-colors self-start shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {uploading ? 'Processing Ingress...' : 'Inject to Vault'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Manage Tab Content Rest of UI... */}
                    {activeTab === 'manage' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Static UI kept from original context */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Data Core.</h1>
                                    <p className="text-sm text-gray-500 font-medium tracking-wide">Manage, modify, or terminate existing data records.</p>
                                </div>
                            </div>
                            {/* For brevity, the rest is the same mockup list. */}
                            <div className="flex flex-col border border-white/5 rounded-2xl bg-[#0a0a0a] overflow-hidden opacity-50 pointer-events-none">
                                <div className="p-8 text-center text-sm font-bold tracking-widest text-gray-500 uppercase">Manage Functionality Pending Future Integration</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Metrics.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Real-time usage statistics and performance insights.</p>
                            </div>
                            <div className="p-8 text-center text-sm border border-white/5 rounded-2xl font-bold tracking-widest bg-white/[0.02] text-gray-500 uppercase">Analytics Architecture Online - Pending Live Data Stream</div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 text-center text-sm border border-white/5 rounded-2xl font-bold tracking-widest bg-white/[0.02] text-gray-500 uppercase">Settings Managed via Core Protocol</div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
