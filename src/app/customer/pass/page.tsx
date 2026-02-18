'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PassPage() {
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const savedOrder = localStorage.getItem('lastOrder');
        if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder);
            setOrder(parsedOrder);

            // Fetch latest status from DB to ensure it's not stale
            // (In case user refreshed page after verification or missed the event)
            if (parsedOrder.id) {
                supabase
                    .from('orders')
                    .select('status')
                    .eq('id', parsedOrder.id)
                    .single()
                    .then(({ data, error }) => {
                        if (data && data.status) {
                            console.log("Fetched fresh status:", data.status);
                            setOrder((prev: any) => ({ ...prev, status: data.status }));

                            // Update local storage
                            const updated = { ...parsedOrder, status: data.status };
                            localStorage.setItem('lastOrder', JSON.stringify(updated));
                        }
                    });
            }
        }
    }, []);

    // Listen for real-time status updates
    useEffect(() => {
        if (!order?.id) return;

        console.log("Subscribing to order updates for:", order.id);

        const channel = supabase
            .channel(`order-${order.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${order.id}`
                },
                (payload) => {
                    console.log("Order update received:", payload);
                    if (payload.new && payload.new.status) {
                        setOrder((prev: any) => ({ ...prev, status: payload.new.status }));
                        // Update local storage to keep it in sync
                        const currentStored = localStorage.getItem('lastOrder');
                        if (currentStored) {
                            const parsed = JSON.parse(currentStored);
                            parsed.status = payload.new.status;
                            localStorage.setItem('lastOrder', JSON.stringify(parsed));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [order?.id]);

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <p>No active pass found. <Link href="/customer/scan" className="text-blue-500">Go scan items.</Link></p>
            </div>
        );
    }

    if (order.status === 'verified') {
        return (
            <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center p-8 text-center text-white animate-fade-in">
                <div className="bg-white rounded-full p-6 mb-8 shadow-lg animate-bounce-slow">
                    <svg className="w-24 h-24 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold mb-4 drop-shadow-md">Access Granted</h1>
                <p className="text-xl mb-12 opacity-90">Thank you for shopping with us!</p>

                <Link
                    href="/customer/scan"
                    onClick={() => localStorage.removeItem('lastOrder')}
                    className="bg-white text-green-700 px-8 py-3 rounded-full font-bold shadow-xl hover:bg-gray-100 transition-transform transform active:scale-95"
                >
                    Start New Shopping
                </Link>

                <style jsx>{`
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(-5%); }
                        50% { transform: translateY(5%); }
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 2s infinite ease-in-out;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
            <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-4 relative ${order.status === 'pending_payment' ? 'border-yellow-500' : 'border-green-500'}`}>
                <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full font-bold shadow-md text-white ${order.status === 'pending_payment' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {order.status === 'pending_payment' ? 'PAY AT COUNTER' : 'PAID & VERIFIED'}
                </div>

                {/* Short ID Display */}
                {order.readable_id && (
                    <div className="mb-4 bg-gray-100 rounded-lg p-2 border-2 border-dashed border-gray-300">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Monitor/Security Code</p>
                        <p className="text-3xl font-black tracking-widest text-indigo-900">{order.readable_id}</p>
                    </div>
                )}

                <div className="mb-6">
                    <QRCodeSVG value={order.id} size={200} className="mx-auto" />
                    <p className="mt-4 text-xs text-gray-400 font-mono">{order.id}</p>
                    <p className="text-xs text-gray-400 font-mono">Status: {order.status}</p>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-600">
                        Show this QR code to the security guard at the exit.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-indigo-600 font-bold hover:underline"
                    >
                        🔄 Check Status / Refresh
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 w-full">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500">Total Amount</span>
                        <span className="text-2xl font-black text-gray-800">₹{order.total_amount || order.totalAmount}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {order.items?.length || 0} Items
                    </div>
                </div>
            </div>
        </div>
    );
}
