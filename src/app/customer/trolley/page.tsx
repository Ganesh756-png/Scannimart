'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Camera, RefreshCw, ShoppingCart, Sparkles, ChevronLeft, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrolleyScanPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [cart, setCart] = useState<any[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedItems, setDetectedItems] = useState<any[]>([]);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        // Load cart
        const savedCart = localStorage.getItem('cart');
        if (savedCart) setCart(JSON.parse(savedCart));

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
            toast.error("Could not access camera for Trolley Scan");
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
        setShowReview(false);
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
                if (data.items && data.items.length > 0) {
                    setDetectedItems(data.items.map((item: any) => ({ ...item, selected: true })));
                    setShowReview(true);
                    toast.success(`AI found ${data.items.length} items!`, { icon: '✨' });
                } else {
                    toast.error("Couldn't identify any products in this image.");
                    retakePhoto();
                }
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

    const toggleItemSelection = (index: number) => {
        const newItems = [...detectedItems];
        newItems[index].selected = !newItems[index].selected;
        setDetectedItems(newItems);
    };

    const updateItemQuantity = (index: number, delta: number) => {
        const newItems = [...detectedItems];
        const currentQty = newItems[index].detectedQuantity;
        if (currentQty + delta > 0) {
            newItems[index].detectedQuantity = currentQty + delta;
            setDetectedItems(newItems);
        }
    };

    const confirmBulkAdd = () => {
        const itemsToAdd = detectedItems.filter(item => item.selected);
        if (itemsToAdd.length === 0) {
            toast.error("No items selected");
            return;
        }

        // Add to existing cart logic
        const currentCartStr = localStorage.getItem('cart');
        let currentCart = currentCartStr ? JSON.parse(currentCartStr) : [];

        itemsToAdd.forEach(item => {
            const existingIndex = currentCart.findIndex((c: any) => c.product === item.barcode);
            if (existingIndex >= 0) {
                currentCart[existingIndex].quantity += item.detectedQuantity;
            } else {
                currentCart.push({
                    product: item.barcode,
                    name: item.name,
                    price: item.price,
                    quantity: item.detectedQuantity,
                    variant: null
                });
            }
        });

        localStorage.setItem('cart', JSON.stringify(currentCart));
        toast.success(`Added ${itemsToAdd.length} products to your cart!`);
        router.push('/customer/scan'); // Go back to main scanner or cart
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between sticky top-0 z-50">
                <Link href="/customer/scan" className="text-neutral-400 hover:text-white transition p-2 rounded-lg bg-neutral-800/50">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        AI Trolley Scanner
                    </h1>
                </div>
                <div className="w-10"></div> {/* Spacer for center alignment */}
            </div>

            <main className="flex-1 w-full max-w-md flex flex-col relative">

                {/* Viewfinder Area */}
                <div className="relative w-full aspect-[3/4] bg-black overflow-hidden shadow-2xl">
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
                                className="absolute inset-0 bg-indigo-900/30 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                            >
                                <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">Analyzing Trolley...</h3>
                                <p className="text-indigo-200 text-sm animate-pulse">Detecting products using Gemini AI</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scanner Framing Guides */}
                    {!capturedImage && !isAnalyzing && (
                        <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
                            <div className="flex justify-between">
                                <div className="w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl opacity-80" />
                                <div className="w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl opacity-80" />
                            </div>
                            <div className="text-center">
                                <span className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                                    Aim at your entire trolley
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl opacity-80" />
                                <div className="w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-xl opacity-80" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Area */}
                <div className="p-6 bg-neutral-900 flex-1 flex flex-col rounded-t-3xl -mt-6 z-30 border-t border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    {!capturedImage ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            <p className="text-center text-neutral-400 text-sm">
                                Take a clear photo of all your items.<br />AI will identify them instantly.
                            </p>
                            <button
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full bg-white/10 border-4 border-indigo-500 flex items-center justify-center focus:outline-none hover:bg-indigo-500/20 transition-colors shadow-[0_0_30px_rgba(99,102,241,0.3)] active:scale-95 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors shadow-inner flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {showReview ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex-1 flex flex-col h-full"
                                >
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        Found Items <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">{detectedItems.length}</span>
                                    </h3>

                                    <div className="flex-1 overflow-y-auto space-y-3 pb-20 pr-2 custom-scrollbar">
                                        {detectedItems.map((item, idx) => (
                                            <div key={idx} className={`p-3 rounded-2xl flex items-center gap-3 transition-colors border ${item.selected ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-neutral-800/50 border-transparent opacity-60'}`}>
                                                <button
                                                    onClick={() => toggleItemSelection(idx)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${item.selected ? 'bg-indigo-500 text-white' : 'bg-neutral-700 border border-neutral-600'}`}
                                                >
                                                    {item.selected && <Check className="w-4 h-4" />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white truncate">{item.name}</p>
                                                    <p className="text-indigo-400 font-medium text-sm">₹{item.price}</p>
                                                </div>

                                                {item.selected && (
                                                    <div className="flex items-center gap-3 bg-neutral-950 px-2 py-1.5 rounded-xl border border-neutral-800">
                                                        <button disabled={item.detectedQuantity <= 1} onClick={() => updateItemQuantity(idx, -1)} className="text-neutral-400 hover:text-white disabled:opacity-30">-</button>
                                                        <span className="w-4 text-center text-sm font-bold">{item.detectedQuantity}</span>
                                                        <button onClick={() => updateItemQuantity(idx, 1)} className="text-neutral-400 hover:text-white">+</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                                        <button
                                            onClick={retakePhoto}
                                            className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition shadow-lg text-neutral-400 border border-neutral-700"
                                        >
                                            <RefreshCw className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={confirmBulkAdd}
                                            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-500/20 transition flex items-center justify-center gap-2 font-bold text-lg border border-indigo-400/20"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            Add {detectedItems.filter(i => i.selected).reduce((acc, curr) => acc + curr.detectedQuantity, 0)} Items
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center gap-4 cursor-not-allowed opacity-50">
                                    Please wait...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

