'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { Camera, RefreshCw, ScanLine, ShieldCheck, ChevronLeft, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecurityTrolleyScanPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // AI Results
    const [detectedItems, setDetectedItems] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Order Data (passed via query params usually, but we'll simulate fetching it for now or assume it's stored in session/local state from the previous screen)
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [fraudFlags, setFraudFlags] = useState<any[]>([]);

    useEffect(() => {
        // In a real app, we'd pass the order ID via URL and fetch it here.
        // For this implementation, we will check sessionStorage where the main security page can stash it.
        const storedOrder = sessionStorage.getItem('security_current_order');
        if (storedOrder) {
            setOrderDetails(JSON.parse(storedOrder));
        } else {
            toast.error("No active order selected for verification");
            // router.push('/security/scan'); // Uncomment to enforce order selection first
        }

        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera for AI Verification");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageDataUrl);
                stopCamera();
                analyzeImage(imageDataUrl);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setDetectedItems([]);
        setFraudFlags([]);
        setShowResults(false);
        startCamera();
    };

    const analyzeImage = async (base64Image: string) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/vision/trolley', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Image })
            });

            const data = await res.json();
            if (data.success) {
                setDetectedItems(data.items);
                compareWithOrder(data.items);
                setShowResults(true);
            } else {
                toast.error(data.error || "AI Analysis failed");
                retakePhoto();
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error during analysis.");
            retakePhoto();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const compareWithOrder = (aiItems: any[]) => {
        if (!orderDetails || !orderDetails.items) return;

        const flags: any[] = [];
        const orderItemsMap = new Map();

        // Count items in the official digital bill
        orderDetails.items.forEach((item: any) => {
            const key = item.barcode || item.id || item.name;
            orderItemsMap.set(key, (orderItemsMap.get(key) || 0) + item.quantity);
        });

        // Check AI items against the bill
        aiItems.forEach(aiItem => {
            const key = aiItem.barcode;
            const billedQty = orderItemsMap.get(key) || 0;
            const detectedQty = aiItem.detectedQuantity;

            if (billedQty === 0) {
                // Item completely missing from bill = FRAUD
                flags.push({
                    type: 'MISSING_FROM_BILL',
                    name: aiItem.name,
                    detected: detectedQty,
                    billed: 0,
                    severity: 'HIGH'
                });
            } else if (detectedQty > billedQty) {
                // Customer took more than they paid for = FRAUD
                flags.push({
                    type: 'QUANTITY_MISMATCH',
                    name: aiItem.name,
                    detected: detectedQty,
                    billed: billedQty,
                    severity: 'HIGH'
                });
            }

            // Note: If billedQty > detectedQty, it might just mean the AI missed something hidden in the trolley, not necessarily fraud on the customer's part (loss for customer, not store). We ignore this for now to reduce false positives.
        });

        setFraudFlags(flags);

        if (flags.length > 0) {
            toast.error('FRAUD DETECTED: Trolley items do not match Bill!', { icon: '🚨', duration: 5000 });
        } else {
            toast.success('VERIFIED: All detected items are on the bill.', { icon: '✅', duration: 4000 });
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col items-center selection:bg-red-500/30">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="w-full bg-indigo-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <Link href="/security/scan" className="text-indigo-200 hover:text-white transition p-2 rounded-lg bg-indigo-800/50">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                    <h1 className="text-xl font-bold tracking-wide">
                        AI Fraud Detection
                    </h1>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Active Order Banner */}
            {orderDetails && (
                <div className="w-full bg-white border-b px-4 py-3 shadow-sm flex justify-between items-center text-sm">
                    <div>
                        <span className="text-neutral-500 font-medium">Verifying Bill:</span>
                        <span className="ml-2 font-mono font-bold text-indigo-700">{orderDetails.id.slice(0, 8)}</span>
                    </div>
                    <div>
                        <span className="font-bold">{orderDetails.items.length} Items</span>
                        <span className="mx-2 text-neutral-300">|</span>
                        <span className="font-bold text-green-600">₹{orderDetails.totalAmount}</span>
                    </div>
                </div>
            )}

            <main className="flex-1 w-full max-w-md flex flex-col relative pb-8">

                {/* Viewfinder Area */}
                <div className="relative w-full aspect-square bg-black overflow-hidden shadow-inner">
                    {!capturedImage && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}
                    {capturedImage && (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover filter brightness-75"
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Overlay Animation */}
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                            >
                                <ScanLine className="w-16 h-16 text-indigo-400 animate-pulse mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">AI Auditing Trolley...</h3>
                                <p className="text-indigo-200 text-sm">Matching against digital bill...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scanner Framing Guides */}
                    {!capturedImage && !isAnalyzing && (
                        <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
                            <div className="flex justify-between">
                                <div className="w-12 h-12 border-t-4 border-l-4 border-red-500 opacity-80" />
                                <div className="w-12 h-12 border-t-4 border-r-4 border-red-500 opacity-80" />
                            </div>
                            <div className="text-center">
                                <span className="bg-black/60 text-white backdrop-blur-md px-4 py-2 rounded text-sm font-bold tracking-widest uppercase border border-white/20">
                                    Aim at Trolley Contents
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-12 h-12 border-b-4 border-l-4 border-red-500 opacity-80" />
                                <div className="w-12 h-12 border-b-4 border-r-4 border-red-500 opacity-80" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Results / Controls Area */}
                <div className="px-4 py-6 flex-1 flex flex-col">
                    {!capturedImage ? (
                        <div className="flex-1 flex flex-col items-center justify-start pt-8">
                            <button
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center focus:outline-none hover:bg-red-200 transition-colors shadow-lg active:scale-95 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-red-500 group-hover:bg-red-600 transition-colors shadow-inner flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </button>
                            <p className="text-center text-neutral-500 text-sm font-medium mt-6">
                                Tap to capture & analyze trolley contents
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {showResults ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {/* FRAUD BANNER */}
                                    {fraudFlags.length > 0 ? (
                                        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-4 shadow-sm animate-bounce-in">
                                            <div className="flex items-center gap-3 mb-2 text-red-700">
                                                <AlertTriangle className="w-6 h-6" />
                                                <h3 className="font-black text-lg uppercase tracking-wide">Mismatch Detected</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {fraudFlags.map((flag, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded border border-red-200 text-sm flex justify-between items-center">
                                                        <span className="font-bold text-neutral-800">{flag.name}</span>
                                                        <div className="text-right">
                                                            <span className="text-red-600 font-bold block">Trolley: {flag.detected}</span>
                                                            <span className="text-green-600 font-medium block text-xs">Billed: {flag.billed}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-4 shadow-sm flex items-center gap-4 animate-fade-in-up">
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-green-800 text-lg uppercase">All Clear</h3>
                                                <p className="text-green-600 text-sm font-medium">Items match the digital bill.</p>
                                            </div>
                                        </div>
                                    )}

                                    <h4 className="font-bold text-neutral-700 mb-3 px-1">AI Raw Detection ({detectedItems.length})</h4>
                                    <div className="flex-1 overflow-y-auto space-y-2 pb-20 custom-scrollbar max-h-48">
                                        {detectedItems.length === 0 && (
                                            <div className="text-center text-neutral-400 p-4 border border-dashed rounded-lg bg-neutral-50 mb-2">
                                                No specific products recognized.
                                            </div>
                                        )}
                                        {detectedItems.map((item, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg flex items-center justify-between border shadow-sm">
                                                <span className="font-medium text-neutral-800">{item.name}</span>
                                                <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded text-xs font-bold">Qty: {item.detectedQuantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={retakePhoto}
                                            className="flex-1 py-3 rounded-xl bg-white border-2 border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 transition shadow-sm flex justify-center items-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" /> Retake
                                        </button>
                                        <Link
                                            href="/security/scan"
                                            className="flex-1 py-3 rounded-xl bg-indigo-900 border-2 border-indigo-900 text-white font-bold hover:bg-indigo-800 transition shadow-sm text-center"
                                        >
                                            Done
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : null}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

