import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.svg';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 w-full z-50 nav-glass">
            <div className="max-w-7xl mx-auto px-8 md:px-10 h-20 md:h-24 flex justify-between items-center">
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
                            <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500 transition-colors hidden md:flex" title="Sign Out">
                                <LogOut className="w-5 h-5" />
                            </button>
                        ) : location.pathname !== '/login' ? (
                            <Link to="/login" className="bg-white text-black text-[10px] md:text-xs font-black uppercase px-6 py-2.5 md:px-8 md:py-3.5 tracking-widest hover:scale-105 hover:bg-gray-100 transition-all text-center rounded-sm">
                                Login
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </nav>
    );
}
