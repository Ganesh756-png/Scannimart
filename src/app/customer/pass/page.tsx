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
            setOrder(JSON.parse(savedOrder));
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

                <h1 className="text-2xl font-bold mt-8 text-gray-800">Exit Pass</h1>
                <p className="text-gray-500 text-sm mb-6">
                    {order.status === 'pending_payment'
                        ? 'Show this to security and pay cash.'
                        : 'Show this to security at the exit gate.'}
                </p>

                <div className="bg-gray-100 p-4 rounded-xl inline-block mb-6">
                    <QRCodeSVG value={order.readable_id || order.id?.substring(0, 6).toUpperCase() || order.qrCodeString} size={200} />
                </div>

                <p className="font-mono text-xs text-gray-400 mb-4">{order.readable_id || order.id?.substring(0, 6).toUpperCase()}</p>

                <div className="text-left bg-gray-50 p-4 rounded-lg text-sm space-y-3">
                    <div className="text-center mb-4">
                        <span className="block text-gray-500 text-xs uppercase tracking-wide">Security Code</span>
                        <span className="block text-4xl font-black text-indigo-900 tracking-widest">{order.readable_id || order.id?.substring(0, 6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Order Ref:</span>
                        <span className="font-mono text-xs">{order.id?.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className={`font-bold ${order.status === 'pending_payment' ? 'text-yellow-600' : 'text-green-700'}`}>₹{order.total_amount || order.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-semibold">{order.items?.length || 0}</span>
                    </div>
                    {order.status === 'pending_payment' && (
                        <div className="mt-2 text-center text-xs text-red-500 font-bold bg-red-50 p-2 rounded">
                            ⚠️ Payment Pending
                        </div>
                    )}
                </div>

                <Link href="/" className="block mt-8 text-gray-400 text-sm hover:text-gray-600">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
