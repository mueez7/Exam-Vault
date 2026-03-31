import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.svg';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <>
            <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 bg-[#0a0a0a]/70 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl">
                <div className="px-5 md:px-8 h-14 md:h-16 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 md:gap-4 group">
                    <img src={logo} alt="ExamVault Logo" className="w-5 h-5 md:w-7 md:h-7 object-contain group-hover:rotate-12 transition-transform duration-500" />
                    <span className="text-xl md:text-2xl font-bold tracking-widest text-white mb-0.5">ExamVault</span>
                </Link>

                <div className="flex items-center gap-8 md:gap-16">
                    {user && (
                        <div className="hidden md:flex gap-12 md:gap-16 text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold text-gray-500">
                            <Link to="/archive" className={`transition-colors pb-1 border-b ${location.pathname === '/archive' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>Browse</Link>
                            <Link to="/saved" className={`transition-colors pb-1 border-b ${location.pathname === '/saved' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>Saved</Link>
                            <Link to="/architects" className={`transition-colors pb-1 border-b ${location.pathname === '/architects' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>Devs</Link>
                        </div>
                    )}

                    <div className="flex items-center gap-4 ml-4">
                        {isAdmin && (
                            <Link to="/admin" className="bg-white text-black text-[10px] md:text-xs font-black uppercase px-6 py-2.5 md:px-8 md:py-3.5 tracking-widest hover:scale-105 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all text-center rounded-sm">
                                Admin Portal
                            </Link>
                        )}
                        {user ? (
                            <div className="flex items-center gap-3">
                                {/* Desktop items */}
                                <div className="hidden md:flex items-center gap-3">
                                    {(() => {
                                        const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'U';
                                        return (
                                            <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                                                <span className="text-xs font-semibold text-gray-300 tracking-wide max-w-[120px] truncate">
                                                    {displayName}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500 transition-colors" title="Sign Out">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                                {/* Mobile Hamburger */}
                                <button 
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="md:hidden flex items-center justify-center p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            </div>
                        ) : location.pathname !== '/login' ? (
                            <Link to="/login" className="bg-white text-black text-[10px] md:text-xs font-black uppercase px-6 py-2 md:px-8 md:py-3 tracking-widest hover:scale-105 hover:bg-gray-100 transition-all text-center rounded-sm">
                                Login
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </nav>

            {/* Fullscreen Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-[#050505]/98 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center transition-all">
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-6 right-6 p-3 text-gray-500 hover:text-white bg-white/5 border border-white/10 rounded-full transition-colors shadow-2xl"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center gap-10 text-center text-sm uppercase tracking-[0.4em] font-black text-gray-500">
                        <Link to="/" className={`hover:text-white hover:scale-110 transition-all ${location.pathname === '/' ? 'text-white' : ''}`}>Home</Link>
                        {user && (
                            <>
                                <Link to="/archive" className={`hover:text-white hover:scale-110 transition-all ${location.pathname === '/archive' ? 'text-white' : ''}`}>Browse</Link>
                                <Link to="/saved" className={`hover:text-white hover:scale-110 transition-all ${location.pathname === '/saved' ? 'text-white' : ''}`}>Saved</Link>
                                <Link to="/architects" className={`hover:text-white hover:scale-110 transition-all ${location.pathname === '/architects' ? 'text-white' : ''}`}>Devs</Link>
                                
                                <div className="w-12 h-[1px] bg-white/10 my-4" />
                                
                                <button onClick={handleSignOut} className="text-gray-600 hover:text-red-500 transition-colors flex flex-col items-center gap-3 group">
                                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] tracking-widest font-bold">Sign Out</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
