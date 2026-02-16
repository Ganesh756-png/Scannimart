'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast, Toaster } from 'react-hot-toast';

export default function SecurityScan() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
    const [message, setMessage] = useState('');
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [measuredWeight, setMeasuredWeight] = useState<string>('');
    const [lastScannedDebug, setLastScannedDebug] = useState<string>('');

    useEffect(() => {
        if (verificationStatus !== 'idle') return;

        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }, // Smaller box for mobile compatibility
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: { ideal: "environment" } // Prefer back camera
                    }
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText: string) {
                // Formatting Fix: Trim whitespace/newlines often added by scanners
                const cleanText = decodedText.trim();

                if (scanResult !== cleanText && verificationStatus !== 'loading') {
                    console.log("Scanner Scanned (Raw):", decodedText);
                    console.log("Scanner Scanned (Clean):", cleanText);
                    setLastScannedDebug(cleanText); // Show clean text on UI
                    toast.success(`Scanned: ${cleanText}`);
                    setScanResult(cleanText);
                    verifyOrder(cleanText);
                    scanner.clear();
                }
            }

            function onScanFailure(error: any) {
                // handle error silently
            }

            return () => {
                scanner.clear().catch(error => console.warn("Scanner cleanup:", error));
            };
        }, 300); // Slight delay for DOM

        return () => clearTimeout(timer);
    }, [verificationStatus]);

    const verifyOrder = async (qrCodeString: string) => {
        setVerificationStatus('loading');
        setMessage('Verifying...');
        setOrderDetails(null);
        setMeasuredWeight('');

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
            } else {
                setVerificationStatus('failed');
                setMessage(`❌ ACCESS DENIED: ${data.message || data.error}`);
            }
        } catch (error) {
            setVerificationStatus('failed');
            setMessage('Server Error');
        }
    };

    const handleManualVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            verifyOrder(manualCode.trim());
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setManualCode('');
        setVerificationStatus('idle');
        setMessage('');
        setOrderDetails(null);
        setMeasuredWeight('');
        setLastScannedDebug('');
        window.location.reload(); // Simplest way to restart scanner cleanly
    };

    // Weight Logic
    const expectedWeight = orderDetails?.totalExpectedWeight || 0;
    const actualWeight = parseFloat(measuredWeight) || 0;
    const weightDifference = Math.abs(expectedWeight - actualWeight);
    const isWeightMatch = expectedWeight > 0 ? (weightDifference <= (expectedWeight * 0.1) + 50) : true; // 10% tolerance + 50g buffer

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 ${verificationStatus === 'success' ? 'bg-green-50' :
            verificationStatus === 'failed' ? 'bg-red-50' : 'bg-gray-100'
            }`}>
            <Toaster position="top-right" />
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-indigo-900 text-center">Security Checkpoint</h1>

            <div className="bg-white p-4 md:p-8 rounded-xl shadow-xl w-full max-w-md mx-auto grid grid-cols-1 gap-6">

                {/* SCANNER SECTION */}
                {verificationStatus === 'idle' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2 font-medium">Scan Customer Exit Pass</p>
                            <div id="reader" className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300"></div>
                            {lastScannedDebug && (
                                <p className="mt-2 text-xs font-mono text-gray-400">Last Scanned: {lastScannedDebug}</p>
                            )}
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or enter manually</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <form onSubmit={handleManualVerify} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Enter Short Code / Order ID"
                                className="flex-1 border-2 border-gray-300 p-4 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-lg"
                                style={{ fontSize: '16px' }} // Prevent iOS zoom
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-indigo-700 active:scale-95 transition-transform"
                            >
                                Verify
                            </button>
                        </form>
                    </div>
                )}

                {/* LOADING */}
                {verificationStatus === 'loading' && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-900 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-xl font-semibold text-gray-700">Verifying Order...</p>
                    </div>
                )}

                {/* RESULT SECTION */}
                {(verificationStatus === 'success' || verificationStatus === 'failed') && (
                    <div className="text-center animate-fadeIn">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${verificationStatus === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <span className="text-5xl">{verificationStatus === 'success' ? '✓' : '✖'}</span>
                        </div>

                        <h2 className={`text-3xl font-bold mb-2 ${verificationStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {message}
                        </h2>

                        {orderDetails && (
                            <div className="mt-8 text-left space-y-6">
                                {/* ORDER SUMMARY */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Items</div>
                                            <div className="text-2xl font-bold text-gray-800">{orderDetails.items?.length || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Total</div>
                                            <div className="text-2xl font-bold text-green-600">₹{orderDetails.totalAmount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Order ID</div>
                                            <div className="text-xs font-mono bg-white p-1 rounded border overflow-hidden text-ellipsis">
                                                {orderDetails.id.substring(0, 8)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* WEIGHT VERIFICATION */}
                                    <div className="bg-white p-4 rounded-lg border-2 border-indigo-100">
                                        <h3 className="font-bold text-indigo-900 mb-4 flex items-center">
                                            <span className="mr-2">⚖️</span> Weight Check
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4 items-end">
                                            <div>
                                                <label className="text-sm text-gray-500 block mb-1">Expected Weight</label>
                                                <div className="text-xl font-bold text-gray-700">
                                                    {expectedWeight > 0 ? `${expectedWeight}g` : 'N/A'}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-500 block mb-1">Scale Reading (g)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className={`w-full p-2 border-2 rounded-lg text-lg font-bold outline-none focus:ring-2 ${!measuredWeight ? 'border-gray-300' :
                                                        isWeightMatch ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                                                        }`}
                                                    value={measuredWeight}
                                                    onChange={(e) => setMeasuredWeight(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {measuredWeight && (
                                            <div className={`mt-3 text-center font-bold px-3 py-1 rounded ${isWeightMatch ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                                                {isWeightMatch ? '✅ WEIGHT MATCH' : '⚠️ POTENTIAL FRAUD (Weight Mismatch)'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ITEM LIST */}
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-500 uppercase">Contents</p>
                                    <div className="max-h-60 overflow-y-auto border rounded-xl bg-white shadow-inner">
                                        {orderDetails.items?.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50">
                                                <span className="font-medium">{item.name}</span>
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={resetScanner}
                            className="mt-8 w-full bg-indigo-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Scan Next Customer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
