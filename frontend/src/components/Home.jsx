import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';

export default function Home() {
    const container = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

            tl.to("#hero-tagline", {
                opacity: 1,
                y: -10,
                duration: 2,
                delay: 0.5
            })
                .to("#hero-main", {
                    opacity: 1,
                    y: -10,
                    duration: 2
                }, "-=1.5")
                .to("#hero-subtext", {
                    opacity: 1,
                    y: -10,
                    duration: 2
                }, "-=1.5")
                .to("#hero-action", {
                    opacity: 1,
                    y: 0,
                    duration: 1.5
                }, "-=1.2");
        }, container);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={container} className="relative h-screen flex flex-col items-center justify-center px-6 text-center w-full max-w-none">

            <div className="max-w-4xl relative z-10 w-full">
                <h2 id="hero-tagline" className="text-[11px] uppercase tracking-[1em] text-gray-500 mb-6 opacity-0">
                    Institutional Memory
                </h2>

                <h1 id="hero-main"
                    className="text-6xl md:text-8xl font-light leading-[1.1] tracking-tight opacity-0 mb-10 text-glow">
                    Preserving <br />
                    <span className="font-semibold italic">Academic Legacy.</span>
                </h1>

                <p id="hero-subtext"
                    className="text-gray-500 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto opacity-0">
                    The definitive digital repository for university intelligence,
                    engineered for clarity and high-speed retrieval.
                </p>
            </div>

            <div id="hero-action" className="mt-12 opacity-0 relative z-10">
                <Link to="/archive"
                    className="group flex items-center gap-4 text-[11px] uppercase tracking-[0.5em] text-white/60 hover:text-white transition-all">
                    <span>Enter The Archive</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform stroke-[2]" />
                </Link>
            </div>

            {/* Background glowing orb */}
            <div className="fixed bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
        </div>
    );
}
