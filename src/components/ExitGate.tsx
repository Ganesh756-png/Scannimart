import { useEffect, useState } from 'react';

export default function ExitGate({ isOpen }: { isOpen: boolean }) {
    const [gateState, setGateState] = useState<'closed' | 'opening' | 'open'>('closed');

    useEffect(() => {
        if (isOpen) {
            setGateState('opening');
            const timer = setTimeout(() => {
                setGateState('open');
            }, 1500); // matches the CSS transition length
            return () => clearTimeout(timer);
        } else {
            setGateState('closed');
        }
    }, [isOpen]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-sm max-w-sm w-full mx-auto select-none">
            {/* SVG Illustration Container */}
            <svg width="280" height="180" viewBox="0 0 280 180" className="overflow-visible">
                {/* Ground Line */}
                <line x1="10" y1="160" x2="270" y2="160" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                
                {/* Gate Housing/Stand */}
                <rect x="30" y="70" width="36" height="90" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="3" />
                <rect x="36" y="80" width="24" height="24" rx="4" fill="#0f172a" />
                
                {/* Indicator Light */}
                {gateState === 'closed' && (
                    <circle cx="48" cy="92" r="6" fill="#ef4444" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} />
                )}
                {gateState === 'opening' && (
                    <circle cx="48" cy="92" r="6" fill="#f59e0b" className="animate-ping" style={{ filter: 'drop-shadow(0 0 12px #f59e0b)' }} />
                )}
                {gateState === 'open' && (
                    <circle cx="48" cy="92" r="6" fill="#10b981" style={{ filter: 'drop-shadow(0 0 12px #10b981)' }} />
                )}

                {/* Pivot Joint */}
                <circle cx="48" cy="115" r="8" fill="#64748b" stroke="#475569" strokeWidth="2" />

                {/* Gate Pole (Boom Arm) */}
                <g 
                    style={{
                        transform: gateState === 'open' ? 'rotate(-85deg)' : gateState === 'opening' ? 'rotate(-40deg)' : 'rotate(0deg)',
                        transformOrigin: '48px 115px',
                        transition: 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                >
                    {/* The Arm */}
                    <line x1="48" y1="115" x2="250" y2="115" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                    {/* Red reflective stripes */}
                    <line x1="80" y1="115" x2="100" y2="115" stroke="#ef4444" strokeWidth="8" />
                    <line x1="120" y1="115" x2="140" y2="115" stroke="#ef4444" strokeWidth="8" />
                    <line x1="160" y1="115" x2="180" y2="115" stroke="#ef4444" strokeWidth="8" />
                    <line x1="200" y1="115" x2="220" y2="115" stroke="#ef4444" strokeWidth="8" />
                    <line x1="230" y1="115" x2="245" y2="115" stroke="#ef4444" strokeWidth="8" />
                    
                    {/* Tip marker */}
                    <circle cx="250" cy="115" r="4" fill="#ef4444" />
                </g>

                {/* Exit signage */}
                <g transform="translate(140, 30)">
                    <rect x="-40" y="-15" width="80" height="30" rx="6" fill="#022c22" stroke="#064e3b" strokeWidth="2" />
                    <text x="0" y="5" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">EXIT</text>
                </g>
            </svg>

            {/* Status text */}
            <div className="mt-4 text-center">
                <span className={`text-[10px] font-mono tracking-widest uppercase font-black px-3 py-1 rounded-full border ${
                    gateState === 'closed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    gateState === 'opening' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                    {gateState === 'closed' && 'Gate Closed'}
                    {gateState === 'opening' && 'Lifting Barrier...'}
                    {gateState === 'open' && 'Gate Opened - Safe Exit'}
                </span>
            </div>
        </div>
    );
}
