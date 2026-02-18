'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function TestBarcodesPage() {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (data.success) {
                    setProducts(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            }
        }
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Product Barcodes</h1>
                        <p className="text-gray-500 mt-2">Scan these codes to simulate shopping.</p>
                    </div>
                    <Link href="/customer/scan" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                        Back to Scanner
                    </Link>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-blue-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-lg mb-2">How to test:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>This page lists <strong>ALL products</strong> currently in your database.</li>
                                <li>Open this page on a laptop and scan these codes with your phone (Customer App).</li>
                                <li>Or use the Admin Dashboard to add more products, and they will appear here automatically.</li>
                            </ul>
                        </div>
                        <button
                            onClick={async () => {
                                if (!confirm("Create 'Test Biscuit' with variants?")) return;
                                try {
                                    const res = await fetch('/api/products', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            name: 'Test Biscuit',
                                            price: 10,
                                            barcode: `TEST-BISCUIT-${Date.now().toString().slice(-4)}`,
                                            weight: 50,
                                            stock: 100,
                                            variants: [
                                                { name: 'Small', price: 10, weight: 50 },
                                                { name: 'Large', price: 20, weight: 100 }
                                            ]
                                        })
                                    });
                                    if (res.ok) {
                                        alert('Product Created! Refreshing...');
                                        window.location.reload();
                                    } else {
                                        const err = await res.json();
                                        alert('Error: ' + err.error);
                                    }
                                } catch (e) {
                                    alert('Failed to connect to API');
                                }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 shadow transition text-sm"
                        >
                            + Create "Variant Product"
                        </button>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Loading products...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p: any) => (
                            <div key={p.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{p.name}</h3>
                                <p className="text-green-600 font-bold mb-4">₹{p.price}</p>

                                <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                                    <QRCodeSVG value={p.barcode || p.code || "unknown"} size={150} />
                                </div>

                                <div className="bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-500 w-full break-all">
                                    {p.barcode}
                                </div>
                                <div className="mt-2 text-xs text-gray-400">
                                    Stock: {p.stock}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
