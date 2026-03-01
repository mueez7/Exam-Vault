import React, { useLayoutEffect, useRef } from 'react';
import { Mail, Github, Linkedin } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Architects() {
    const container = useRef(null);
    const scrollTriggerRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Initial Hero Reveal
            const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 2 } });
            tl.to("#hero-title", { opacity: 1, y: -30, delay: 0.5 })
                .to("#hero-btn", { opacity: 1, y: -20 }, "-=1.5");

            // Scroll Trigger for Devs
            gsap.utils.toArray(".dev-card").forEach((card, i) => {
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    ease: "power4.out",
                    delay: i * 0.2
                });
            });
        }, container);

        return () => ctx.revert();
    }, []);

    const handleScroll = () => {
        const target = document.getElementById('dev-section');
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }

    return (
        <div ref={container} className="flex-1 w-full flex flex-col">

            <section className="h-screen flex flex-col items-center justify-center text-center px-6">
                <div className="max-w-6xl w-full">
                    <h1 id="hero-title" className="hero-main font-bold tracking-tighter mb-12 opacity-0">
                        Built by <br /> <span className="italic font-light text-gray-500">The Architects.</span>
                    </h1>
                    <div id="hero-btn" className="opacity-0">
                        <button
                            onClick={handleScroll}
                            className="bg-white text-black px-14 py-6 text-[10px] font-black uppercase tracking-[0.4em] rounded-full hover:scale-105 transition-transform">
                            Connect with Systems
                        </button>
                    </div>
                </div>
            </section>

            <main id="dev-section" className="max-w-7xl mx-auto px-10 pb-40 grid md:grid-cols-2 gap-24 items-start w-full">

                <div className="dev-card opacity-0 translate-y-20">
                    <div className="image-frame max-w-[360px]">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop"
                            alt="NOVA" />
                    </div>
                    <div className="mt-8">
                        <span className="text-[10px] tracking-[0.5em] text-blue-500 uppercase font-bold mb-4 block">Core Architect</span>
                        <h3 className="text-7xl font-bold tracking-tighter mb-6">NOVA</h3>
                        <p className="text-gray-500 text-lg font-light leading-relaxed mb-10 max-w-sm">
                            Engineered the proprietary sharding protocols and core vault infrastructure for sub-second retrieval.
                        </p>
                        <div className="flex flex-col">
                            <a href="mailto:nova@examvault.io" className="contact-row">
                                <Mail className="w-4 h-4" /> nova@examvault.io
                            </a>
                            <a href="#" className="contact-row">
                                <Github className="w-4 h-4" /> github.com/nova-vault
                            </a>
                            <a href="#" className="contact-row">
                                <Linkedin className="w-4 h-4" /> linkedin.com/in/nova-arch
                            </a>
                        </div>
                    </div>
                </div>

                <div className="dev-card opacity-0 translate-y-20 mt-[15vh]">
                    <div className="image-frame max-w-[360px]">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                            alt="SOVA" />
                    </div>
                    <div className="mt-8">
                        <span className="text-[10px] tracking-[0.5em] text-pink-500 uppercase font-bold mb-4 block">Experience Lead</span>
                        <h3 className="text-7xl font-bold tracking-tighter mb-6">SOVA</h3>
                        <p className="text-gray-500 text-lg font-light leading-relaxed mb-10 max-w-sm">
                            Designing high-fidelity interfaces that bridge the gap between human intuition and academic data.
                        </p>
                        <div className="flex flex-col">
                            <a href="mailto:sova@examvault.io" className="contact-row">
                                <Mail className="w-4 h-4" /> sova@examvault.io
                            </a>
                            <a href="#" className="contact-row">
                                <Github className="w-4 h-4" /> github.com/sova-ux
                            </a>
                            <a href="#" className="contact-row">
                                <Linkedin className="w-4 h-4" /> linkedin.com/in/sova-arch
                            </a>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
