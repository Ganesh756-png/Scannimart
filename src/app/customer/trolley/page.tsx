'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { 
    Camera, 
    RefreshCw, 
    ShoppingCart, 
    Sparkles, 
    ChevronLeft, 
    Check, 
    Upload, 
    FileImage 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playScanBeep, playSuccessChime } from '@/utils/audio';

export default function TrolleyScanPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [cart, setCart] = useState<any[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // AI Results
    const [detectedItems, setDetectedItems] = useState<any[]>([]);
    const [showReview, setShowReview] = useState(false);

    // Demo Selection State
    const [chosenPreset, setChosenPreset] = useState('');

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

            // Scale down to max 800px width/height to prevent huge payloads
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
        
        // Mock placeholder image representing preset
        const mockImage = `data:image/jpeg;base64,MOCK_IMAGE_DATA_FOR_CUSTOMER_PRESET_${preset.toUpperCase()}`;
        setCapturedImage(mockImage);
        stopCamera();
        analyzeImage(mockImage, preset);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setDetectedItems([]);
        setShowReview(false);
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
                if (data.items && data.items.length > 0) {
                    setDetectedItems(data.items.map((item: any) => ({ ...item, selected: true })));
                    setShowReview(true);
                    playScanBeep();
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
            console.warn("Analysis failed:", err);
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

        const currentCartStr = localStorage.getItem('cart');
        let currentCart = currentCartStr ? JSON.parse(currentCartStr) : [];

        itemsToAdd.forEach(item => {
            const existingIndex = currentCart.findIndex((c: any) => c.product === item.id);
            if (existingIndex >= 0) {
                currentCart[existingIndex].quantity += item.detectedQuantity;
            } else {
                currentCart.push({
                    product: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.detectedQuantity,
                    variant: null
                });
            }
        });

        localStorage.setItem('cart', JSON.stringify(currentCart));
        playSuccessChime();
        toast.success(`Added ${itemsToAdd.length} products to your cart!`);
        router.push('/customer/scan');
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center select-none">
            <Toaster position="top-center" />

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
                <div className="w-10"></div>
            </div>

            <main className="flex-grow w-full max-w-md flex flex-col relative">

                {/* Viewfinder Area */}
                <div className="relative w-full aspect-[3/4] bg-black overflow-hidden shadow-2xl">
                    {!capturedImage && isCameraActive && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}
                    {!capturedImage && !isCameraActive && (
                        <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
                            <Camera className="w-16 h-16 text-neutral-800 mb-2" />
                            <span className="font-bold text-sm text-neutral-400">Camera Device Offline</span>
                            <span className="text-xs text-neutral-600 mt-1">Use a Demo preset scan or upload a file.</span>
                        </div>
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
                    {!capturedImage && isCameraActive && (
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
                <div className="p-6 bg-neutral-900 flex-grow flex flex-col justify-between rounded-t-3xl -mt-6 z-30 border-t border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    {!capturedImage ? (
                        <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                            <p className="text-center text-neutral-400 text-xs">
                                Take a photo of your trolley or choose a preset.<br />AI will bulk identify and list your items.
                            </p>
                            
                            {isCameraActive && (
                                <button
                                    onClick={takePhoto}
                                    className="w-16 h-16 rounded-full bg-white/10 border-4 border-indigo-500 flex items-center justify-center focus:outline-none hover:bg-indigo-500/20 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-95 group"
                                >
                                    <div className="w-11 h-11 rounded-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors shadow-inner flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <label className="flex-grow bg-neutral-800 hover:bg-neutral-750 py-3 px-2 rounded-xl border border-neutral-700 font-semibold text-xs text-neutral-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>

                                <div className="relative flex-grow">
                                    <select
                                        onChange={(e) => handlePresetChange(e.target.value)}
                                        className="w-full bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 py-3 px-2 rounded-xl text-xs font-semibold text-neutral-300 focus:outline-none transition cursor-pointer appearance-none"
                                        value={chosenPreset}
                                    >
                                        <option value="">Choose Preset...</option>
                                        <option value="chips_and_soda">Potato Chips & Soda</option>
                                        <option value="soda_and_chocolate">Soda & Chocolate</option>
                                        <option value="chips_and_water">Chips & Water</option>
                                        <option value="all_products">All Products</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between">
                            {showReview ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col h-full justify-between gap-4"
                                >
                                    <div>
                                        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                                            Found Items <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{detectedItems.length}</span>
                                        </h3>

                                        <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-52">
                                            {detectedItems.map((item, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl flex items-center gap-3 transition-colors border ${item.selected ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-neutral-800/50 border-transparent opacity-60'}`}>
                                                    <button
                                                        onClick={() => toggleItemSelection(idx)}
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${item.selected ? 'bg-indigo-500 text-white' : 'bg-neutral-700 border border-neutral-600'}`}
                                                    >
                                                        {item.selected && <Check className="w-3.5 h-3.5" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                                                        <p className="text-indigo-400 font-medium text-xs">₹{item.price}</p>
                                                    </div>

                                                    {item.selected && (
                                                        <div className="flex items-center gap-2 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                                                            <button disabled={item.detectedQuantity <= 1} onClick={() => updateItemQuantity(idx, -1)} className="text-neutral-400 hover:text-white disabled:opacity-30 text-sm">-</button>
                                                            <span className="w-4 text-center text-xs font-bold">{item.detectedQuantity}</span>
                                                            <button onClick={() => updateItemQuantity(idx, 1)} className="text-neutral-400 hover:text-white text-sm">+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={retakePhoto}
                                            className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition shadow-lg text-neutral-400 border border-neutral-700"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={confirmBulkAdd}
                                            className="flex-grow rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-500/20 transition flex items-center justify-center gap-2 font-bold text-base border border-indigo-400/20 py-3"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span>Add {detectedItems.filter(i => i.selected).reduce((acc, curr) => acc + curr.detectedQuantity, 0)} Items to Cart</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-center gap-4 cursor-not-allowed opacity-50 py-10">
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
