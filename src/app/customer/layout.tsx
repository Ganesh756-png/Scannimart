'use client';

import { useEffect, useState } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function CustomerMobileLayout({ children }: { children: React.ReactNode }) {
    const [time, setTime] = useState('12:00');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hrs = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            setTime(`${hrs}:${mins}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen md:bg-slate-950 md:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] flex items-center justify-center p-0 md:p-8 relative overflow-hidden">
            
            {/* Background glowing decorations for desktop view */}
            <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Simulated iPhone Frame */}
            <div className="w-full h-screen md:h-[840px] md:max-w-[400px] bg-neutral-950 md:rounded-[55px] md:border-[12px] md:border-neutral-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden md:ring-1 md:ring-neutral-700">
                
                {/* 1. iPhone Notch / Dynamic Island (Desktop Only) */}
                <div className="hidden md:flex absolute top-3.5 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-center">
                    {/* Camera lens indicator */}
                    <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-800 absolute left-4"></div>
                    <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full absolute right-6 border border-neutral-900"></div>
                </div>

                {/* 2. Mock Status Bar (Visible on desktop screens, hidden on mobile where the real status bar is) */}
                <div className="hidden md:flex h-11 bg-neutral-950 text-white px-7 items-center justify-between text-[11px] font-semibold select-none z-40 shrink-0">
                    <span className="font-sans font-bold tracking-tight">{time}</span>
                    <div className="flex items-center gap-1.5">
                        <Signal className="w-3.5 h-3.5 text-white" fill="white" />
                        <Wifi className="w-3.5 h-3.5 text-white" />
                        <div className="flex items-center gap-0.5">
                            <span className="text-[9px] font-bold">98%</span>
                            <Battery className="w-4 h-4 text-white" fill="white" />
                        </div>
                    </div>
                </div>

                {/* 3. Screen Content Wrapper */}
                <div className="flex-grow overflow-y-auto relative flex flex-col bg-neutral-950 mock-phone-screen custom-scrollbar">
                    {children}
                </div>

                {/* 4. iPhone Home Indicator Bar (Desktop Only) */}
                <div className="hidden md:flex absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50 pointer-events-none"></div>
            </div>

            {/* Overriding desktop child layouts to stretch nicely inside the frame */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media (min-width: 768px) {
                    .mock-phone-screen .min-h-screen {
                        min-height: 100% !important;
                        height: 100% !important;
                        padding-bottom: 24px !important;
                    }
                    .mock-phone-screen::-webkit-scrollbar {
                        width: 4px;
                    }
                    .mock-phone-screen::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .mock-phone-screen::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 9999px;
                    }
                }
            `}} />
        </div>
    );
}
