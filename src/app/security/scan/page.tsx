'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import QRScanner from '@/components/QRScanner';
import { toast, Toaster } from 'react-hot-toast';

export default function SecurityScan() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
    const [message, setMessage] = useState('');
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());
    const [measuredWeight, setMeasuredWeight] = useState<string>('');

    // Lock to prevent multiple scans
    const isProcessing = useRef(false);

    // Handle Scan Logic based on state
    const handleScan = (decodedText: string) => {
        if (verificationStatus === 'idle') {
            // Mode 1: Order Scanning
            handleOrderScan(decodedText);
        } else if (verificationStatus === 'success' && orderDetails) {
            // Mode 2: Item Verification
            handleItemVerify(decodedText);
        }
    };

    const handleOrderScan = async (qrCodeString: string) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        setVerificationStatus('loading');
        setMessage('Verifying...');
        setOrderDetails(null);
        setVerifiedItems(new Set());
        setMeasuredWeight('');
        setScanResult(qrCodeString);

        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrCodeString })
            });
            const data = await res.json();

            // Handle Requires Payment (Cash)
            if (data.requiresPayment) {
                setPendingOrder(data.order);
                setVerificationStatus('idle'); // Keep background idle/loading
                setMessage('⚠️ Collecting Payment');
                toast('💰 Collect Cash: ₹' + data.order.totalAmount, { icon: '💰' });
                isProcessing.current = false; // Release lock so they can cancel/retry or pay
                return;
            }

            if (data.success) {
                setVerificationStatus('success');
                setMessage('✅ ACCESS GRANTED');
                setOrderDetails(data.order);
                toast.success('Order Verified! Now scan items to check contents.');
                // DO NOT release lock here if we want to stop re-scans of the same exit pass immediately.
                // The logical flow is: Scan Pass -> Success -> Verify Items -> Next Customer.
                // If we release lock here, scanning the same QR again might re-trigger "Access Granted" animation?
                // Actually, if status is 'success', handleScan calls handleItemVerify.
                // So we SHOULD release lock here, but `handleScan` logic routing handles it.
                // BUT, to prevent "double tap" effect on the exact same frame:
                // We keep it locked for a moment or rely on status change?
                // Let's release it so item scanning works.
                isProcessing.current = false;
            } else {
                setVerificationStatus('failed');
                setMessage(`❌ ACCESS DENIED: ${data.message || data.error}`);
                toast.error(data.message || 'Access Denied');
                isProcessing.current = false; // Release lock to allow retry
            }
        } catch (error) {
            setVerificationStatus('failed');
            setMessage('Server Error');
            toast.error('Network or Server Error');
            isProcessing.current = false; // Release lock
        }
    };

    const handleItemVerify = (barcode: string) => {
        if (!orderDetails || !orderDetails.items) return;

        // Check if barcode exists in order items
        // Note: Assuming item.product_id or we need to match barcode. 
        // The order details might not have the barcode directly if strictly from order table unless we joined it.
        // However, in our system, let's check standard logic.
        // If `items` structure has barcode, great. If not, we might need to match by name or fetch product.
        // For now, let's assume `items` contains the product info or we search by barcode if available.

        const foundItem = orderDetails.items.find((item: any) =>
            item.barcode === barcode || item.id === barcode // Check both just in case
        );

        if (foundItem) {
            setVerifiedItems(prev => {
                const newSet = new Set(prev);
                newSet.add(foundItem.id || foundItem.product_id || foundItem.name); // Use unique ID
                return newSet;
            });
            toast.success(`Verified: ${foundItem.name}`, { icon: '✅' });
        } else {
            toast.error(`EXTRA ITEM DETECTED: ${barcode}`, { duration: 4000, icon: '🚨' });
        }
    };

    const handleManualVerify = (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (!code) return;

        if (verificationStatus === 'idle') {
            handleOrderScan(code);
        } else if (verificationStatus === 'success') {
            handleItemVerify(code);
            setManualCode(''); // Clear after item check
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setManualCode('');
        setVerificationStatus('idle');
        setMessage('');
        setOrderDetails(null);
        setVerifiedItems(new Set());
        setMeasuredWeight('');
        isProcessing.current = false; // Unlock scanner
        // We don't need reload anymore, just state reset
    };

    // Weight Logic
    const expectedWeight = orderDetails?.totalExpectedWeight || 0;
    const actualWeight = parseFloat(measuredWeight) || 0;
    const weightDifference = Math.abs(expectedWeight - actualWeight);
    const isWeightMatch = expectedWeight > 0 ? (weightDifference <= (expectedWeight * 0.1) + 50) : true;

    // Progress
    const totalItems = orderDetails?.items?.length || 0;
    const verifiedCount = verifiedItems.size;
    const progress = totalItems > 0 ? (verifiedCount / totalItems) * 100 : 0;

    // Verify all items if weight matches
    const handleWeightVerify = () => {
        if (!orderDetails || !orderDetails.items) return;

        const allItemIds = new Set<string>();
        orderDetails.items.forEach((item: any) => {
            allItemIds.add(item.id || item.product_id || item.name);
        });

        setVerifiedItems(allItemIds);
        toast.success("All items verified by weight match!", { icon: '⚖️' });
    };

    const handleQuickVerify = () => {
        if (!orderDetails || !orderDetails.items) return;
        // Verify all items for Low Risk
        const allItemIds = new Set<string>();
        orderDetails.items.forEach((item: any) => {
            allItemIds.add(item.id || item.product_id || item.name);
        });
        setVerifiedItems(allItemIds);
        toast.success("Low Risk Order - Quick Verified!", { icon: '⚡' });
    }

    // Smart Risk Logic
    const getRiskLevel = (order: any) => {
        if (!order) return { level: 'UNKNOWN', color: 'gray', advice: 'Scan order first' };

        const totalAmount = parseFloat(order.total_amount || order.totalAmount || 0);
        const itemCount = order.items?.length || 0;

        // High Risk: Expensive order or random check (simulated randomness based on order ID last char)
        // In real app, randomness should be backend driven or strictly seeded
        const isRandomCheck = order.id && order.id.charCodeAt(order.id.length - 1) % 10 === 0; // 10% chance

        if (totalAmount >= 5000 || isRandomCheck) {
            return {
                level: 'HIGH',
                color: 'red',
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-200',
                advice: '⚠️ FULL SCAN REQUIRED due to high value or random check.'
            };
        }

        // Medium Risk
        if (totalAmount > 1000 || itemCount > 5) {
            // Find heaviest or most expensive item for spot check
            const spotCheckItem = order.items.reduce((prev: any, current: any) => (current.price > prev.price ? current : prev), order.items[0]);

            return {
                level: 'MEDIUM',
                color: 'yellow',
                bg: 'bg-yellow-50',
                text: 'text-yellow-800',
                border: 'border-yellow-200',
                advice: '👀 SPOT CHECK: Please verify \'' + (spotCheckItem?.name || 'Item') + '\' manually.',
                spotCheckId: spotCheckItem?.id || spotCheckItem?.product_id || spotCheckItem?.name
            };
        }

        // Low Risk
        return {
            level: 'LOW',
            color: 'green',
            bg: 'bg-green-50',
            text: 'text-green-800',
            border: 'border-green-200',
            advice: `⚡ TRUSTED: Count ${itemCount} items and Quick Verify.`
        };
    };

    const risk = orderDetails ? getRiskLevel(orderDetails) : null;

    const [pendingOrder, setPendingOrder] = useState<any>(null); // For cash payments

    const handleConfirmPayment = async () => {
        if (!pendingOrder) return;

        const toastId = toast.loading('Processing Payment...');
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrCodeString: scanResult,
                    confirmPayment: true
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Payment Confirmed!', { id: toastId });
                setVerificationStatus('success');
                setMessage('✅ PAYMENT RECEIVED & ACCESS GRANTED');
                setOrderDetails(data.order);
                setPendingOrder(null); // Clear pending
            } else {
                toast.error(data.message || 'Payment Confirmation Failed', { id: toastId });
            }
        } catch (error) {
            toast.error('Network Error', { id: toastId });
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center p-4 transition-colors duration-500 ${verificationStatus === 'success' ? 'bg-green-50' :
            verificationStatus === 'failed' ? 'bg-red-50' : 'bg-gray-100'
            }`}>
            <Toaster position="top-center" />

            {/* CASH PAYMENT MODAL */}
            {pendingOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce-in">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">💰</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Collect Cash Payment</h2>
                        <p className="text-gray-500 mb-6">Take cash from customer before granting exit.</p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-dashed border-gray-200">
                            <span className="block text-xs uppercase tracking-widest text-gray-500">Amount Due</span>
                            <span className="block text-5xl font-black text-green-600 mt-2">₹{pendingOrder.totalAmount}</span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setPendingOrder(null);
                                    setVerificationStatus('failed');
                                    setMessage('❌ Payment Cancelled');
                                }}
                                className="flex-1 py-3 text-red-500 font-bold hover:bg-red-50 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition transform hover:scale-105"
                            >
                                Confirm Received
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 md:pb-0">
                {/* LEFT COLUMN: SCANNER */}
                <div className="flex flex-col gap-6 order-1 md:order-none">
                    <div className="flex justify-between items-center w-full">
                        <h1 className="text-xl md:text-2xl font-bold text-indigo-900 flex items-center gap-2">
                            <span>🛡️</span> Checkpoint
                        </h1>
                        <Link href="/" className="text-xs md:text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded transition">
                            Logout
                        </Link>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <h2 className="text-xs md:text-sm font-bold text-gray-500 uppercase mb-4 text-center">
                            {verificationStatus === 'idle' ? 'Step 1: Scan Pass' : 'Step 2: Verify'}
                        </h2>

                        {/* THE SCANNER */}
                        <QRScanner
                            onScanSuccess={handleScan}
                            onScanFailure={() => { }}
                        />

                        <form onSubmit={handleManualVerify} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                placeholder={verificationStatus === 'idle' ? "Enter Order ID / Short Code" : "Verify Item Barcode"}
                                className="flex-1 border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">
                                {verificationStatus === 'idle' ? 'Check' : 'Verify'}
                            </button>
                        </form>
                    </div>

                    {verificationStatus !== 'idle' && (
                        <button
                            onClick={resetScanner}
                            className="bg-gray-800 text-white py-3 rounded-lg font-bold shadow hover:bg-black transition"
                        >
                            Reset / Next Customer
                        </button>
                    )}
                </div>

                {/* RIGHT COLUMN: RESULTS */}
                <div className="flex flex-col gap-6 order-2 md:order-none">
                    {/* IDLE STATE INSTRUCTIONS */}
                    {verificationStatus === 'idle' && (
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md h-full flex flex-col items-center justify-center text-center text-gray-500 min-h-[200px]">
                            <div className="text-4xl md:text-6xl mb-4">🛂</div>
                            <p className="text-lg md:text-xl font-medium">Ready to Scan</p>
                            <p className="text-xs md:text-sm mt-2">Scan customer's pass.</p>
                        </div>
                    )}

                    {/* LOADING */}
                    {verificationStatus === 'loading' && (
                        <div className="bg-white p-8 rounded-xl shadow-md h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-900 border-t-transparent"></div>
                        </div>
                    )}

                    {/* SUCCESS / FAILED RESULT */}
                    {(verificationStatus === 'success' || verificationStatus === 'failed') && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-600 animate-fadeIn">
                            <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${verificationStatus === 'success' ? 'bg-green-50 p-4 rounded-lg' : 'bg-red-50 p-4 rounded-lg'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${verificationStatus === 'success' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                    {verificationStatus === 'success' ? '✓' : '✖'}
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                        {verificationStatus === 'success' ? 'Access Granted' : 'Access Denied'}
                                    </h2>
                                    <p className="text-sm font-medium opacity-80">{message}</p>
                                </div>
                            </div>

                            {orderDetails && (
                                <div className="space-y-6">
                                    {/* Risk Badge UI */}
                                    <div className={`p-4 rounded-lg mb-6 border-2 flex items-center justify-between ${risk?.bg} ${risk?.border}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-black text-sm px-2 py-0.5 rounded bg-white/50 border ${risk?.border} ${risk?.text}`}>
                                                    {risk?.level} RISK
                                                </span>
                                                <h2 className={`font-bold text-lg ${risk?.text}`}>Security Advice</h2>
                                            </div>
                                            <p className={`text-sm font-medium ${risk?.text}`}>
                                                {risk?.advice}
                                            </p>
                                        </div>
                                        {risk?.level === 'LOW' && verifiedCount < totalItems && (
                                            <button
                                                onClick={handleQuickVerify}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 active:scale-95 transition-transform animate-pulse"
                                            >
                                                ⚡ Quick Verify
                                            </button>
                                        )}
                                    </div>

                                    {/* Verification Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span>Product Check</span>
                                            <span className={progress === 100 ? 'text-green-600' : 'text-orange-500'}>
                                                {verifiedCount}/{totalItems} Verified
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-orange-400'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <span className="block text-gray-500 text-xs">Order ID</span>
                                            <span className="font-mono font-bold">{orderDetails.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-gray-500 text-xs">Total Amount</span>
                                            <span className="font-bold text-green-600 text-lg">₹{orderDetails.totalAmount}</span>
                                        </div>
                                    </div>

                                    {/* Item List */}
                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                        {orderDetails.items?.map((item: any, i: number) => {
                                            const itemId = item.id || item.product_id || item.name;
                                            const isVerified = verifiedItems.has(itemId);
                                            const isSpotCheck = risk?.level === 'MEDIUM' && risk?.spotCheckId === itemId;

                                            return (
                                                <div
                                                    key={i}
                                                    className={`flex justify-between items-center p-3 rounded border transition-colors ${isVerified ? 'bg-green-50 border-green-200' :
                                                        isSpotCheck ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200' :
                                                            'bg-white border-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{isVerified ? '✅' : '📦'}</span>
                                                        <div>
                                                            <p className={`font-medium ${isVerified ? 'text-green-800' : 'text-gray-800'}`}>{item.name}</p>
                                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    {isVerified && <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">OK</span>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Weight Check */}
                                    <div className="pt-4 border-t">
                                        <h3 className="font-bold text-gray-700 mb-2">Weight Check (Optional)</h3>
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500">Expected</label>
                                                <div className="font-bold text-gray-800">{expectedWeight}g</div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500">Actual</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className={`w-full border rounded p-1 font-bold ${measuredWeight && !isWeightMatch ? 'text-red-600 border-red-300 bg-red-50' : ''
                                                        }`}
                                                    value={measuredWeight}
                                                    onChange={e => setMeasuredWeight(e.target.value)}
                                                />
                                            </div>
                                            {isWeightMatch && parseFloat(measuredWeight) > 0 && verifiedCount < totalItems && (
                                                <button
                                                    onClick={handleWeightVerify}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold shadow hover:bg-green-700 animate-pulse"
                                                >
                                                    Verify All (Weight Match)
                                                </button>
                                            )}
                                        </div>
                                        {measuredWeight && !isWeightMatch && (
                                            <p className="text-xs text-red-600 font-bold mt-1">⚠️ Weight mismatch detected!</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
