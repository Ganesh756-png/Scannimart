'use client';

interface RemovedItemsListProps {
    data: { name: string, count: number }[];
}

export default function RemovedItemsList({ data }: RemovedItemsListProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🗑️</span>
                    <h3 className="text-lg font-bold text-gray-800">Frequently Removed</h3>
                </div>
                <div className="text-center text-gray-500 py-6">No items have been removed yet.</div>
            </div>
        );
    }

    // Check if waiting for DB setup
    if (data.length === 1 && data[0].name === 'Pending DB Setup') {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-orange-200 bg-orange-50 h-full flex flex-col justify-center items-center text-center">
                <span className="text-3xl mb-2">⚠️</span>
                <h3 className="font-bold text-orange-800 mb-1">SQL Setup Required</h3>
                <p className="text-sm text-orange-600">Run the provided SQL script in Supabase to start tracking removals.</p>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🗑️</span>
                    <h3 className="text-lg font-bold text-gray-800">Frequently Removed</h3>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">Top 5</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col gap-1">
                        <div className="flex justify-between items-end text-sm">
                            <span className="font-medium text-gray-700 truncate pr-2">{item.name}</span>
                            <span className="text-red-500 font-bold">{item.count}x</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className="bg-red-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
