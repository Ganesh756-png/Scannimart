'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';

export default function OffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discount: '',
        code: ''
    });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/offers');
            const data = await res.json();
            if (data.success) {
                setOffers(data.data);
            }
        } catch (error) {
            toast.error('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;

        try {
            const res = await fetch(`/api/offers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Offer deleted');
                setOffers(offers.filter(offer => offer.id !== id));
            } else {
                toast.error('Failed to delete offer');
            }
        } catch (error) {
            toast.error('Error deleting offer');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.discount) {
            toast.error('Title and Discount are required');
            return;
        }

        try {
            const res = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Offer created successfully!');
                setOffers([...offers, data.data]);
                setFormData({ title: '', description: '', discount: '', code: '' });
                setActiveTab('list');
            } else {
                toast.error(data.message || 'Failed to create offer');
            }
        } catch (error) {
            toast.error('Error creating offer');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Offers</h1>
                    <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Active Offers
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Create New Offer
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'list' ? (
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Loading offers...</div>
                                ) : offers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No active offers found. Create one!</div>
                                ) : (
                                    offers.map((offer) => (
                                        <div key={offer.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{offer.title}</h3>
                                                <p className="text-gray-600">{offer.description}</p>
                                                <div className="mt-2 flex gap-3 text-sm">
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">{offer.discount} OFF</span>
                                                    {offer.code && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono border border-purple-200">{offer.code}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(offer.id)}
                                                className="mt-4 md:mt-0 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Offer Title *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Summer Sale"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Description</label>
                                    <textarea
                                        placeholder="Brief details about the offer..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Discount *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 20% or ₹500"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Promo Code (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. SUMMER20"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg mt-4"
                                >
                                    Create Offer
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
