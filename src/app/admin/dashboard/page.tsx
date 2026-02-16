'use client';

import { useState, useEffect } from 'react';
import QRScanner from '@/components/QRScanner';
import { Toaster, toast } from 'react-hot-toast';
import SalesEntryForm from '@/components/SalesEntryForm';
import SalesChart from '@/components/SalesChart';
import AiInsightCard from '@/components/AiInsightCard';

interface Product {
    id: string;
    name: string;
    price: number;
    barcode: string;
    stock: number;
}

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', barcode: '', stock: '' });
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [salesData, setSalesData] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await fetch('/api/sales');
            const data = await res.json();
            if (data.success) {
                setSalesData(data.sales);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            } else {
                toast.error('Failed to load products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error loading products');
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...newProduct,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock) || 0
        };

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                setNewProduct({ name: '', price: '', barcode: '', stock: '' });
                fetchProducts();
                toast.success('Product added successfully!');
            } else {
                toast.error(data.error || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setNewProduct(prev => ({ ...prev, barcode: decodedText }));
        setShowScanner(false);
        toast.success('Barcode scanned!');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-indigo-900 drop-shadow-sm">
                    Store Admin Dashboard
                </h1>
                <div className="flex gap-4">
                    <a
                        href="/admin/inventory"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2"
                    >
                        <span>📦</span> Manage Inventory
                    </a>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            toast.success('Logged out');
                            // Clear local storage as well just in case
                            localStorage.removeItem('user');
                            window.location.href = '/admin/login';
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Product Section */}
                <div className="bg-white p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Add New Product</h2>

                    {/* Scanner Toggle */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => setShowScanner(!showScanner)}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-md flex justify-center items-center gap-2"
                        >
                            {showScanner ? 'Close Scanner' : 'Scan Barcode / QR Code'}
                        </button>

                        {showScanner && (
                            <div className="mt-4 p-4 bg-gray-100 rounded-xl animate-fade-in">
                                <QRScanner onScanSuccess={handleScanSuccess} />
                                <p className="text-center text-sm text-gray-500 mt-2">Point camera at a barcode</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-5">
                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Super Widget"
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                                value={newProduct.name}
                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    required
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                                    value={newProduct.stock}
                                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                            <input
                                type="text"
                                placeholder="Scan or type barcode"
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white font-mono"
                                value={newProduct.barcode}
                                onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white py-3 rounded-xl font-bold text-lg shadow-lg transform transition-transform active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {loading ? 'Adding...' : 'Add Product'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="font-bold text-gray-500 mb-3 text-sm uppercase tracking-wide">Developer Tools</h3>
                        <button
                            onClick={async () => {
                                if (!confirm('Are you sure you want to reset the database? This will verify connection and seed dummy data.')) return;
                                try {
                                    const res = await fetch('/api/seed', { method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                        fetchProducts();
                                        toast.success('Database reset successfully');
                                    } else {
                                        toast.error('Failed to reset database');
                                    }
                                } catch (e) {
                                    toast.error('Error resetting database');
                                }
                            }}
                            className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors"
                        >
                            Re-seed Database (Reset & Poplulate)
                        </button>
                    </div>
                </div>

                {/* Product List Section */}
                <div className="bg-white p-8 rounded-2xl shadow-xl h-fit">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
                        <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                            {products.length} Items
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-semibold">Name</th>
                                        <th className="p-4 font-semibold">Price</th>
                                        <th className="p-4 font-semibold">Barcode</th>
                                        <th className="p-4 font-semibold text-center">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                No products found. Add one or seed the database.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((p) => (
                                            <tr key={p.id} className="hover:bg-indigo-50 transition-colors group">
                                                <td className="p-4 font-medium text-gray-900 group-hover:text-indigo-700">
                                                    {p.name}
                                                </td>
                                                <td className="p-4 text-green-600 font-semibold">
                                                    ₹{p.price}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border">
                                                        {p.barcode}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock > 10 ? 'bg-green-100 text-green-800' : p.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {p.stock}
                                                    </span>
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

            {/* Sales Dashboard Section */}
            <div className="mt-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-extrabold text-indigo-900 drop-shadow-sm flex items-center gap-3">
                        <span className="text-4xl">📈</span> Sales & Analytics Dashboard
                    </h2>
                    <button
                        onClick={() => {
                            if (salesData.length === 0) {
                                toast.error('No sales data to export');
                                return;
                            }

                            // 1. Convert to CSV
                            const headers = ['Date', 'Item Name', 'Quantity', 'Selling Price', 'Cost Price', 'Total Revenue', 'Total Profit'];
                            const csvRows = [
                                headers.join(','), // Header row
                                ...salesData.map((sale: any) => [
                                    new Date(sale.date).toLocaleDateString(),
                                    `"${sale.itemName.replace(/"/g, '""')}"`, // Escape quotes
                                    sale.quantity,
                                    sale.sellingPrice,
                                    sale.costPrice,
                                    sale.totalRevenue,
                                    sale.totalProfit
                                ].join(','))
                            ];
                            const csvString = csvRows.join('\n');

                            // 2. Trigger Download
                            const blob = new Blob([csvString], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                            toast.success('Report downloaded');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 text-sm transition-colors"
                    >
                        <span>⬇️</span> Download CSV
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Entry Form & AI Insight */}
                    <div className="space-y-8">
                        <SalesEntryForm onSaleAdded={fetchSales} />
                        <AiInsightCard />
                    </div>

                    {/* Right Column: Charts */}
                    <div className="lg:col-span-2">
                        <SalesChart data={salesData} />

                        {/* Recent Sales List */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Sales Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Item</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Revenue</th>
                                            <th className="p-3 text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {salesData.slice(0, 5).map((sale: any) => (
                                            <tr key={sale.id} className="hover:bg-gray-50">
                                                <td className="p-3">{new Date(sale.date).toLocaleDateString()}</td>
                                                <td className="p-3 font-medium text-gray-900">{sale.itemName}</td>
                                                <td className="p-3 text-center">{sale.quantity}</td>
                                                <td className="p-3 text-right font-mono">₹{sale.totalRevenue}</td>
                                                <td className="p-3 text-right font-mono text-green-600">₹{sale.totalProfit}</td>
                                            </tr>
                                        ))}
                                        {salesData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-gray-500">No sales recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c7c7c7;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
