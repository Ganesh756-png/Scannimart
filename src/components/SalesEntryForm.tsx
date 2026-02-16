'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface SalesEntryFormProps {
    onSaleAdded: () => void;
}

export default function SalesEntryForm({ onSaleAdded }: SalesEntryFormProps) {
    const [formData, setFormData] = useState({
        itemName: '',
        quantity: 1,
        sellingPrice: '',
        costPrice: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName: formData.itemName,
                    quantity: Number(formData.quantity),
                    sellingPrice: Number(formData.sellingPrice),
                    costPrice: Number(formData.costPrice),
                    date: formData.date
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Sale recorded successfully!');
                setFormData({
                    itemName: '',
                    quantity: 1,
                    sellingPrice: '',
                    costPrice: '',
                    date: new Date().toISOString().split('T')[0]
                });
                onSaleAdded();
            } else {
                toast.error(data.error || 'Failed to record sale');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Record New Sale</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input
                        type="text"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="e.g. Potato Chips"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="1"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                        <input
                            type="number"
                            name="sellingPrice"
                            value={formData.sellingPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                        <input
                            type="number"
                            name="costPrice"
                            value={formData.costPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                    {loading ? 'Recording...' : 'Add Sale'}
                </button>
            </form>
        </div>
    );
}
