'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DemoNavbar() {
    const pathname = usePathname();
    const [location, setLocation] = useState('Mumbai - Bandra West');

    // Only show on demo pages, or always? Let's show always for the demo effect.
    // Maybe hide on the very first "HeroAnimation" view? No, it sits on top.

    const navItems = [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Store Map', path: '/customer/map', icon: '🗺️' }, // Added Map
        { name: 'Customer App', path: '/customer/scan', icon: '🛍️' },
        { name: 'Security Gate', path: '/security/login', icon: '👮' },
        { name: 'Admin Panel', path: '/admin/login', icon: '👨‍💼' },
        { name: 'Test Barcodes', path: '/test-barcodes', icon: '🏷️' },
    ];

    const locations = [
        'Mumbai - Bandra West',
        'Mumbai - Andheri East',
        'Delhi - Connaught Place',
        'Bangalore - Koramangala',
        'Pune - Hinjewadi'
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* 1. Logo & Location (The "Real Time Market") */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-80 transition-opacity">
                        SCAN NIMART
                    </Link>

                    <div className="hidden md:flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/50 hover:bg-white hover:shadow-md transition-all group cursor-pointer relative">
                        <span className="text-red-500 animate-pulse text-xs">●</span>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-4"
                        >
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                        <span className="absolute right-2 text-xs text-slate-400 pointer-events-none">▼</span>
                    </div>
                </div>

                {/* 2. Navigation Links */}
                <nav className="flex items-center gap-1 md:gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <span className="text-base">{item.icon}</span>
                                <span className="hidden md:inline">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. Helper/Context Action (Optional) */}
                <div className="md:hidden">
                    {/* Mobile Menu Placeholder if needed, for now horizontal scroll usually works for simple navs */}
                </div>
            </div>
        </div>
    );
}
