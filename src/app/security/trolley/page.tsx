'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { 
    Camera, 
    RefreshCw, 
    ScanLine, 
    ShieldCheck, 
    ChevronLeft, 
    AlertTriangle, 
    Upload, 
    Check, 
    X, 
    FileImage,
    HelpCircle,
    CheckCircle,
    UserCheck,
    Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSuccessChime, playDiscrepancyBuzzer } from '@/utils/audio';
import ExitGate from '@/components/ExitGate';

export default function SecurityTrolleyScanPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // AI Results
    const [detectedItems, setDetectedItems] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Order Data from previous scan (sessionStorage)
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [fraudFlags, setFraudFlags] = useState<any[]>([]);
    const [isProcessingApproval, setIsProcessingApproval] = useState(false);
    const [isAccessGranted, setIsAccessGranted] = useState(false);

    // Demo Selection State
    const [chosenPreset, setChosenPreset] = useState('');

    useEffect(() => {
        const storedOrder = sessionStorage.getItem('security_current_order');
        if (storedOrder) {
            setOrderDetails(JSON.parse(storedOrder));
        } else {
            toast.error("No active order selected for verification");
        }

        // Try to start camera, if it fails, the user can use manual uploads or presets.
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setIsCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.warn("Could not start camera, falling back to upload/presets:", err);
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            const maxDim = 800;
            const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);

            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setCapturedImage(imageDataUrl);
                stopCamera();
                analyzeImage(imageDataUrl);
            }
        }
    };

    // Handle Uploaded File
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setCapturedImage(base64);
                stopCamera();
                analyzeImage(base64, chosenPreset);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Demo Preset selection directly
    const handlePresetChange = (preset: string) => {
        if (!preset) return;
        setChosenPreset(preset);
        
        // Mock a placeholder image representational of the preset
        const mockImage = `data:image/jpeg;base64,MOCK_IMAGE_DATA_FOR_PRESET_${preset.toUpperCase()}`;
        setCapturedImage(mockImage);
        stopCamera();
        analyzeImage(mockImage, preset);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setDetectedItems([]);
        setFraudFlags([]);
        setShowResults(false);
        setChosenPreset('');
        startCamera();
    };

    const analyzeImage = async (base64Image: string, preset?: string) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/vision/trolley', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imageBase64: base64Image,
                    demoPreset: preset || undefined
                })
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

    // Structure list of all products (billed & detected) to render side-by-side
    const [comparisonData, setComparisonData] = useState<any[]>([]);

    const compareWithOrder = (aiItems: any[]) => {
        if (!orderDetails || !orderDetails.items) return;

        const flags: any[] = [];
        const comparisonList: any[] = [];

        // Map order items by product_id / barcode
        const orderItemsMap = new Map();
        orderDetails.items.forEach((item: any) => {
            const key = item.product_id || item.id;
            orderItemsMap.set(key, item);
        });

        // Map AI items by product_id
        const aiItemsMap = new Map();
        aiItems.forEach((item: any) => {
            aiItemsMap.set(item.id, item);
        });

        // 1. Process all official order items
        orderDetails.items.forEach((billedItem: any) => {
            const pid = billedItem.product_id || billedItem.id;
            const matchedAIItem = aiItemsMap.get(pid);

            const detectedQty = matchedAIItem ? matchedAIItem.detectedQuantity : 0;
            const billedQty = billedItem.quantity || 1;

            let status = 'MATCH';
            if (detectedQty === 0) {
                status = 'MISSING_IN_SCAN';
            } else if (detectedQty > billedQty) {
                status = 'QUANTITY_MISMATCH';
                flags.push({
                    type: 'QUANTITY_MISMATCH',
                    name: billedItem.name,
                    detected: detectedQty,
                    billed: billedQty
                });
            } else if (detectedQty < billedQty) {
                status = 'UNDER_QTY';
            }

            comparisonList.push({
                id: pid,
                name: billedItem.name,
                billedQty: billedQty,
                detectedQty: detectedQty,
                price: billedItem.price,
                status: status
            });
        });

        // 2. Find unbilled items that the AI detected but customer didn't pay for
        aiItems.forEach((aiItem: any) => {
            const pid = aiItem.id;
            const matchedBilledItem = orderItemsMap.get(pid);

            if (!matchedBilledItem) {
                // Completely unbilled item!
                comparisonList.push({
                    id: pid,
                    name: aiItem.name,
                    billedQty: 0,
                    detectedQty: aiItem.detectedQuantity,
                    price: aiItem.price,
                    status: 'UNBILLED'
                });

                flags.push({
                    type: 'UNBILLED',
                    name: aiItem.name,
                    detected: aiItem.detectedQuantity,
                    billed: 0
                });
            }
        });

        setComparisonData(comparisonList);
        setFraudFlags(flags);

        if (flags.length > 0) {
            playDiscrepancyBuzzer();
            toast.error('DISCREPANCY DETECTED: Trolley contents do not match digital bill!', { icon: '🚨', duration: 4000 });
            
            // Log discrepancy to DB
            flags.forEach(flag => {
                fetch('/api/analytics/track-discrepancy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: orderDetails.id,
                        discrepancyScore: 100,
                        notes: `${flag.type}: ${flag.name} (Billed: ${flag.billed}, Scanned: ${flag.detected})`
                    })
                }).catch(e => console.error("Track discrepancy error:", e));
            });
        } else {
            playSuccessChime();
            toast.success('VERIFIED: Trolley items match the digital bill.', { icon: '✅', duration: 4000 });
        }
    };

    // API Checkout Gate Approval
    const handleApproveExit = async (bypassDiscrepancy = false) => {
        if (!orderDetails) return;

        setIsProcessingApproval(true);
        const toastId = toast.loading('Confirming checkout and opening exit gate...');

        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrCodeString: orderDetails.id,
                    action: 'confirm_access'
                })
            });

            const data = await res.json();
            if (data.success) {
                playSuccessChime();
                toast.success(bypassDiscrepancy ? 'Mismatches bypassed. Gate Opened!' : 'Checkout Confirmed. Gate Opened!', { id: toastId });
                setIsAccessGranted(true);
                sessionStorage.removeItem('security_current_order');

                setTimeout(() => {
                    router.push('/security/scan');
                }, 2500);
            } else {
                toast.error(data.message || 'Failed to authorize exit gate.', { id: toastId });
            }
        } catch (error) {
            toast.error('Network error. Unable to open gate.', { id: toastId });
        } finally {
            setIsProcessingApproval(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center select-none font-sans relative overflow-hidden">
            <Toaster position="top-center" />

            {/* Header */}
            <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
                <Link href="/security/scan" className="text-slate-400 hover:text-white transition p-2 rounded-lg bg-slate-850/50">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <h1 className="text-xl font-bold tracking-wide">
                        AI Checkpoint Terminal
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Access Granted Success overlay */}
            <AnimatePresence>
                {isAccessGranted && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="mb-6 w-full max-w-sm">
                            <ExitGate isOpen={true} />
                        </div>
                        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 tracking-wide uppercase">EXIT ACCESS GRANTED</h2>
                        <p className="text-slate-400 font-mono tracking-widest text-xs uppercase mt-2">Physical Barrier Lifted</p>
                        <div className="mt-8 flex items-center gap-2 text-sm text-emerald-400 font-mono">
                            <span className="animate-ping w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
                            <span>Redirecting to scanner terminal...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-grow w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-8">
                
                {/* LEFT SIDE: SCANNER VIEWPORT (5 columns) */}
                <div className="md:col-span-5 flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative aspect-square md:aspect-auto md:flex-grow min-h-[300px]">
                        {!capturedImage && isCameraActive && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        )}
                        {!capturedImage && !isCameraActive && (
                            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                                <Camera className="w-16 h-16 text-slate-700 mb-2" />
                                <span className="font-bold text-sm">Physical Camera Paused</span>
                                <span className="text-xs text-slate-600 mt-1">Use Demo presets or upload an image file.</span>
                            </div>
                        )}
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover brightness-90"
                            />
                        )}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Analyzer Overlay */}
                        <AnimatePresence>
                            {isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                                >
                                    <ScanLine className="w-16 h-16 text-indigo-400 animate-bounce mb-2" />
                                    <h3 className="text-lg font-bold text-white tracking-wide">AI Cart Auditing...</h3>
                                    <p className="text-indigo-300 text-xs animate-pulse">Running Gemini Vision analysis</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Viewfinder brackets */}
                        {!capturedImage && isCameraActive && (
                            <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                                    <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                                    <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Capturing / Upload Controls */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                        {!capturedImage ? (
                            <div className="flex flex-col gap-3">
                                {isCameraActive && (
                                    <button
                                        onClick={takePhoto}
                                        className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 active:scale-95"
                                    >
                                        <Camera className="w-5 h-5" />
                                        <span>Capture Trolley Photo</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Upload Trigger */}
                                    <label className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl border border-slate-700 font-semibold text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload File</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    
                                    {/* Select Preset */}
                                    <div className="relative flex-1">
                                        <select
                                            onChange={(e) => handlePresetChange(e.target.value)}
                                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 px-2 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none transition cursor-pointer appearance-none"
                                            value={chosenPreset}
                                        >
                                            <option value="">Select Preset...</option>
                                            <option value="chips_and_soda">✅ Match Preset</option>
                                            <option value="extra_cola">🚨 Extra Cola</option>
                                            <option value="unbilled_chocolate">🚨 Unbilled Choc</option>
                                            <option value="all_products">✅ All Items</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={retakePhoto}
                                className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-3 rounded-xl transition border border-slate-700 flex justify-center items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Reset / Capture Again</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: COMPARISON MATRIX & CHECKOUT (7 columns) */}
                <div className="md:col-span-7 flex flex-col gap-4">
                    {/* Active Order metadata card */}
                    {orderDetails && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs">
                            <div>
                                <span className="block text-slate-500 uppercase tracking-wider font-bold mb-0.5">Scanned Bill</span>
                                <span className="font-mono text-indigo-400 font-bold text-sm">{orderDetails.readable_id || orderDetails.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-slate-500 uppercase tracking-wider font-bold mb-0.5">Payment Method</span>
                                <span className="font-bold text-slate-200 uppercase">{orderDetails.payment_method || 'UPI'}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-slate-500 uppercase tracking-wider font-bold mb-0.5">Amount Paid</span>
                                <span className="font-extrabold text-emerald-400 text-sm">₹{orderDetails.total_amount || orderDetails.totalAmount}</span>
                            </div>
                        </div>
                    )}

                    {/* Verification Comparison Console */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex-grow flex flex-col justify-between min-h-[350px]">
                        {!showResults ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-500">
                                <ScanLine className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                                <h3 className="font-bold text-white text-base">Comparison Panel Idle</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                    Take a photo or choose a preset to check billed items against actual cart contents.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col justify-between gap-6">
                                <div className="space-y-4">
                                    {/* Mismatch warnings */}
                                    {fraudFlags.length > 0 ? (
                                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start gap-3 text-rose-400">
                                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-wide">Mismatch Detected</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Discrepancy recorded. Billed items do not match what the AI detected in the cart.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400">
                                            <ShieldCheck className="w-5 h-5 shrink-0" />
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-wide">Verification Passed</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    All detected products match the paid invoice details.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Comparison Matrix Table */}
                                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                                    <th className="p-3 font-bold">Product Details</th>
                                                    <th className="p-3 text-center font-bold">Billed</th>
                                                    <th className="p-3 text-center font-bold">AI Scan</th>
                                                    <th className="p-3 text-right font-bold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850 bg-slate-900/30">
                                                {comparisonData.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-800/20">
                                                        <td className="p-3 font-medium text-slate-200">{item.name}</td>
                                                        <td className="p-3 text-center font-mono font-bold text-slate-400">{item.billedQty}</td>
                                                        <td className={`p-3 text-center font-mono font-bold ${
                                                            item.status === 'MATCH' ? 'text-slate-300' :
                                                            item.status === 'UNBILLED' || item.status === 'QUANTITY_MISMATCH' ? 'text-rose-400 font-extrabold' : 'text-blue-400'
                                                        }`}>{item.detectedQty}</td>
                                                        <td className="p-3 text-right">
                                                            {item.status === 'MATCH' && (
                                                                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-emerald-500/20">
                                                                    Match
                                                                </span>
                                                            )}
                                                            {item.status === 'UNBILLED' && (
                                                                <span className="inline-flex items-center gap-0.5 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-rose-500/20 animate-pulse">
                                                                    Unbilled
                                                                </span>
                                                            )}
                                                            {item.status === 'QUANTITY_MISMATCH' && (
                                                                <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-amber-500/20 animate-pulse">
                                                                    Extra Qty
                                                                </span>
                                                            )}
                                                            {item.status === 'MISSING_IN_SCAN' && (
                                                                <span className="inline-flex items-center gap-0.5 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-blue-500/20">
                                                                    Not Seen
                                                                </span>
                                                            )}
                                                            {item.status === 'UNDER_QTY' && (
                                                                <span className="inline-flex items-center gap-0.5 bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-sky-500/20">
                                                                    Under Qty
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Exit Gate Authorizations */}
                                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                                    {fraudFlags.length === 0 ? (
                                        <button
                                            onClick={() => handleApproveExit(false)}
                                            disabled={isProcessingApproval}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-lg py-4 rounded-xl shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 transform transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                        >
                                            <ShieldCheck className="w-6 h-6" />
                                            <span>Approve Exit & Open Gate</span>
                                        </button>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={retakePhoto}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                <span>Scan Again / Retake</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Bypassing will log a discrepancy override. Proceed to open gate?')) {
                                                        handleApproveExit(true);
                                                    }
                                                }}
                                                disabled={isProcessingApproval}
                                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-xl transition shadow-lg shadow-amber-950/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>Bypass & Open Gate</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
