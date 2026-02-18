'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Isolated Scanner Component to prevent React re-renders from messing with DOM
const QRScannerArea = memo(({ isScanning }: { isScanning: boolean }) => {
    return (
        <div
            id="html5qr-code-full-region"
            className={`w-full max-w-[300px] h-[300px] bg-black rounded-lg overflow-hidden ${!isScanning ? 'hidden' : 'block'}`}
        ></div>
    );
});

QRScannerArea.displayName = 'QRScannerArea';

export default function CustomerScan() {
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedProduct, setScannedProduct] = useState<any>(null); // For Modal
    const [selectedVariant, setSelectedVariant] = useState<any>(null); // For Modal
    const [quantity, setQuantity] = useState(1); // For Modal
    const [isScanning, setIsScanning] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');

    // We use a ref to track if component is mounted to prevent async state updates
    const isMounted = useRef(true);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionId = "html5qr-code-full-region";

    useEffect(() => {
        isMounted.current = true;
        // Load cart from local storage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }

        return () => {
            isMounted.current = false;
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch(console.error);
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, []);

    // Initialize scanner
    const startScanner = async () => {
        if (scannerRef.current?.isScanning || isScanning) return;

        setScanError(null);
        setIsScanning(true);

        try {
            // Wait for DOM to render the visible container
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!isMounted.current) return;

            if (!scannerRef.current) {
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13, // Books/ISBN
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128
                ];
                scannerRef.current = new Html5Qrcode(regionId, { formatsToSupport, verbose: false });
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                (decodedText) => onScanSuccess(decodedText),
                (errorMessage) => {
                    // console.warn("Scan error:", errorMessage);
                }
            );
        } catch (err: any) {
            console.error("Error starting scanner", err);
            // Revert state if failed
            if (isMounted.current) setIsScanning(false);

            let msg = "Camera not accessible. Try manual entry.";
            if (err?.toString().includes("already")) {
                msg = "Camera is busy. Please wait...";
            }
            setScanError(msg);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                if (isMounted.current) setIsScanning(false);
            } catch (err) {
                console.warn("Failed to stop scanner", err);
                // Force update state even if stop fails to prevent UI lock
                if (isMounted.current) setIsScanning(false);
            }
        }
    };

    // Auto-start scanner with slightly longer delay
    useEffect(() => {
        const timer = setTimeout(() => {
            startScanner();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const onScanSuccess = (decodedText: string) => {
        if (!isMounted.current) return;

        console.log("Scanned:", decodedText);
        stopScanner(); // Stop scanning immediately
        handleProductFetch(decodedText);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualBarcode.trim()) return;
        handleProductFetch(manualBarcode.trim());
    };

    const handleProductFetch = async (barcode: string) => {
        setLoading(true);
        setScanError(null);
        try {
            const res = await fetch(`/api/products?barcode=${barcode}`);
            const data = await res.json();

            if (data.success) {
                setQuantity(1);
                setScannedProduct(data.data);

                // Set default variant if available
                if (data.data.variants && data.data.variants.length > 0) {
                    setSelectedVariant(data.data.variants[0]);
                } else {
                    setSelectedVariant(null);
                }

                // Ensure scanner is stopped if we got here via manual input while scanning
                if (isScanning) stopScanner();
            } else {
                toast.error('Product not found!');
                setScanError(`Product not found (Code: ${barcode})`);
                if (!isScanning) setTimeout(startScanner, 2000); // Restart if it was a scan
            }
        } catch (error) {
            setScanError('Error fetching product details');
            toast.error('Network error');
            if (!isScanning) setTimeout(startScanner, 2000);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    // Dev Simulation
    const simulateScan = () => {
        const dummyBarcodes = ["8901234567890", "123456789", "987654321"]; // Examples
        const randomCode = dummyBarcodes[Math.floor(Math.random() * dummyBarcodes.length)];
        toast('Simulating Scan: ' + randomCode, { icon: '🤖' });
        handleProductFetch(randomCode);
    };

    const confirmAddToCart = () => {
        if (!scannedProduct) return;

        // If has variants but none selected (shouldn't happen due to default, but safe check)
        if (scannedProduct.variants && !selectedVariant) {
            toast.error("Please select a variant");
            return;
        }

        addToCart(scannedProduct, quantity, selectedVariant);
        toast.success(`Added ${quantity} x ${scannedProduct.name}`);
        setScannedProduct(null);
        setSelectedVariant(null);
        setQuantity(1);
        setManualBarcode('');
        // Restart scanner
        setTimeout(startScanner, 500);
    };

    const cancelScan = () => {
        setScannedProduct(null);
        setSelectedVariant(null);
        setQuantity(1);
        // Restart scanner
        setTimeout(startScanner, 500);
    };

    const addToCart = (product: any, qty: number, variant?: any) => {
        setCart((prevCart) => {
            // Unique key depends on product ID AND variant name (if any)
            const variantKey = variant ? variant.name : 'default';

            const existingItem = prevCart.find((item) =>
                item.product === product.id &&
                ((!item.variant && !variant) || (item.variant?.name === variant?.name))
            );

            let newCart;
            const price = variant ? variant.price : product.price;
            const name = variant ? `${product.name} (${variant.name})` : product.name;

            if (existingItem) {
                newCart = prevCart.map((item) =>
                    (item.product === product.id && ((!item.variant && !variant) || (item.variant?.name === variant?.name)))
                        ? { ...item, quantity: item.quantity + qty } : item
                );
            } else {
                newCart = [...prevCart, {
                    product: product.id,
                    name: name,
                    price: price,
                    quantity: qty,
                    variant: variant || null
                }];
            }
            localStorage.setItem('cart', JSON.stringify(newCart));
            return newCart;
        });
    };

    const increaseQty = () => setQuantity(q => q + 1);
    const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                <span className="text-3xl">📱</span> Scan & Shop
            </h1>

            {/* SCANNER / INPUT AREA */}
            <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-lg mb-6 relative min-h-[350px] flex flex-col items-center">

                {/* 1. Camera Region (Hidden when product found or not scanning) */}
                {!scannedProduct && (
                    <div className="relative w-full flex flex-col items-center">
                        <QRScannerArea isScanning={isScanning} />

                        {!isScanning && !loading && (
                            <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg w-full mb-4">
                                <p>Camera Paused</p>
                            </div>
                        )}

                        {/* Manual Input Fallback */}
                        <div className="w-full mt-4 border-t pt-4">
                            <form onSubmit={handleManualSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter barcode manually..."
                                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={manualBarcode}
                                    onChange={(e) => setManualBarcode(e.target.value)}
                                />
                                <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition">
                                    Add
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm rounded-xl">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-blue-800 font-semibold">Fetching Product...</p>
                    </div>
                )}

                {/* 2. PRODUCT DETAILS MODAL (Overlay) */}
                {scannedProduct && (
                    <div className="absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn rounded-xl">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                            {scannedProduct.variants ? '⚡' : '✓'}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{scannedProduct.name}</h3>
                        <p className="text-gray-500 mb-4 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{scannedProduct.barcode}</p>

                        {/* Variant Selection */}
                        {scannedProduct.variants && (
                            <div className="grid grid-cols-2 gap-2 mb-6 w-full">
                                {scannedProduct.variants.map((v: any) => (
                                    <button
                                        key={v.name}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${selectedVariant?.name === v.name
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-blue-200'
                                            }`}
                                    >
                                        <span className="block">{v.name}</span>
                                        <span className="block text-lg">₹{v.price}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!scannedProduct.variants && (
                            <p className="text-2xl font-bold text-blue-600 mb-6">₹{scannedProduct.price}</p>
                        )}

                        {selectedVariant && (
                            <p className="text-sm text-gray-500 mb-2">
                                Price: <span className="font-bold text-gray-800">₹{selectedVariant.price}</span>
                            </p>
                        )}

                        <div className="flex items-center gap-6 mb-8 bg-gray-50 p-2 rounded-full border">
                            <button
                                onClick={decreaseQty}
                                className="w-10 h-10 rounded-full bg-white text-gray-700 font-bold text-xl hover:bg-gray-100 shadow-sm flex items-center justify-center border"
                            >-</button>
                            <span className="text-2xl font-bold text-gray-800 w-8">{quantity}</span>
                            <button
                                onClick={increaseQty}
                                className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 shadow-xl flex items-center justify-center"
                            >+</button>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={cancelScan}
                                className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddToCart}
                                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition transform hover:scale-105"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {scanError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 mb-4 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span> {scanError}
                </div>
            )}

            {/* Control Buttons (Retry / Simulate) */}
            <div className="flex gap-4 mb-6">
                {!isScanning && !scannedProduct && (
                    <button
                        onClick={startScanner}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 font-medium transition flex items-center gap-2"
                    >
                        📷 Start Camera
                    </button>
                )}

                {/* Dev Tool: Simulate Scan */}
                <button
                    onClick={simulateScan}
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 font-medium transition flex items-center gap-2"
                >
                    🤖 Simulate Scan
                </button>
            </div>

            {/* Cart Summary */}
            <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-between items-end mb-4 border-b pb-2">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Your Cart</h2>
                        <p className="text-xs text-gray-500">{cart.reduce((a, b) => a + b.quantity, 0)} items</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block">Total</span>
                        <span className="text-xl font-bold text-green-600">
                            ₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}
                        </span>
                    </div>
                </div>

                <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                    {cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="text-xs text-gray-500">₹{item.price} x {item.quantity}</span>
                            </div>
                            <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-center text-gray-400 py-4 italic">Cart is empty. Scan something!</p>}
                </div>

                <Link href="/customer/cart" className={`w-full block text-center py-3.5 rounded-xl font-bold text-white transition shadow-lg ${cart.length > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-200 transform hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed'}`}>
                    Proceed to Checkout
                </Link>
            </div>

            <div className="mt-8 text-center">
                <Link href="/test-barcodes" className="text-xs text-blue-500 underline">
                    View Test Barcodes
                </Link>
            </div>
        </div>
    );
}
