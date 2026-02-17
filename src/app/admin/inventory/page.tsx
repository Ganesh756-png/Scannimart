'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ stock: number; weight: number }>({ stock: 0, weight: 0 });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Reusing the public products API for reading list
            const res = await fetch('/api/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (product: any) => {
        setEditingId(product.id);
        setEditValues({ stock: product.stock || 0, weight: product.weight || 0 });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveStock = async (id: string) => {
        const toastId = toast.loading('Updating...');
        try {
            const res = await fetch('/api/admin/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, stock: Number(editValues.stock), weight: Number(editValues.weight) })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Stock updated!', { id: toastId });
                // Update local state
                setProducts(products.map(p => p.id === id ? { ...p, stock: Number(editValues.stock), weight: Number(editValues.weight) } : p));
                setEditingId(null);
            } else {
                toast.error(data.message || 'Update failed', { id: toastId });
            }
        } catch (error) {
            toast.error('Server error', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Inventory Management</h1>
                    <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm md:text-base">
                        ← Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left min-w-[600px] md:min-w-full">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Product Name</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Weight</th>
                                    <th className="p-4">Current Stock</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Loading inventory...</td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">No products found.</td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-800">{product.name}</td>
                                            <td className="p-4 text-gray-600">₹{product.price}</td>
                                            <td className="p-4 text-gray-400">
                                                {editingId === product.id ? (
                                                    <input
                                                        type="number"
                                                        className="w-20 border-2 border-indigo-300 rounded px-2 py-1 outline-none focus:border-indigo-500 font-bold text-gray-700"
                                                        value={editValues.weight}
                                                        onChange={(e) => setEditValues({ ...editValues, weight: Number(e.target.value) })}
                                                        min="0"
                                                    />
                                                ) : (
                                                    <span>{product.weight}g</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {editingId === product.id ? (
                                                    <input
                                                        type="number"
                                                        className="w-24 border-2 border-indigo-300 rounded px-2 py-1 outline-none focus:border-indigo-500 font-bold"
                                                        value={editValues.stock}
                                                        onChange={(e) => setEditValues({ ...editValues, stock: Number(e.target.value) })}
                                                        min="0"
                                                    />
                                                ) : (
                                                    <span className={`font-bold px-3 py-1 rounded-full text-sm ${(product.stock || 0) <= 5 ? 'bg-red-100 text-red-700' :
                                                        (product.stock || 0) <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {product.stock || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {editingId === product.id ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => saveStock(product.id)}
                                                            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm font-bold"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => startEdit(product)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50"
                                                    >
                                                        Edit Stock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
