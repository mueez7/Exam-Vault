import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function Auth() {
    const { user, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
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
                    password: formData.password
                });
                if (signUpError) throw signUpError;
                setSuccess('Registration successful! You can now log in.');
                setIsLogin(true); // Switch to login view
            }
        } catch (err) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex-1 bg-[#030303] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center">
                <div className="w-[80vw] h-[80vh] bg-blue-500/5 rounded-full blur-[150px] opacity-30 animate-pulse-slow"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <img src={logo} alt="ExamVault Logo" className="w-12 h-12 mb-6 object-contain" />
                    <h1 className="text-4xl font-black tracking-tighter mb-2">
                        {isLogin ? 'Welcome Back.' : 'Join the Vault.'}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium tracking-wide">
                        {isLogin ? 'Authenticate to access the engineering archives.' : 'Create an account to browse historical exam data.'}
                    </p>
                </div>

                {/* Main Auth Card */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">

                        {(error || success) && (
                            <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
                                }`}>
                                {error || success}
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Initialize Session' : 'Create Record'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Toggle between Login/Signup */}
                <div className="text-center mt-8 text-sm text-gray-500 font-medium">
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

            </div>
        </div>
    );
}
