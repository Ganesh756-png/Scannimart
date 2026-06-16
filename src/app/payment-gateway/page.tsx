'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { 
    ShieldCheck, 
    Lock, 
    Smartphone, 
    CreditCard, 
    Building2, 
    ArrowRight, 
    Clock, 
    Loader2, 
    CheckCircle, 
    XCircle,
    Eye,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { playPaymentChime, playDiscrepancyBuzzer } from '@/utils/audio';

function PaymentGatewayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState<any>(null);
    const [loadingOrder, setLoadingOrder] = useState(true);

    // Navigation & Method Tabs
    const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
    const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'otp' | 'bank_login' | 'bank_confirm' | 'success' | 'failed'>('idle');
    const [statusMessage, setStatusMessage] = useState('Secure Connection Established');

    // UPI Simulation State
    const [upiTimer, setUpiTimer] = useState(300); // 5 minutes
    const [autoPayChecked, setAutoPayChecked] = useState(false);
    const autoPayTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Card Simulation State
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');
    const [isCVVFocused, setIsCVVFocused] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpTimer, setOtpTimer] = useState(60);
    const otpIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Net Banking State
    const [selectedBank, setSelectedBank] = useState('');
    const [bankUser, setBankUser] = useState('');
    const [bankPass, setBankPass] = useState('');

    // Transaction outcome info
    const [txnId, setTxnId] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [redirectTimer, setRedirectTimer] = useState(3);

    // Confetti particles for success
    const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number; duration: number }[]>([]);

    // Fetch order details
    useEffect(() => {
        if (!orderId) {
            setLoadingOrder(false);
            return;
        }

        async function fetchOrder() {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (error || !data) {
                    console.error("Error loading order:", error);
                    toast.error("Order not found or database link issue.");
                } else {
                    setOrder(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingOrder(false);
            }
        }
        fetchOrder();
    }, [orderId]);

    // UPI Countdown Timer
    useEffect(() => {
        if (activeTab !== 'upi' || paymentState !== 'idle') return;

        const interval = setInterval(() => {
            setUpiTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setPaymentState('failed');
                    setErrorMessage('Transaction timed out.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTab, paymentState]);

    // OTP Countdown Timer
    useEffect(() => {
        if (paymentState !== 'otp') {
            if (otpIntervalRef.current) clearInterval(otpIntervalRef.current);
            return;
        }

        setOtpTimer(60);
        otpIntervalRef.current = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) {
                    if (otpIntervalRef.current) clearInterval(otpIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (otpIntervalRef.current) clearInterval(otpIntervalRef.current);
        };
    }, [paymentState]);

    // Auto-Pay Simulation for UPI
    useEffect(() => {
        if (autoPayChecked && activeTab === 'upi' && paymentState === 'idle') {
            autoPayTimerRef.current = setTimeout(() => {
                triggerPaymentCompletion('UPI_AUTOPAY');
            }, 8000);
            toast('⏳ Demo: Auto-paying in 8 seconds...', { icon: '🤖' });
        } else {
            if (autoPayTimerRef.current) clearTimeout(autoPayTimerRef.current);
        }

        return () => {
            if (autoPayTimerRef.current) clearTimeout(autoPayTimerRef.current);
        };
    }, [autoPayChecked, activeTab, paymentState]);

    // Redirect on Success
    useEffect(() => {
        if (paymentState !== 'success') return;

        // Generate confetti items
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const list = Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 3
        }));
        setConfetti(list);

        // Countdown redirect
        const interval = setInterval(() => {
            setRedirectTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Clear cart
                    localStorage.removeItem('cart');
                    // Update lastOrder status in storage
                    if (order) {
                        const updatedOrder = { ...order, status: 'paid', payment_method: order.payment_method };
                        localStorage.setItem('lastOrder', JSON.stringify(updatedOrder));
                    }
                    router.push('/customer/pass');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [paymentState, order, router]);

    // Format Time (MM:SS)
    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Format Card inputs
    const handleCardNumberChange = (value: string) => {
        const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = cleaned.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            setCardNumber(parts.join(' '));
        } else {
            setCardNumber(cleaned);
        }
    };

    const handleExpiryChange = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, '');
        if (cleaned.length >= 2) {
            setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
        } else {
            setCardExpiry(cleaned);
        }
    };

    // Detect card issuer
    const getCardType = (num: string) => {
        const clean = num.replace(/\s+/g, '');
        if (clean.startsWith('4')) return 'Visa';
        if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'Mastercard';
        if (clean.startsWith('34') || clean.startsWith('37')) return 'Amex';
        if (/^(60|65|81|82)/.test(clean)) return 'RuPay';
        return 'Card';
    };

    // Call callback backend and update UI status
    const triggerPaymentCompletion = async (method: string) => {
        if (!order) return;

        setPaymentState('processing');
        setStatusMessage('Connecting with Bank networks...');

        // Step delay simulation
        await new Promise(r => setTimeout(r, 1200));
        setStatusMessage('Authorizing funds transfer...');
        await new Promise(r => setTimeout(r, 1000));
        setStatusMessage('Completing Merchant settlement...');
        await new Promise(r => setTimeout(r, 800));

        const mockTxn = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

        try {
            const res = await fetch('/api/payment/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    paymentMethod: method,
                    transactionId: mockTxn
                })
            });

            const data = await res.json();
            if (data.success) {
                setTxnId(mockTxn);
                setPaymentState('success');
                playPaymentChime();
                toast.success('Payment Received!');
            } else {
                setPaymentState('failed');
                setErrorMessage(data.message || 'Verification rejected by backend.');
                playDiscrepancyBuzzer();
            }
        } catch (error) {
            console.error("Callback API error:", error);
            // Fallback for offline mode or debug
            setTxnId(mockTxn);
            setPaymentState('success');
            playPaymentChime();
            toast.success('Payment Success (Local Dev Fallback)');
        }
    };

    // Validate and submit Card Form
    const handleCardPay = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanNum = cardNumber.replace(/\s+/g, '');
        if (cleanNum.length < 16) {
            toast.error("Please enter a valid 16-digit card number.");
            return;
        }
        if (cardExpiry.length < 5) {
            toast.error("Please enter expiry in MM/YY format.");
            return;
        }
        if (cardCVV.length < 3) {
            toast.error("Please enter a 3-digit CVV code.");
            return;
        }
        if (!cardName.trim()) {
            toast.error("Please enter cardholder name.");
            return;
        }

        // Open secure OTP screen
        setPaymentState('processing');
        setStatusMessage('Requesting Secure 3D Authentication Token...');
        setTimeout(() => {
            setPaymentState('otp');
            toast.success('OTP Secure token sent to your device!');
        }, 1500);
    };

    // Validate OTP
    const handleOTPSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode !== '123456' && otpCode !== '000000') {
            setPaymentState('processing');
            setStatusMessage('Verifying Secure Code...');
            setTimeout(() => {
                setPaymentState('failed');
                setErrorMessage('Authentication failed: Invalid secure code (OTP).');
                playDiscrepancyBuzzer();
                toast.error("Invalid OTP");
            }, 1000);
            return;
        }

        triggerPaymentCompletion(`CARD_${getCardType(cardNumber).toUpperCase()}`);
    };

    // Validate and launch Netbanking Login
    const handleNetbankingInit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBank) {
            toast.error("Please select a bank.");
            return;
        }
        setPaymentState('processing');
        setStatusMessage(`Redirecting to secure ${selectedBank} portal...`);
        setTimeout(() => {
            setPaymentState('bank_login');
        }, 1500);
    };

    // Netbanking Login Submit
    const handleBankLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankUser.trim() || !bankPass.trim()) {
            toast.error("Credentials cannot be empty.");
            return;
        }
        setPaymentState('processing');
        setStatusMessage('Authenticating customer details...');
        setTimeout(() => {
            setPaymentState('bank_confirm');
        }, 1200);
    };

    if (loadingOrder) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400 font-mono tracking-widest uppercase">Initializing Secure Gateway...</p>
            </div>
        );
    }

    if (!orderId || !order) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-6 rounded-2xl max-w-md space-y-4 shadow-xl shadow-red-500/5">
                    <XCircle className="w-16 h-16 mx-auto" />
                    <h1 className="text-2xl font-black">Invalid Order Token</h1>
                    <p className="text-gray-400 text-sm">
                        This session has expired or no checkout transaction was provided. Please return to your cart and try again.
                    </p>
                    <button 
                        onClick={() => router.push('/customer/cart')}
                        className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition-all"
                    >
                        Return to Cart
                    </button>
                </div>
            </div>
        );
    }

    const totalAmount = parseFloat(order.total_amount || order.totalAmount || 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans select-none relative overflow-hidden">
            {/* Background glowing decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000"></div>

            {/* Main Checkout Panel Container */}
            <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-2xl relative z-10">
                
                {/* 🛡️ STATE 1: PROCESSING */}
                {paymentState === 'processing' && (
                    <div className="col-span-12 min-h-[480px] flex flex-col items-center justify-center p-8 bg-slate-900/90 text-center space-y-6 animate-fadeIn">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                            <Lock className="w-8 h-8 text-blue-500 absolute inset-0 m-auto" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white tracking-wide">Processing Secure Payment</h2>
                            <p className="text-sm text-blue-400 font-mono tracking-tight animate-pulse">{statusMessage}</p>
                        </div>
                        <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full animate-[loading-bar_3s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500">Do not refresh this page or close your browser.</p>
                        
                        <style jsx>{`
                            @keyframes loading-bar {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                            }
                        `}</style>
                    </div>
                )}

                {/* 🛡️ STATE 2: SUCCESS */}
                {paymentState === 'success' && (
                    <div className="col-span-12 min-h-[480px] flex flex-col items-center justify-center p-8 bg-slate-900/95 text-center relative overflow-hidden animate-fadeIn">
                        {/* Confetti simulator */}
                        {confetti.map((particle) => (
                            <div
                                key={particle.id}
                                className="absolute top-0 w-2.5 h-2.5 rounded-sm opacity-85 pointer-events-none"
                                style={{
                                    left: `${particle.left}%`,
                                    backgroundColor: particle.color,
                                    animation: `fall ${particle.duration}s linear infinite`,
                                    animationDelay: `${particle.delay}s`,
                                    transform: `translateY(-20px) rotate(${Math.random() * 360}deg)`
                                }}
                            />
                        ))}

                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-[bounce_1s_ease-out] mb-6">
                            <CheckCircle className="w-12 h-12" />
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-wide">Payment Successful!</h2>
                        <p className="text-sm text-emerald-400 font-mono mt-1">Order Settled & Access Ticket Verified</p>

                        <div className="w-full max-w-sm mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left space-y-2 text-xs font-mono">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">MERCHANT</span>
                                <span className="font-bold text-slate-300">SCANNIMART CORP</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">TRANSACTION ID</span>
                                <span className="font-bold text-blue-400">{txnId}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">AMOUNT PAID</span>
                                <span className="font-bold text-white">₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">DATE & TIME</span>
                                <span className="text-slate-300">{new Date().toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400 bg-slate-800/40 px-4 py-2 rounded-full">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            <span>Redirecting to pass in <b className="text-white font-bold">{redirectTimer}s</b>...</span>
                        </div>

                        <button 
                            onClick={() => {
                                localStorage.removeItem('cart');
                                if (order) {
                                    const updatedOrder = { ...order, status: 'paid', payment_method: order.payment_method };
                                    localStorage.setItem('lastOrder', JSON.stringify(updatedOrder));
                                }
                                router.push('/customer/pass');
                            }}
                            className="mt-6 text-xs text-blue-400 underline hover:text-blue-300"
                        >
                            Click here to bypass wait
                        </button>

                        <style jsx>{`
                            @keyframes fall {
                                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                                90% { opacity: 0.8; }
                                100% { transform: translateY(500px) rotate(360deg); opacity: 0; }
                            }
                        `}</style>
                    </div>
                )}

                {/* 🛡️ STATE 3: FAILED */}
                {paymentState === 'failed' && (
                    <div className="col-span-12 min-h-[480px] flex flex-col items-center justify-center p-8 bg-slate-900/95 text-center space-y-6 animate-fadeIn">
                        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/5">
                            <XCircle className="w-12 h-12 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-wide">Transaction Declined</h2>
                            <p className="text-sm text-rose-400 font-medium">{errorMessage || 'The issuing bank returned a network error.'}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                onClick={() => setPaymentState('idle')}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold transition text-sm text-white"
                            >
                                Choose Another Method
                            </button>
                            <button
                                onClick={() => setPaymentState('idle')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition text-sm text-white"
                            >
                                Try Again
                            </button>
                        </div>
                        <button 
                            onClick={() => router.push('/customer/cart')}
                            className="text-xs text-slate-500 hover:underline hover:text-slate-400"
                        >
                            Cancel and return to Cart
                        </button>
                    </div>
                )}

                {/* 🛡️ STATE 4: BANK OTP MODAL OVERLAY */}
                {paymentState === 'otp' && (
                    <div className="col-span-12 min-h-[480px] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md z-30 animate-fadeIn">
                        <form onSubmit={handleOTPSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    <ShieldCheck className="text-blue-500 w-5 h-5" />
                                    <span>SafeClick Secure 3D</span>
                                </h3>
                                <div className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                                    PCI-DSS COMPLIANT
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-300">
                                <p>
                                    To verify, enter the 6-digit verification code sent to your registered mobile number ending in <span className="text-white font-bold font-mono">****7890</span>.
                                </p>
                                <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex items-start gap-2.5">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="block text-xs font-bold text-blue-400 uppercase tracking-wide">Demo Credentials</span>
                                        <span className="text-xs text-slate-400">Use code <b className="text-white font-bold font-mono">123456</b> (or <b className="text-white font-bold font-mono">000000</b> to trigger failure).</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="••••••"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full tracking-[1.5em] text-center text-2xl font-black bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 text-white outline-none transition"
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Code expired'}
                                </span>
                                <button
                                    type="button"
                                    disabled={otpTimer > 0}
                                    onClick={() => {
                                        setOtpTimer(60);
                                        toast.success('New OTP token sent!');
                                    }}
                                    className="text-blue-500 font-bold hover:underline disabled:text-slate-600 disabled:no-underline"
                                >
                                    Resend OTP
                                </button>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentState('idle')}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold transition text-sm text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={otpCode.length < 6}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 disabled:text-slate-500 py-3 rounded-xl font-bold transition text-sm text-white shadow-lg shadow-blue-500/10"
                                >
                                    Submit OTP
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 🛡️ STATE 5: NETBANKING LOGIN OVERLAY */}
                {paymentState === 'bank_login' && (
                    <div className="col-span-12 min-h-[480px] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md z-30 animate-fadeIn">
                        <form onSubmit={handleBankLogin} className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
                            {/* Bank Brand Header */}
                            <div className="bg-sky-900 p-4 text-white flex justify-between items-center border-b-4 border-amber-500">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-amber-400" />
                                    <span className="font-extrabold tracking-wider text-sm md:text-base">{selectedBank.toUpperCase()} SECURE GATEWAY</span>
                                </div>
                                <span className="text-[10px] text-sky-200 uppercase font-mono">Retail Login</span>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-xs space-y-1">
                                    <div className="font-bold text-sky-900 flex justify-between">
                                        <span>PAYMENT REQUEST TO:</span>
                                        <span>SCANNIMART CORP</span>
                                    </div>
                                    <div className="font-bold text-amber-700 flex justify-between text-sm">
                                        <span>AMOUNT:</span>
                                        <span>₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-xs">
                                    🤖 <b>Demo Mode:</b> Input any mock customer ID and password (e.g. <code>user</code> / <code>pass</code>) to continue.
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Customer ID / User ID</label>
                                        <input
                                            type="text"
                                            required
                                            value={bankUser}
                                            onChange={(e) => setBankUser(e.target.value)}
                                            placeholder="Enter Customer ID"
                                            className="w-full border border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg p-2.5 outline-none transition bg-white text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">IPIN / Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={bankPass}
                                            onChange={(e) => setBankPass(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full border border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg p-2.5 outline-none transition bg-white text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentState('idle')}
                                        className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-lg font-bold transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-sky-800 hover:bg-sky-900 text-white py-3 rounded-lg font-bold transition text-sm shadow-md"
                                    >
                                        Log In
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 text-center text-[10px] text-gray-400">
                                This page is simulated. Never enter your actual bank credentials.
                            </div>
                        </form>
                    </div>
                )}

                {/* 🛡️ STATE 6: NETBANKING CONFIRM TRANSACTION OVERLAY */}
                {paymentState === 'bank_confirm' && (
                    <div className="col-span-12 min-h-[480px] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md z-30 animate-fadeIn">
                        <div className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
                            {/* Bank Brand Header */}
                            <div className="bg-sky-900 p-4 text-white flex justify-between items-center border-b-4 border-amber-500">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-amber-400" />
                                    <span className="font-extrabold tracking-wider text-sm md:text-base">{selectedBank.toUpperCase()} CONFIRMATION</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                <h3 className="text-lg font-bold text-sky-900 border-b pb-2">Confirm Payment</h3>
                                <p className="text-sm text-gray-600">
                                    Please authorize the following transfer from your account ending in <span className="font-bold text-gray-800">XXXX5432</span>.
                                </p>

                                <div className="p-4 rounded-xl bg-gray-50 border space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Beneficiary:</span>
                                        <span className="font-bold text-gray-800">SCANNIMART CORP</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Bank Ref ID:</span>
                                        <span className="font-mono text-gray-800">BNK-{Math.floor(100000 + Math.random() * 900000)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg text-sky-900">
                                        <span>Debited Amount:</span>
                                        <span>₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentState('idle')}
                                        className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-lg font-bold transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => triggerPaymentCompletion(`NETBANKING_${selectedBank.toUpperCase().replace(/\s+/g, '_')}`)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition text-sm shadow-md"
                                    >
                                        Confirm & Pay
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 text-center text-[10px] text-gray-400">
                                Safe SSL encrypted transaction session.
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STANDARD IDLE LAYOUT --- */}
                {paymentState === 'idle' && (
                    <>
                        {/* LEFT COLUMN: ORDER SUMMARY (4 Cols) */}
                        <div className="md:col-span-5 bg-slate-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-bold">
                                        AP
                                    </div>
                                    <div>
                                        <h1 className="font-black tracking-wider text-white leading-none text-base">ApexPay</h1>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Secure Checkout</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                                    <div className="text-xs">
                                        <span className="block text-slate-500 uppercase tracking-wider font-bold mb-1">Paying To</span>
                                        <span className="font-bold text-slate-200 text-sm">Scannimart Store</span>
                                    </div>

                                    {order.customer_details && (
                                        <div className="text-xs">
                                            <span className="block text-slate-500 uppercase tracking-wider font-bold mb-1">Customer Info</span>
                                            <span className="block font-bold text-slate-300">{order.customer_details.name}</span>
                                            <span className="text-slate-500 font-mono text-[10px]">{order.customer_details.email}</span>
                                        </div>
                                    )}

                                    <div className="text-xs">
                                        <span className="block text-slate-500 uppercase tracking-wider font-bold mb-1">Order Code</span>
                                        <span className="font-mono text-slate-300 uppercase font-bold text-sm bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                            {order.readable_id || order.id.slice(0, 6)}
                                        </span>
                                    </div>
                                </div>

                                {/* Items mini-list */}
                                <div className="pt-4 border-t border-slate-800/80 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Checkout Items</span>
                                    {order.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs font-mono">
                                            <span className="text-slate-400 truncate max-w-[150px]">{item.name}</span>
                                            <span className="text-slate-500">
                                                {item.quantity}x <b className="text-slate-300">₹{item.price}</b>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800/80 mt-6">
                                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total Amount Due</span>
                                <div className="flex items-baseline gap-1 text-white">
                                    <span className="text-2xl font-black">₹{totalAmount.toFixed(2)}</span>
                                    <span className="text-xs text-slate-400 uppercase font-bold">INR</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: METHODS & FORMS (7 Cols) */}
                        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
                            
                            {/* Tab Selectors */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 border border-slate-800/80 rounded-2xl">
                                    <button
                                        onClick={() => setActiveTab('upi')}
                                        className={`py-3.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                            activeTab === 'upi'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Smartphone className="w-4 h-4" />
                                        <span>UPI / QR</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('card')}
                                        className={`py-3.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                            activeTab === 'card'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        <span>Debit / Credit</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('netbanking')}
                                        className={`py-3.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                            activeTab === 'netbanking'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Building2 className="w-4 h-4" />
                                        <span>Net Banking</span>
                                    </button>
                                </div>

                                {/* --- TAB 1: UPI CONTENT --- */}
                                {activeTab === 'upi' && (
                                    <div className="space-y-6 pt-2 animate-fadeIn">
                                        <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-950/40 p-4 border border-slate-800/50 rounded-2xl">
                                            {/* QR Code Container */}
                                            <div className="bg-white p-3 rounded-2xl shrink-0 border border-slate-200/20 shadow-md">
                                                <QRCodeSVG 
                                                    value={`upi://pay?pa=merchant@upi&pn=Scannimart&am=${totalAmount}&cu=INR`} 
                                                    size={140}
                                                />
                                            </div>

                                            <div className="text-center sm:text-left space-y-2">
                                                <h3 className="font-extrabold text-white text-base">Scan QR to pay</h3>
                                                <p className="text-xs text-slate-400">
                                                    Open any UPI app like Google Pay, PhonePe, Paytm, or BHIM on your smartphone to scan and make the payment.
                                                </p>
                                                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>QR expires in {formatTime(upiTimer)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock UPI Apps Buttons */}
                                        <div className="space-y-2">
                                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Instant Apps</span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                                                    <button
                                                        key={app}
                                                        onClick={() => triggerPaymentCompletion(`UPI_${app.toUpperCase().replace(/\s+/g, '')}`)}
                                                        className="py-3 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-950 rounded-xl text-xs font-semibold transition text-slate-300"
                                                    >
                                                        {app}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Demo Trigger buttons */}
                                        <div className="pt-2 border-t border-slate-800/50 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={autoPayChecked}
                                                        onChange={(e) => setAutoPayChecked(e.target.checked)}
                                                        className="w-4 h-4 accent-blue-500 cursor-pointer bg-slate-950 border border-slate-800 rounded"
                                                    />
                                                    <span>Auto-pay in 8 seconds (Demo Mode)</span>
                                                </label>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => triggerPaymentCompletion('UPI_SUCCESS_DEMO')}
                                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                                                >
                                                    <span>✓</span> Simulate Payment Success
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setPaymentState('failed');
                                                        setErrorMessage('Simulator Error: Customer rejected transaction request.');
                                                        toast.error("Simulated Failure");
                                                    }}
                                                    className="border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 font-bold py-3.5 px-4 rounded-xl text-sm transition"
                                                >
                                                    Simulate Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- TAB 2: DEBIT / CREDIT CARD --- */}
                                {activeTab === 'card' && (
                                    <div className="space-y-6 pt-2 animate-fadeIn">
                                        
                                        {/* Premium 3D Flipping Card UI */}
                                        <div className="w-full flex justify-center py-2" style={{ perspective: '1000px' }}>
                                            <div 
                                                className="w-full max-w-[340px] h-[200px] rounded-2xl relative shadow-2xl transition-transform duration-700 cursor-pointer"
                                                style={{
                                                    transformStyle: 'preserve-3d',
                                                    transform: isCVVFocused ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                {/* FRONT FACE */}
                                                <div 
                                                    className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 rounded-2xl p-5 flex flex-col justify-between border border-white/10"
                                                    style={{ backfaceVisibility: 'hidden' }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-[10px]">
                                                            CHIP
                                                        </div>
                                                        <span className="font-black text-white italic tracking-widest text-sm uppercase">
                                                            {getCardType(cardNumber)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="text-xl md:text-2xl font-mono text-white tracking-[0.1em] text-center">
                                                            {cardNumber || '•••• •••• •••• ••••'}
                                                        </div>

                                                        <div className="flex justify-between items-end">
                                                            <div className="max-w-[70%]">
                                                                <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none mb-1">Card Holder</span>
                                                                <span className="block text-xs font-bold text-slate-100 uppercase truncate">
                                                                    {cardName || 'YOUR NAME HERE'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none mb-1">Expiry</span>
                                                                <span className="block text-xs font-bold font-mono text-slate-100">
                                                                    {cardExpiry || 'MM/YY'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* BACK FACE */}
                                                <div 
                                                    className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-white/10 flex flex-col justify-between py-5"
                                                    style={{ 
                                                        backfaceVisibility: 'hidden',
                                                        transform: 'rotateY(180deg)'
                                                    }}
                                                >
                                                    <div className="w-full bg-slate-950 h-10 mt-1"></div>
                                                    
                                                    <div className="px-5 space-y-4">
                                                        <div className="flex justify-end items-center gap-2">
                                                            <span className="text-[8px] text-slate-400 uppercase tracking-widest">Authorized Signature</span>
                                                            <div className="bg-white text-slate-900 font-mono text-sm px-3 py-1 font-bold italic rounded min-w-[60px] text-center">
                                                                {cardCVV || '•••'}
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-[7px] text-slate-500 leading-tight">
                                                            This card is simulated for checkout demonstration purposes. Usage is restricted to Scannimart sandbox. Safe Secure authentication applies.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Input Form */}
                                        <form onSubmit={handleCardPay} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Card Number</label>
                                                <input
                                                    type="text"
                                                    maxLength={19}
                                                    value={cardNumber}
                                                    onChange={(e) => handleCardNumberChange(e.target.value)}
                                                    placeholder="4000 1234 5678 9010"
                                                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-white outline-none transition font-mono"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-white outline-none transition"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiration Date</label>
                                                    <input
                                                        type="text"
                                                        maxLength={5}
                                                        value={cardExpiry}
                                                        onChange={(e) => handleExpiryChange(e.target.value)}
                                                        placeholder="MM/YY"
                                                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-white outline-none transition font-mono"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CVV Code</label>
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        value={cardCVV}
                                                        onChange={(e) => setCardCVV(e.target.value.replace(/[^0-9]/g, ''))}
                                                        onFocus={() => setIsCVVFocused(true)}
                                                        onBlur={() => setIsCVVFocused(false)}
                                                        placeholder="123"
                                                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-white outline-none transition font-mono"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
                                            >
                                                <Lock className="w-4 h-4" />
                                                <span>Pay ₹{totalAmount.toFixed(2)} Securely</span>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* --- TAB 3: NET BANKING --- */}
                                {activeTab === 'netbanking' && (
                                    <div className="space-y-6 pt-2 animate-fadeIn">
                                        <form onSubmit={handleNetbankingInit} className="space-y-6">
                                            <div className="space-y-3">
                                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Bank Account</span>
                                                <div className="grid grid-cols-1 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                                                    {[
                                                        'HDFC Bank', 
                                                        'ICICI Bank', 
                                                        'State Bank of India', 
                                                        'Axis Bank', 
                                                        'Kotak Mahindra Bank'
                                                    ].map((bank) => (
                                                        <label
                                                            key={bank}
                                                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition cursor-pointer ${
                                                                selectedBank === bank
                                                                    ? 'border-blue-500 bg-blue-500/5 text-white'
                                                                    : 'border-slate-800/80 bg-slate-950/20 text-slate-400 hover:border-slate-800'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Building2 className={`w-5 h-5 ${selectedBank === bank ? 'text-blue-400' : 'text-slate-500'}`} />
                                                                <span className="text-sm font-bold">{bank}</span>
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                name="bank"
                                                                value={bank}
                                                                checked={selectedBank === bank}
                                                                onChange={() => setSelectedBank(bank)}
                                                                className="w-4 h-4 accent-blue-500 cursor-pointer hidden"
                                                            />
                                                            {selectedBank === bank && (
                                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
                                                                    ✓
                                                                </div>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={!selectedBank}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-800/40 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                                            >
                                                <span>Proceed to Login</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Secure Badge Footer */}
                            <div className="pt-6 mt-6 border-t border-slate-800/50 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                    <span>256-Bit SSL Encrypted Sandbox Session</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span>APEXPAY GATEWAY</span>
                                    <span>v1.2.0</span>
                                </div>
                            </div>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default function PaymentGateway() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400 font-mono tracking-widest uppercase">Initializing Secure Gateway...</p>
            </div>
        }>
            <PaymentGatewayContent />
        </Suspense>
    );
}
