'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function CustomerScan() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedProduct, setScannedProduct] = useState<any>(null); // For Modal
    const [quantity, setQuantity] = useState(1); // For Modal
    const router = useRouter();

    useEffect(() => {
        // Load cart from local storage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Initializer function for scanner
    const startScanner = () => {
        if (scannerRef.current) return; // Already running

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: {
                    facingMode: { ideal: "environment" }
                }
            },
            /* verbose= */ false
        );
        scannerRef.current = scanner;
        scanner.render(onScanSuccess, onScanFailure);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.warn("Failed to clear scanner", err);
            }
        }
    };

    useEffect(() => {
        // Start scanner on mount
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            stopScanner();
        };
    }, []);

    function onScanSuccess(decodedText: string, decodedResult: any) {
        if (scannedProduct) return; // Already processing/showing modal

        console.log("Customer Scanned:", decodedText);
        setScanResult(decodedText);
        // Stop scanner while we process and show modal
        stopScanner().then(() => {
            fetchProduct(decodedText);
        });
    }

    function onScanFailure(error: any) {
        // handle scan failure silent
    }

    const fetchProduct = async (barcode: string) => {
        setLoading(true);
        setScanError(null);
        try {
            const res = await fetch(`/api/products?barcode=${barcode}`);
            const data = await res.json();

            if (data.success) {
                // Determine quantity (check if already in cart to preset? No, start at 1)
                setQuantity(1);
                setScannedProduct(data.data);
                // Modal will appear because scannedProduct is set
            } else {
                setScanError('Product not found!');
                toast.error('Product not found!');
                // Restart scanner if failed
                setTimeout(startScanner, 2000);
            }
        } catch (error) {
            setScanError('Error fetching product');
            setTimeout(startScanner, 2000);
        } finally {
            setLoading(false);
        }
    };

    const confirmAddToCart = () => {
        if (!scannedProduct) return;
        addToCart(scannedProduct, quantity);
        toast.success(`Added ${quantity} x ${scannedProduct.name}`);
        setScannedProduct(null);
        setQuantity(1);
        setScanResult(null);
        // Restart scanner
        setTimeout(startScanner, 500);
    };

    const cancelScan = () => {
        setScannedProduct(null);
        setQuantity(1);
        setScanResult(null);
        // Restart scanner
        setTimeout(startScanner, 500);
    };

    const addToCart = (product: any, qty: number) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.product === product.id);
            let newCart;
            if (existingItem) {
                newCart = prevCart.map((item) =>
                    item.product === product.id ? { ...item, quantity: item.quantity + qty } : item
                );
            } else {
                newCart = [...prevCart, { product: product.id, name: product.name, price: product.price, quantity: qty }];
            }
            localStorage.setItem('cart', JSON.stringify(newCart));
            return newCart;
        });
    };

    const increaseQty = () => setQuantity(q => q + 1);
    const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
            <Toaster position="top-center" />
            <h1 className="text-2xl font-bold mb-4 text-blue-800">Scan Product</h1>

            {/* SCANNER CONTAINER */}
            <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-md mb-6 relative min-h-[300px]">
                {!scannedProduct && (
                    <div id="reader" className="w-full h-full"></div>
                )}

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                        <p className="text-blue-600 font-semibold animate-pulse">Fetching details...</p>
                    </div>
                )}

                {/* QUANTITY MODAL OVERLAY */}
                {scannedProduct && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{scannedProduct.name}</h3>
                        <p className="text-gray-500 mb-6">₹{scannedProduct.price} / unit</p>

                        <div className="flex items-center gap-6 mb-8">
                            <button
                                onClick={decreaseQty}
                                className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 font-bold text-2xl hover:bg-gray-300 flex items-center justify-center"
                            >-</button>
                            <span className="text-4xl font-bold text-blue-900">{quantity}</span>
                            <button
                                onClick={increaseQty}
                                className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-2xl hover:bg-blue-200 flex items-center justify-center"
                            >+</button>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={cancelScan}
                                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddToCart}
                                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {scanError && <p className="text-red-500 font-bold mb-4">{scanError}</p>}

            <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">My Cart ({cart.reduce((a, b) => a + b.quantity, 0)} items)</h2>
                <div className="max-h-40 overflow-y-auto mb-4">
                    {cart.map((item, index) => (
                        <div key={index} className="flex justify-between border-b py-2 text-sm">
                            <span>{item.name} (x{item.quantity})</span>
                            <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-gray-500 italic">Cart is empty.</p>}
                </div>

                <Link href="/customer/cart" className="w-full block text-center bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                    Go to Checkout
                </Link>
            </div>
        </div>
    );
}
