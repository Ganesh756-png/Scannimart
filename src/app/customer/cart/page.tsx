'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

// Simple Scanner Component for Cart
const CartScannerArea = ({ isScanning }: { isScanning: boolean }) => (
    <div id="cart-qr-reader" className={`w-full h-[250px] bg-black rounded-lg overflow-hidden ${!isScanning ? 'hidden' : 'block'}`}></div>
);

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    // 🛡️ AUDIT STATE
    const [auditActive, setAuditActive] = useState(false);
    const [auditItem, setAuditItem] = useState<any>(null);
    const auditScannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // Validate cart items have IDs
                const validCart = parsedCart.filter((item: any) => item.product);
                if (validCart.length !== parsedCart.length) {
                    // Start fresh if invalid references found
                    localStorage.removeItem('cart');
                    setCart([]);
                } else {
                    setCart(validCart);
                }
            } catch (e) {
                localStorage.removeItem('cart');
                setCart([]);
            }
        }

        return () => {
            // Cleanup scanner
            if (auditScannerRef.current?.isScanning) {
                auditScannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = total * 0.18; // 18% GST example
    const finalTotal = total + tax;

    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');

    const startAuditScanner = async () => {
        try {
            // Give DOM time to render
            await new Promise(r => setTimeout(r, 100));

            if (!auditScannerRef.current) {
                auditScannerRef.current = new Html5Qrcode("cart-qr-reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A],
                    verbose: false
                });
            }

            if (!auditScannerRef.current.isScanning) {
                await auditScannerRef.current.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => verifyAuditScan(decodedText),
                    () => { }
                );
            }
        } catch (err) {
            console.error("Audit Scanner Error", err);
            toast.error("Camera failed. Please use manual verification (Demo).");
        }
    };

    const verifyAuditScan = (code: string) => {
        if (!auditItem) return;

        // Check loosely against known IDs/Barcodes
        // In real app, we check against `auditItem.product` (ID) or `auditItem.barcode`
        // For demo, we might need to be flexible if we don't have barcode in cart item
        // But `scan/page.tsx` saves `product: id` and maybe we can find it.
        // Assuming the ID stored IS the barcode for demo items like Maggi.

        if (code === auditItem.product || code === auditItem.barcode || code === auditItem.id) {
            toast.success("✅ Verification Successful!");
            stopAuditScanner();
            setAuditActive(false);
            processPayment(); // Proceed!
        } else {
            // Rate limit toasts?
            toast.error("❌ Wrong item! Please scan " + auditItem.name);
        }
    };

    // Manual Override for Demo if Camera fails
    const manualVerify = () => {
        toast.success("✅ Manual Verification (Dev Bypass)");
        stopAuditScanner();
        setAuditActive(false);
        processPayment();
    };

    const stopAuditScanner = async () => {
        if (auditScannerRef.current?.isScanning) {
            await auditScannerRef.current.stop();
        }
    };

    const initiateCheckout = () => {
        const totalQty = cart.reduce((a, b) => a + b.quantity, 0);

        // 🎲 AUDIT TRIGGER LOGIC
        // Rule: If > 10 items OR 30% Random Chance
        const shouldAudit = totalQty > 10 || Math.random() < 0.3;

        if (shouldAudit && cart.length > 0) {
            const randomItem = cart[Math.floor(Math.random() * cart.length)];
            setAuditItem(randomItem);
            setAuditActive(true);
            setTimeout(startAuditScanner, 500);
        } else {
            processPayment();
        }
    };

    const processPayment = async () => {
        setProcessing(true);

        try {
            // Simulate Payment Delay only for UPI
            if (paymentMethod === 'UPI') {
                await new Promise(r => setTimeout(r, 1500));
            }

            // Get Customer Details from Main Auth
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert('Please login to continue');
                router.push('/login');
                return;
            }
            const user = JSON.parse(userStr);

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    paymentMethod,
                    customerDetails: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone || 'N/A' // Use phone if available in main auth
                    }
                })
            });

            const data = await res.json();

            if (data.success) {
                // Clear cart
                localStorage.removeItem('cart');
                localStorage.setItem('lastOrder', JSON.stringify(data.order));
                router.push('/customer/pass');
            } else {
                alert('Checkout Failed: ' + data.message);
            }
        } catch (error) {
            alert('Error processing checkout');
        } finally {
            setProcessing(false);
        }
    };

    const removeFromCart = (productId: string, variant?: any) => {
        const newCart = cart.filter(item =>
            !(item.product === productId &&
                ((!item.variant && !variant) || (item.variant?.name === variant?.name)))
        );
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h1>

            {/* 🛡️ AUDIT MODAL OVERLAY */}
            {auditActive && auditItem && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse">
                            🛡️
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Security Check</h2>
                        <p className="text-gray-600">
                            Random audit selected. Please rescan this item to verify your cart:
                        </p>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <p className="font-bold text-lg text-blue-900">{auditItem.name}</p>
                            <p className="text-sm text-blue-600">Qty: {auditItem.quantity}</p>
                        </div>

                        {/* Scanner */}
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                            <CartScannerArea isScanning={auditActive} />
                            <div className="absolute inset-0 border-2 border-blue-500/50 animate-pulse pointer-events-none"></div>
                        </div>

                        <p className="text-xs text-gray-400">Align barcode within the frame</p>

                        <button onClick={manualVerify} className="text-xs text-gray-300 underline mt-4 hover:text-gray-500">
                            Camera not working? Skip (Dev)
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                {cart.length === 0 ? (
                    <div className="text-center">
                        <p className="text-gray-500 mb-4">Your cart is empty.</p>
                        <Link href="/customer/scan" className="text-blue-600 hover:underline">Scan items</Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            {cart.map((item) => (
                                <div key={item.product + (item.variant?.name || '')} className="flex justify-between items-center border-b py-3">
                                    <div>
                                        <p className="font-semibold text-lg">{item.name}</p>
                                        <p className="text-gray-500 text-sm">Qty: {item.quantity} x ₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">₹{item.price * item.quantity}</span>
                                        <button onClick={() => removeFromCart(item.product, item.variant)} className="text-red-500 text-sm">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (18% GST)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold text-gray-900 mt-2">
                                <span>Total</span>
                                <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase">Payment Method</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('UPI')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-2xl mb-1">📱</span>
                                    <span className="font-bold">UPI / Card</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-2xl mb-1">💵</span>
                                    <span className="font-bold">Cash</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={initiateCheckout}
                            disabled={processing}
                            className={`w-full mt-8 py-4 rounded-xl text-white font-bold text-lg shadow-md transition transform active:scale-95 ${processing ? 'bg-gray-400 cursor-not-allowed' :
                                paymentMethod === 'CASH' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {processing ? 'Processing...' :
                                paymentMethod === 'CASH' ? `Generate Cash QR` : `Pay ₹${finalTotal.toFixed(2)} Now`}
                        </button>

                        <div className="mt-4 text-center">
                            <Link href="/customer/scan" className="text-blue-600 hover:underline text-sm">
                                ← Scan more items
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
