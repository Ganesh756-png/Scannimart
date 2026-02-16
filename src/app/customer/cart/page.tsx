'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

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
    }, []);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = total * 0.18; // 18% GST example
    const finalTotal = total + tax;

    const handleCheckout = async () => {
        setProcessing(true);

        try {
            // Simulate Payment Delay
            await new Promise(r => setTimeout(r, 1500));

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart, paymentMethod: 'UPI' })
            });

            const data = await res.json();

            if (data.success) {
                // Clear cart
                localStorage.removeItem('cart');
                // Redirect to Pass page with Order ID
                // In a real app we might not pass data in query params like this for security, 
                // but for prototype it's fine. Or save orderId to local storage.
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

    const removeFromCart = (productId: string) => {
        const newCart = cart.filter(item => item.product !== productId);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h1>

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
                                <div key={item.product} className="flex justify-between items-center border-b py-3">
                                    <div>
                                        <p className="font-semibold text-lg">{item.name}</p>
                                        <p className="text-gray-500 text-sm">Qty: {item.quantity} x ₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">₹{item.price * item.quantity}</span>
                                        <button onClick={() => removeFromCart(item.product)} className="text-red-500 text-sm">Remove</button>
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

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            className={`w-full mt-8 py-4 rounded-xl text-white font-bold text-lg shadow-md transition transform active:scale-95 ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {processing ? 'Processing Payment...' : `Pay ₹${finalTotal.toFixed(2)} with UPI`}
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
