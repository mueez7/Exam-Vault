import React, { useLayoutEffect, useRef } from 'react';
import { Mail, Github, Linkedin, Terminal } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import mImage from '../assets/M.jpg';
import sImage from '../assets/S.jpg';

gsap.registerPlugin(ScrollTrigger);

export default function Architects() {
    const container = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {

            const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });
            tl.to(".hero-elem", { opacity: 1, y: 0, stagger: 0.1, delay: 0.2 });


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

    return (
        <div ref={container} className="flex-1 w-full flex flex-col bg-[#050505] relative min-h-screen overflow-x-hidden">



            <section className="w-full pt-28 md:pt-36 pb-10 md:pb-12 border-b border-white/[0.05] relative z-10 bg-[#050505]/50 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6">
                    <h1 className="hero-elem text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-4 opacity-0 translate-y-3">
                        The Architects.
                    </h1>
                    <p className="hero-elem text-gray-500 text-sm md:text-base font-medium max-w-2xl leading-relaxed opacity-0 translate-y-3">
                        Meet the engineering and design minds behind ExamVault. Building the core data infrastructure and crafting frictionless interfaces for scalable academic retrieval.
                    </p>
                </div>
            </section>


            <main id="dev-section" className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start w-full justify-items-center">

                <div className="dev-card opacity-0 translate-y-20 flex flex-col items-center text-center w-full max-w-[400px]">
                    <div className="image-frame w-full max-w-[360px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all duration-700 ease-out shadow-2xl group">
                        <img src={mImage}
                            alt="Abdul Mueez - Core Architect"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    <div className="mt-8 flex flex-col items-center w-full">
                        <span className="text-[10px] md:text-xs tracking-[0.4em] text-blue-500 uppercase font-black mb-3 md:mb-4 block">
                            Core Architect
                        </span>

                        <h3 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 md:mb-6 text-white leading-tight w-full">
                            Abdul<br className="hidden md:block" /> Mueez
                        </h3>

                        <p className="text-gray-500 text-sm sm:text-base md:text-lg font-light leading-relaxed mb-8 md:mb-10 w-full px-4">
                            Engineered the proprietary sharding protocols and core vault infrastructure for sub-second database retrieval.
                        </p>

                        <div className="flex flex-col items-center w-full">
                            <a href="mailto:1975abdulmueez@gmail.com" className="contact-row">
                                <Mail className="w-4 h-4" /> 1975abdulmueez@gmail.com
                            </a>
                            <a href="https://github.com/mueez7" target="_blank" rel="noreferrer" className="contact-row">
                                <Github className="w-4 h-4" /> github.com/Mueez
                            </a>
                            <a href="https://www.linkedin.com/in/abdul-mueez-a1ab53213/" target="_blank" rel="noreferrer" className="contact-row">
                                <Linkedin className="w-4 h-4" /> linkedin.com/in/Abdul Mueez
                            </a>
                        </div>
                    </div>
                </div>


                <div className="dev-card opacity-0 translate-y-20 flex flex-col items-center text-center w-full max-w-[400px]">
                    <div className="image-frame w-full max-w-[360px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all duration-700 ease-out shadow-2xl group">
                        <img src={sImage}
                            alt="Syeda Sara - Experience Lead"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    <div className="mt-8 flex flex-col items-center w-full">
                        <span className="text-[10px] md:text-xs tracking-[0.4em] text-pink-500 uppercase font-black mb-3 md:mb-4 block">
                            Experience Lead
                        </span>

                        <h3 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 md:mb-6 text-white leading-tight w-full">
                            Syeda<br className="hidden md:block" /> Sara
                        </h3>

                        <p className="text-gray-500 text-sm sm:text-base md:text-lg font-light leading-relaxed mb-8 md:mb-10 w-full px-4">
                            Designing high-fidelity interfaces that bridge the gap between human intuition and complex academic data sets.
                        </p>

                        <div className="flex flex-col items-center w-full">
                            <a href="mailto:syedasara2021@gmail.com" className="contact-row">
                                <Mail className="w-4 h-4" /> syedasara2021@gmail.com
                            </a>
                            <a href="https://github.com/syedasara2021-web" target="_blank" rel="noreferrer" className="contact-row">
                                <Github className="w-4 h-4" /> github.com/Syeda Sara
                            </a>
                            <a href="https://www.linkedin.com/in/syeda-sara-995838384/" target="_blank" rel="noreferrer" className="contact-row">
                                <Linkedin className="w-4 h-4" /> linkedin.com/in/Syeda Sara
                            </a>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
