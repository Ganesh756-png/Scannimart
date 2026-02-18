'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// NOTE: Using supabase-js directly for client side if the project uses it, 
// checking previous files, they used '@/lib/supabase'.
import { supabase } from '@/lib/supabase';

export default function InvoicePage() {
    const params = useParams();
    const id = params?.id as string;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div></div>;

    if (!order) return <div className="min-h-screen flex items-center justify-center text-red-500">Order not found.</div>;

    // Formatting currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center text-gray-800">
            <div
                id="invoice-content"
                className="w-full max-w-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0"
                style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    borderRadius: '0.5rem'
                }}
            >
                {/* Header */}
                <div
                    className="p-8 mb-4 print:bg-white print:text-black print:border-b-2 print:border-black"
                    style={{ backgroundColor: '#312e81', color: '#ffffff' }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                            <p className="text-sm" style={{ opacity: 0.8 }}>Smart Shopping System</p>
                            <p className="text-sm" style={{ opacity: 0.8 }}>123 Tech Park, Innovation City</p>
                            <p className="text-sm" style={{ opacity: 0.8 }}>India, 400001</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-xl font-bold mb-1">#{order.readable_id || order.id.slice(0, 8)}</p>
                            <p className="text-sm" style={{ opacity: 0.8 }}>{new Date(order.created_at).toLocaleDateString()}</p>
                            <p className="text-sm" style={{ opacity: 0.8 }}>{new Date(order.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Customer / Payment Info */}
                    <div className="flex justify-between mb-8 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Payment Method</h3>
                            <p className="font-bold" style={{ color: '#1f2937' }}>{order.payment_method || 'UPI'}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Order Status</h3>
                            <span
                                className="inline-block px-2 py-1 rounded text-xs font-bold"
                                style={{
                                    backgroundColor: order.status === 'verified' ? '#dcfce7' : order.status === 'pending' ? '#fef9c3' : '#f3f4f6',
                                    color: order.status === 'verified' ? '#166534' : order.status === 'pending' ? '#854d0e' : '#1f2937'
                                }}
                            >
                                {order.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="text-left" style={{ borderBottom: '2px solid #f3f4f6' }}>
                                <th className="py-3 font-bold text-sm uppercase" style={{ color: '#4b5563' }}>Item</th>
                                <th className="py-3 font-bold text-sm uppercase text-center" style={{ color: '#4b5563' }}>Qty</th>
                                <th className="py-3 font-bold text-sm uppercase text-right" style={{ color: '#4b5563' }}>Price</th>
                                <th className="py-3 font-bold text-sm uppercase text-right" style={{ color: '#4b5563' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items && order.items.map((item: any, index: number) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td className="py-4 font-medium" style={{ color: '#1f2937' }}>{item.name}</td>
                                    <td className="py-4 text-center" style={{ color: '#4b5563' }}>{item.quantity}</td>
                                    <td className="py-4 text-right" style={{ color: '#4b5563' }}>₹{item.price}</td>
                                    <td className="py-4 text-right font-bold" style={{ color: '#1f2937' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex flex-col items-end pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-xl font-black pt-4 mt-2" style={{ color: '#312e81', borderTop: '2px solid #e0e7ff' }}>
                                <span>TOTAL PAID</span>
                                <span>{formatCurrency(order.total_amount || order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Buttons */}
                <div
                    data-html2canvas-ignore="true"
                    className="p-6 flex justify-between items-center print:hidden"
                    style={{ backgroundColor: '#f9fafb' }}
                >
                    <Link href="/" className="text-sm font-bold flex items-center gap-1 transition-colors" style={{ color: '#6b7280' }}>
                        <span>←</span> Back
                    </Link>
                    <div className="flex gap-4">
                        <button
                            onClick={async () => {
                                const element = document.getElementById('invoice-content');
                                if (!element) {
                                    alert('Element not found');
                                    return;
                                }

                                const toast = (await import('react-hot-toast')).default;
                                const loadingId = toast.loading('Generating PDF...');

                                try {
                                    // Dynamic import to avoid SSR issues
                                    // @ts-ignore
                                    const html2pdf = (await import('html2pdf.js')).default;

                                    const opt = {
                                        margin: 0,
                                        filename: `Invoice_${order.id.slice(0, 8)}.pdf`,
                                        image: { type: 'jpeg' as const, quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
                                    };

                                    await html2pdf().set(opt).from(element).save();
                                    toast.success('Downloaded!', { id: loadingId });
                                } catch (error: any) {
                                    console.error("PDF Error:", error);
                                    toast.error(`PDF Error: ${error.message || error}`, { id: loadingId });
                                }
                            }}
                            className="text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transform active:scale-95 transition"
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transform active:scale-95 transition"
                            style={{ backgroundColor: '#4f46e5' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                    </div>
                </div>

                {/* Print Only Footer */}
                <div className="hidden print:block text-center text-xs mt-12 mb-4" style={{ color: '#9ca3af' }}>
                    <p className="italic">Thank you for shopping with Smart Shopping System!</p>
                    <p className="mt-1">For support, contact support@smartshopping.com</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
