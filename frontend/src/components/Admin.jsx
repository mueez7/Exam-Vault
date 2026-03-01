import React, { useState } from 'react';
import { UploadCloud, Database, Settings, Search, Plus, FileText, ChevronDown, BarChart2, Users, Download, Eye } from 'lucide-react';

const MOCK_MANAGE_RESULTS = [
    { id: 1, title: 'Operating Systems (OS-302) | 2024 Main Paper', uni: 'Stanford Applied', details: 'B.Tech • Sem 04', views: '2024 • Main Exam', status: 'Active' },
    { id: 2, title: 'Database Logic (DB-401)', uni: 'MIT Engineering', details: 'B.Tech • Sem 04', views: '2023 • Main Exam', status: 'Active' },
    { id: 3, title: 'Advanced Algorithms (AL-602)', uni: 'Harvard Sciences', details: 'M.Tech • Sem 02', views: '2023 • Supp Exam', status: 'Archived' },
];

const FILTERS = [
    { id: 'college', label: 'College', options: ['Stanford', 'MIT', 'Harvard'] },
    { id: 'degree', label: 'Degree', options: ['B.Tech', 'M.Tech', 'Ph.D'] },
    { id: 'branch', label: 'Branch', options: ['CS', 'Mech', 'EE', 'Civil'] },
    { id: 'year', label: 'Year', options: ['2024', '2023', '2022', '2021'] },
    { id: 'sem', label: 'Sem', options: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    { id: 'subject', label: 'Subject', options: ['OS', 'Database', 'Networks', 'ML'] },
    { id: 'examtype', label: 'Exam Type', options: ['Main', 'Supp', 'Mid-Term'] },
];

export default function Admin() {
    const [activeTab, setActiveTab] = useState('upload');

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

                            <form className="flex flex-col gap-8 max-w-3xl">

                                {/* Drag & Drop Zone */}
                                <div className="w-full h-48 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/[0.02] flex flex-col items-center justify-center gap-4 group cursor-pointer transition-colors relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <UploadCloud className="w-10 h-10 text-gray-600 group-hover:text-blue-500 transition-colors relative z-10" />
                                    <div className="text-center relative z-10">
                                        <p className="text-sm font-bold text-gray-300">CLICK TO BROWSE OR DRAG FILE HERE</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Accepts PDF, DOCX (Max 50MB)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Document Title</label>
                                        <input type="text" placeholder="e.g. Quantum Physics Mid-Term" className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                                    </div>

                                    {FILTERS.map(f => (
                                        <div key={f.id} className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{f.label}</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-gray-400 focus:text-white focus:outline-none appearance-none transition-colors">
                                                    <option value="" disabled selected>Select {f.label}</option>
                                                    {f.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="button" className="mt-4 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-colors self-start shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Inject to Vault
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Data Core.</h1>
                                    <p className="text-sm text-gray-500 font-medium tracking-wide">Manage, modify, or terminate existing data records.</p>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 px-4 py-2.5 rounded-full border border-white/5 w-full md:w-auto">
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH RECORDS..."
                                        className="bg-transparent text-white font-bold tracking-widest text-xs uppercase focus:outline-none placeholder-gray-600 w-full md:w-[200px]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col border border-white/5 rounded-2xl bg-[#0a0a0a] overflow-hidden">
                                {/* Table Header */}
                                <div className="flex items-center px-6 py-4 bg-white/[0.02] border-b border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                    <div className="w-[10%]">Status</div>
                                    <div className="w-[45%]">Document</div>
                                    <div className="w-[25%]">Institution</div>
                                    <div className="w-[20%] text-right">Actions</div>
                                </div>

                                {/* Results Iteration */}
                                {MOCK_MANAGE_RESULTS.map(doc => (
                                    <div key={doc.id} className="flex items-center px-6 py-5 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                        <div className="w-[10%]">
                                            {doc.status === 'Active' ? (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] block animate-pulse"></span>
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-gray-600 block"></span>
                                            )}
                                        </div>
                                        <div className="w-[45%] flex flex-col pr-4">
                                            <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors truncate">{doc.title}</h4>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{doc.details}</span>
                                        </div>
                                        <div className="w-[25%] text-xs font-semibold text-gray-400 truncate">
                                            {doc.uni}
                                        </div>
                                        <div className="w-[20%] flex justify-end gap-3">
                                            <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:text-white transition-colors">Edit</button>
                                            <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Vault Metrics.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Real-time usage statistics and performance insights.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                {/* Metric Unit: Uploads */}
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <UploadCloud className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Uploads</h3>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-white">1,248</div>
                                    <div className="mt-2 text-[10px] font-bold text-green-500 flex items-center gap-1">+12% this month</div>
                                </div>

                                {/* Metric Unit: Downloads */}
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full group-hover:bg-purple-500/10 transition-colors"></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Download className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Downloads</h3>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-white">45.2k</div>
                                    <div className="mt-2 text-[10px] font-bold text-green-500 flex items-center gap-1">+8.4% this month</div>
                                </div>

                                {/* Metric Unit: Active Users */}
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full group-hover:bg-teal-500/10 transition-colors"></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-teal-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Users</h3>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-white">8,432</div>
                                    <div className="mt-2 text-[10px] font-bold text-green-500 flex items-center gap-1">+24% this month</div>
                                </div>

                                {/* Metric Unit: Total Views */}
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full group-hover:bg-orange-500/10 transition-colors"></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <Eye className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Document Views</h3>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-white">1.2M</div>
                                    <div className="mt-2 text-[10px] font-bold text-green-500 flex items-center gap-1">+18% this month</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Protocol Config.</h1>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">System-level variables and authentication settings.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 flex flex-col gap-4">
                                    <h3 className="text-white font-bold uppercase tracking-widest text-xs">Security Architecture</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Manage API keys, strict access control constraints, and admin tier privileges.</p>
                                    <button className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg self-start mt-4 transition-colors">Configure Access</button>
                                </div>
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 flex flex-col gap-4">
                                    <h3 className="text-white font-bold uppercase tracking-widest text-xs">Storage Volume</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Current bucket size: 142.5 GB / 500 GB allocated. Re-index vectors for performance optimization.</p>
                                    <button className="text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg self-start mt-4 transition-colors">Run Indexing</button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
