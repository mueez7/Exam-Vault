import React, { useLayoutEffect, useRef } from 'react';
import { FileText, ArrowDown, Bookmark } from 'lucide-react';
const PAPERS = []; // TODO: Replace with real user saved papers data
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Saved() {
    const container = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Hero Intro Animation
            const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 2 } });
            tl.to(".hero-elem", { opacity: 1, y: 0, stagger: 0.15, delay: 0.2 });

            gsap.fromTo(".paper-card",
                { opacity: 0, x: -10 },
                {
                    scrollTrigger: {
                        trigger: "#vault-grid",
                        start: "top 85%",
                    },
                    opacity: 1,
                    x: 0,
                    stagger: 0.05,
                    duration: 0.8,
                    ease: "power2.out"
                }
            );

        }, container);
        return () => ctx.revert();
    }, []);

    const handleScroll = () => {
        const target = document.getElementById('vault-explorer');
        if (target) {
            window.scrollTo({
                top: target.offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div ref={container} className="flex flex-col w-full bg-[#050505] relative">

            {/* Hero Section - STRICTLY FULL VIEWPORT */}
            <section className="w-full h-screen flex flex-col items-center justify-center text-center px-6 relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full opacity-30 pointer-events-none mx-auto max-w-4xl max-h-4xl"></div>

                <div className="flex flex-col items-center justify-center mt-auto">
                    <h2 className="hero-elem text-blue-500 text-[10px] md:text-xs uppercase tracking-[0.8em] mb-8 font-bold opacity-0 translate-y-10">
                        The Saved Vault
                    </h2>
                    <h1 className="hero-elem text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 opacity-0 translate-y-10">
                        Retrieve the <span className="italic font-light text-gray-500">Saved.</span>
                    </h1>
                    <p className="hero-elem text-gray-400 max-w-xl mx-auto text-sm md:text-base tracking-widest leading-relaxed opacity-0 translate-y-10">
                        YOUR ACCUMULATED ACADEMIC KNOWLEDGE IN A SINGLE, HIGH-VELOCITY QUERY ENGINE.
                    </p>
                </div>

                <button
                    onClick={handleScroll}
                    className="hero-elem opacity-0 translate-y-10 bg-transparent text-gray-500 hover:text-white px-10 py-5 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] transition-colors flex items-center gap-3 mt-auto mb-32 group"
                >
                    Scroll to Initialize <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
            </section>

            {/* Exploration Area - Hidden Below the Fold */}
            <section id="vault-explorer" className="w-full bg-[#050505] min-h-screen border-t border-white/5 pt-20">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex relative">

                    {/* Right Side - Database Grid */}
                    <main id="vault-grid" className="flex-1 flex flex-col pb-32 w-full">
                        <div className="flex items-center justify-between px-2 pb-6 border-b border-white/5 mb-6">
                            <h3 className="text-[17px] md:text-xl font-black text-white px-2 tracking-tight">Saved Resources</h3>
                        </div>

                        {/* Grid Iteration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                            {PAPERS.map(doc => (
                                <div key={doc.id} className="group flex flex-col bg-[#050505] border border-white/5 rounded-xl paper-card transition-all duration-300 ease-out cursor-pointer relative">
                                    {/* Mock Image Placeholder Area */}
                                    <div className="w-full aspect-[3/4] bg-[#0a0a0a] relative p-4 flex items-center justify-center border border-transparent border-b-white/5 overflow-hidden rounded-t-xl group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out z-10">
                                        <div className="absolute top-3 left-3 bg-[#1a1a1a] text-gray-300 border border-white/5 text-[8px] font-bold px-2 py-1 rounded shadow-md z-10 uppercase tracking-widest">
                                            PDF
                                        </div>
                                        <div className="w-[65%] h-[80%] bg-[#111] border border-white/5 rounded-lg flex items-center justify-center relative">
                                            <FileText className="w-8 h-8 text-white/10" />
                                        </div>
                                    </div>

                                    {/* Card Content Details */}
                                    <div className="flex flex-col p-4 grow">
                                        <h4 className="text-[14px] font-bold text-white leading-tight mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors">
                                            {doc.subject}
                                        </h4>
                                        <span className="text-[10px] text-gray-500 font-medium mb-auto">
                                            {doc.degree} • {doc.branch}
                                        </span>

                                        <div className="flex items-center justify-between mt-6">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                {doc.type} • {doc.year}
                                            </span>
                                            <button className="text-gray-600 hover:text-white transition-colors">
                                                <Bookmark className="w-4 h-4 fill-current text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>

                </div>
            </section>
        </div>
    );
}
