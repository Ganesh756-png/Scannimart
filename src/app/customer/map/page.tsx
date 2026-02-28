'use client';

import Link from 'next/link';

export default function StoreMapPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">Store Navigation Map 🗺️</h1>

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">

                {/* MAP CONTAINER */}
                <div className="grid grid-cols-4 gap-4 aspect-video relative z-10">

                    {/* Entrance Zone */}
                    <div className="col-span-1 row-span-4 bg-green-100 border-2 border-green-300 rounded-xl flex flex-col items-center justify-center relative group">
                        <span className="text-4xl mb-2">🚪</span>
                        <span className="font-bold text-green-800">ENTRANCE</span>
                        <div className="absolute bottom-4 text-xs text-green-600 font-mono animate-pulse">Scan App Here</div>
                    </div>

                    {/* Aisle 1 - Produce */}
                    <div className="col-span-1 row-span-2 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center justify-center hover:bg-orange-100 transition shadow-sm">
                        <span className="text-3xl">🥦🍎</span>
                        <span className="font-bold text-slate-700 text-sm mt-1">Produce</span>
                    </div>

                    {/* Aisle 2 - Dairy */}
                    <div className="col-span-1 row-span-2 bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center justify-center hover:bg-blue-100 transition shadow-sm">
                        <span className="text-3xl">🥛🧀</span>
                        <span className="font-bold text-slate-700 text-sm mt-1">Dairy</span>
                    </div>

                    {/* Aisle 3 - Bakery (Top Right) */}
                    <div className="col-span-1 row-span-2 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col items-center justify-center hover:bg-yellow-100 transition shadow-sm">
                        <span className="text-3xl">🍞🥐</span>
                        <span className="font-bold text-slate-700 text-sm mt-1">Bakery</span>
                    </div>

                    {/* Aisle 4 - Center */}
                    <div className="col-span-2 row-span-1 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 transition shadow-sm">
                        <span className="text-3xl">🥤🍫</span>
                        <span className="font-bold text-slate-700 text-sm">Snacks & Drinks</span>
                    </div>

                    {/* Aisle 5 - Electronics */}
                    <div className="col-span-1 row-span-2 bg-slate-100 border border-slate-300 rounded-xl flex flex-col items-center justify-center hover:bg-slate-200 transition shadow-sm">
                        <span className="text-3xl">🎧📱</span>
                        <span className="font-bold text-slate-700 text-sm mt-1">Tech</span>
                    </div>

                    {/* EXIT ZONE - PAYMENT */}
                    <div className="col-span-4 row-span-1 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-between px-8 relative overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">💳</span>
                            <div className="text-left">
                                <span className="block font-bold text-red-800">PAYMENT & EXIT</span>
                                <span className="text-xs text-red-600">Scan QR Code to Leave</span>
                            </div>
                        </div>
                        <Link href="/customer/scan" className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 transition shadow-lg z-10">
                            Pay Now &rarr;
                        </Link>

                        {/* Decorative stripes */}
                        <div className="absolute top-0 right-0 w-32 h-full bg-repeating-linear-gradient-45 from-transparent to-red-100/50 opacity-50"></div>
                    </div>
                </div>

                {/* ANIMATED PATH OVERLAY (Approximation of walking path) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-50" style={{ padding: '2rem' }}>
                    <path
                        d="M 100 150 L 250 150 L 250 100 L 450 100 L 450 250 L 650 250 L 650 400 L 100 400"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeDasharray="10,10"
                        className="animate-dash"
                    />
                    <circle cx="100" cy="150" r="8" fill="#22c55e" className="animate-pulse" /> {/* Start */}
                    <circle cx="100" cy="400" r="8" fill="#ef4444" /> {/* End */}
                </svg>

                <style jsx>{`
            @keyframes dash {
                to {
                    stroke-dashoffset: -100;
                }
            }
            .animate-dash {
                animation: dash 5s linear infinite;
            }
        `}</style>

            </div>

            <div className="text-center mt-8 space-x-4">
                <Link href="/customer/scan" className="text-blue-600 font-bold hover:underline">
                    &larr; Back to Scanner
                </Link>
                <Link href="/" className="text-slate-500 font-bold hover:underline">
                    Home
                </Link>
            </div>
        </div>
    );
}
