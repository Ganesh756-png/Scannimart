'use client';

interface RestockAlertsProps {
    data: { id: string, name: string, stock: number }[];
}

export default function RestockAlerts({ data }: RestockAlertsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col justify-center items-center">
                <span className="text-4xl mb-3 opacity-50">✅</span>
                <h3 className="text-lg font-bold text-gray-800">Inventory is Healthy</h3>
                <p className="text-sm text-gray-500 mt-1">No immediate restocking needed.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🚨</span>
                    <h3 className="text-lg font-bold text-gray-800">Predictive Restock</h3>
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {data.length} Action Needed
                </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">Items with critically low stock limits based on scan velocity.</p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {data.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex justify-between items-center transition-colors hover:bg-orange-50">
                        <div className="font-medium text-gray-800">
                            {item.name}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current</span>
                                <span className={`font-black text-lg ${item.stock <= 5 ? 'text-red-600' : 'text-orange-500'}`}>
                                    {item.stock}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
