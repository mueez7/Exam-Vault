import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, X, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/Logo.svg';
import Particles from './Particles';

export default function Auth() {
    const { user, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: ''
    });

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/archive" replace />;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: { display_name: formData.displayName.trim() }
                    }
                });
                if (signUpError) throw signUpError;
                setRegisteredEmail(formData.email);
                setShowEmailModal(true);
                setIsLogin(true); // Switch to login view
            }
        } catch (err) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col bg-[#030303] text-white overflow-hidden relative">
            {/* Fullscreen React Bits Particles Component */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-auto"
            >
                <Particles
                    particleCount={500}
                    moveParticlesOnHover={true}
                    particleHoverFactor={2}
                    speed={0.15}
                    particleColors={['#ffffff', '#ffffff', '#ffffff']}
                />
            </motion.div>

            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 relative z-10 pointer-events-none overflow-hidden">

                {/* Email Confirmation Modal */}
                {showEmailModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto"
                        style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(3,3,3,0.85)' }}
                        onClick={() => setShowEmailModal(false)}
                    >
                        <div
                            className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
                            style={{ animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Glow accent removed */}
                            <div className="absolute inset-0 rounded-3xl bg-white/5 pointer-events-none" />

                            {/* Close button */}
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <Mail className="w-7 h-7 text-blue-400" />
                                </div>
                            </div>

                            {/* Text */}
                            <h2 className="text-xl font-black tracking-tight mb-2">Check Your Inbox</h2>
                            <p className="text-sm text-gray-500 leading-relaxed mb-1">
                                We sent a confirmation link to
                            </p>
                            <p className="text-sm font-bold text-blue-400 mb-5 break-all">{registeredEmail}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Click the link in the email to verify your account. Check your spam folder if you don&apos;t see it.
                            </p>

                            {/* Divider */}
                            <div className="my-6 border-t border-white/5" />

                            {/* CTA */}
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="w-full bg-white text-black hover:bg-gray-200 active:scale-[0.98] py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            >
                                Got It
                            </button>

                            <style>{`
                            @keyframes slideUpFade {
                                from { opacity: 0; transform: translateY(24px) scale(0.97); }
                                to   { opacity: 1; transform: translateY(0)  scale(1); }
                            }
                        `}</style>
                        </div>
                    </div>
                )}

                {/* Left Column: Branding / Aesthetics */}
                <div className="hidden md:flex flex-col relative items-center justify-center overflow-hidden bg-transparent h-full">

                    {/* Foreground content - pointer-events-none allows hover to pass thru to particles */}
                    <div className="relative z-10 flex flex-col items-center select-none pt-12 pointer-events-none">
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                            src={logo}
                            alt="ExamVault Logo Background"
                            className="w-[180px] h-[180px] mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] object-contain"
                        />

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                            className="text-7xl font-black tracking-tighter mb-4 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            ExamVault.
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 0.8, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                            className="text-blue-500 font-bold tracking-[0.4em] text-xs uppercase shadow-blue-500/20 drop-shadow-lg"
                        >
                            Engineering Archives
                        </motion.p>
                    </div>
                </div>

                {/* Right Column: Authentication Form */}
                <div className="flex flex-col flex-1 items-center justify-center p-6 relative w-full h-full max-w-lg mx-auto md:max-w-none pointer-events-none">
                    {/* Background effects removed per request */}

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
                        className="w-full max-w-md relative z-10 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="flex flex-col items-center mb-10 text-center md:items-start md:text-left">
                            {/* Show logo only on mobile, since desktop has it on the left */}
                            <motion.img
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                src={logo}
                                alt="ExamVault Logo"
                                className="md:hidden w-12 h-12 mb-6 object-contain"
                            />
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">
                                {isLogin ? 'Welcome Back.' : 'Join the Vault.'}
                            </h1>
                            <p className="text-sm text-gray-500 font-medium tracking-wide max-w-sm">
                                {isLogin ? 'Authenticate to access the engineering archives.' : 'Create an account to browse historical exam data.'}
                            </p>
                        </div>

                        {/* Main Auth Card */}
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute -inset-1 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">

                                {error && (
                                    <div className="p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border bg-red-500/10 border-red-500/20 text-red-500 animate-in fade-in">
                                        {error}
                                    </div>
                                )}

                                {/* Display Name — sign-up only */}
                                {!isLogin && (
                                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Display Name</label>
                                        <div className="relative">
                                            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                placeholder="Your name"
                                                required
                                                className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="engineering@student.edu"
                                            required
                                            className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center pr-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Protocol Key</label>
                                        {isLogin && <a href="#" className="text-[10px] text-blue-500 hover:text-white transition-colors font-bold tracking-wider">LOST KEY?</a>}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••••••"
                                            required
                                            className="w-full bg-[#111] border border-white/5 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-4 text-sm tracking-widest font-mono text-white focus:outline-none transition-colors placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white text-black py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                    ) : (
                                        <>
                                            {isLogin ? 'Initialize Session' : 'Create Access Key'}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>

                        {/* Toggle Mode */}
                        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000 md:text-left text-sm text-gray-500 font-medium pl-1">
                            {isLogin ? "Don't have clearance yet?" : "Already part of the database?"}{" "}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="text-white font-bold hover:text-blue-500 transition-colors ml-1"
                            >
                                {isLogin ? 'Request Access' : 'Authenticate Now'}
                            </button>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
}
