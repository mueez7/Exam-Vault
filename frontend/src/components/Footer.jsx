import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Disc as Discord, Mail, ArrowUpRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full bg-[#030303] border-t border-white/5 pt-32 pb-12 px-6 md:px-12 relative overflow-hidden">

            {/* Background Aesthetic element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto flex flex-col gap-24 relative z-10">

                {/* Top Massive Typography Area */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col gap-4 max-w-2xl">
                        <span className="text-[10px] md:text-xs text-blue-500 uppercase tracking-[0.6em] font-bold flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                            System Status: Online
                        </span>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9]">
                            Archives <br />
                            <span className="italic font-light text-gray-600">Reimagined.</span>
                        </h2>
                    </div>

                    <div className="flex max-w-xs pl-6 border-l-[3px] border-blue-500/50">
                        <p className="text-gray-500 text-sm font-light tracking-wide leading-relaxed">
                            ExamVault is a high-availability digital repository engineered to safeguard and distribute university academic papers with zero latency.
                        </p>
                    </div>
                </div>

                {/* Grid Links Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-16 border-t border-white/5">

                    {/* Navigation Column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Navigation</h4>
                        <div className="flex flex-col gap-4">
                            <Link to="/" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors flex items-center group">
                                Home <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all ml-1 text-blue-500" />
                            </Link>
                            <Link to="/archive" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors flex items-center group">
                                Browse Archive <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all ml-1 text-blue-500" />
                            </Link>
                            <Link to="/architects" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors flex items-center group">
                                The Architects <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all ml-1 text-blue-500" />
                            </Link>
                        </div>
                    </div>

                    {/* Resources Column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Resources</h4>
                        <div className="flex flex-col gap-4">
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">Documentation</a>
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">API Access</a>
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">Open Source</a>
                        </div>
                    </div>

                    {/* Legal Column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Legal Protocol</h4>
                        <div className="flex flex-col gap-4">
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">Privacy Shield</a>
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">Terms of Service</a>
                            <a href="#" className="text-gray-300 hover:text-white text-sm font-semibold tracking-wider transition-colors">Data Compliance</a>
                        </div>
                    </div>

                    {/* Socials Column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Network</h4>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:scale-110 transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] hover:scale-110 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] hover:scale-110 transition-all">
                                <Discord className="w-4 h-4" />
                            </a>
                        </div>
                        <a href="mailto:sys@examvault.io" className="mt-2 text-xs font-semibold tracking-widest text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                            <Mail className="w-4 h-4" /> SYS@EXAMVAULT.IO
                        </a>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-bold">
                        &copy; 2026 ExamVault Subsystems. All Rights Reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-700 font-black">
                            Ullal, Karnataka Base
                        </span>
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-700 font-black flex items-center gap-2 delay-1000">
                            v2.0.4 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
