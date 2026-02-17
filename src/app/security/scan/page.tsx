'use client';

import { useState, useEffect, useMemo } from 'react';
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

            if (data.success) {
                setVerificationStatus('success');
                setMessage('✅ ACCESS GRANTED');
                setOrderDetails(data.order);
                toast.success('Order Verified! Now scan items to check contents.');
            } else {
                setVerificationStatus('failed');
                setMessage(`❌ ACCESS DENIED: ${data.message || data.error}`);
                toast.error(data.message || 'Access Denied');
            }
        } catch (error) {
            setVerificationStatus('failed');
            setMessage('Server Error');
            toast.error('Network or Server Error');
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

    return (
        <div className={`min-h-screen flex flex-col items-center p-4 transition-colors duration-500 ${verificationStatus === 'success' ? 'bg-green-50' :
                verificationStatus === 'failed' ? 'bg-red-50' : 'bg-gray-100'
            }`}>
            <Toaster position="top-center" />

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LEFT COLUMN: SCANNER */}
                <div className="flex flex-col gap-6">
                    <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                        <span>🛡️</span> Security Checkpoint
                    </h1>

                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 text-center">
                            {verificationStatus === 'idle' ? 'Step 1: Scan Exit Pass' : 'Step 2: Verify Items'}
                        </h2>

                        {/* THE SCANNER */}
                        {/* We always keep scanner mounted but maybe control visibility or feedback */}
                        <QRScanner
                            onScanSuccess={handleScan}
                            onScanFailure={() => { }}
                        />

                        <form onSubmit={handleManualVerify} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                placeholder={verificationStatus === 'idle' ? "Enter Order ID" : "Enter Item Barcode"}
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
                <div className="flex flex-col gap-6">

                    {/* IDLE STATE INSTRUCTIONS */}
                    {verificationStatus === 'idle' && (
                        <div className="bg-white p-8 rounded-xl shadow-md h-full flex flex-col items-center justify-center text-center text-gray-500">
                            <div className="text-6xl mb-4">🛂</div>
                            <p className="text-xl font-medium">Ready to Scan</p>
                            <p className="text-sm mt-2">Please scan the customer's QR code on their exit pass or mobile.</p>
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
                                            const isVerified = verifiedItems.has(item.id || item.product_id || item.name);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`flex justify-between items-center p-3 rounded border transition-colors ${isVerified ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
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
                                        <div className="flex gap-4">
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
