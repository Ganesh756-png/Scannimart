'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function SecurityLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('Attempting Security Login:', email);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'security' })
            });

            console.log('Security Login Response Status:', res.status);

            if (!res.ok) {
                const text = await res.text();
                console.error('Security Login Error Body:', text);
                try {
                    const data = JSON.parse(text);
                    throw new Error(data.error || 'Login failed');
                } catch (e) {
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
            }

            const data = await res.json();
            console.log('Security Login Success Data:', data);

            if (data.success) {
                toast.success('Security Access Granted');
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                setTimeout(() => {
                    // Redirect to security dashboard (assuming /security/scan or similar)
                    router.push('/security/scan');
                }, 1000);
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (error: any) {
            console.error('Security Login Exception:', error);
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-mono">
            <Toaster position="top-right" />
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg border-l-4 border-yellow-500">
                <div>
                    <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 uppercase tracking-wider">
                        Security Login
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Checkpoint Access System
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Badge ID / Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                placeholder="Security Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-yellow-400' : 'bg-yellow-600 hover:bg-yellow-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors uppercase`}
                        >
                            {loading ? 'Verifying...' : 'Access Checkpoint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
