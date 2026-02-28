'use client';

import { useState, useEffect } from 'react';

export default function HeroAnimation({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Timeline
        const times = [
            1000, // 0: Start
            3000, // 1: "The Old Way..."
            4500, // 2: "queue is DEAD" glitch
            6000, // 3: Explosion / Reveal
        ];

        const t1 = setTimeout(() => setStep(1), times[0]);
        const t2 = setTimeout(() => setStep(2), times[1]);
        const t3 = setTimeout(() => setStep(3), times[2]);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">

            {/* BACKGROUND EFFECTS */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-black animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
            </div>

            {/* STEP 1: TYPING TEXT */}
            {step === 1 && (
                <h1 className="text-white text-3xl md:text-5xl font-mono animate-typing overflow-hidden whitespace-nowrap border-r-4 border-white pr-2">
                    The old way of shopping...
                </h1>
            )}

            {/* STEP 2: GLITCH TEXT */}
            {step === 2 && (
                <div className="relative">
                    <h1 className="text-red-600 text-6xl md:text-9xl font-black animate-shake relative z-10 font-sans tracking-tighter">
                        IS DEAD.
                    </h1>
                    <h1 className="text-cyan-400 text-6xl md:text-9xl font-black absolute top-1 left-1 opacity-60 animate-pulse mix-blend-screen tracking-tighter">
                        IS DEAD.
                    </h1>
                    <h1 className="text-blue-600 text-6xl md:text-9xl font-black absolute -top-1 -left-1 opacity-60 animate-glitch mix-blend-screen tracking-tighter">
                        IS DEAD.
                    </h1>
                </div>
            )}

            {/* STEP 3: REVEAL */}
            {step >= 3 && (
                <div className="text-center animate-fadeInUp z-10 px-4">
                    <div className="mb-8 relative inline-block">
                        <div className="absolute -inset-8 bg-blue-500 blur-3xl opacity-30 animate-pulse rounded-full"></div>
                        <span className="relative text-8xl md:text-[10rem] drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">🛒</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 mb-4 tracking-tighter drop-shadow-sm">
                        SCAN NIMART
                    </h1>
                    <p className="text-slate-400 text-xl md:text-2xl mb-12 tracking-widest uppercase font-light">
                        The Future is Here
                    </p>

                    <button
                        onClick={onComplete}
                        className="group relative px-10 py-5 bg-white text-black font-bold text-xl rounded-full overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            ENTER STORE <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>

                    <div className="mt-16 flex justify-center gap-3 opacity-50">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300"></div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes typing {
                    from { width: 0 }
                    to { width: 100% }
                }
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes fadeInUp {
                    from { 
                        opacity: 0;
                        transform: translateY(40px) scale(0.9);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes glitch {
                    0% { transform: translate(0) }
                    20% { transform: translate(-2px, 2px) }
                    40% { transform: translate(-2px, -2px) }
                    60% { transform: translate(2px, 2px) }
                    80% { transform: translate(2px, -2px) }
                    100% { transform: translate(0) }
                }
                .animate-glitch {
                    animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
                }
            `}</style>
        </div>
    );
}
