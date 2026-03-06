'use client';

interface DiscrepancyCardProps {
    rate: number;
    recent: any[];
}

export default function DiscrepancyCard({ rate, recent }: DiscrepancyCardProps) {

    // Check if waiting for DB setup
    if (rate === 0 && recent.length === 0 && !Array.isArray(recent)) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-red-200 bg-red-50 flex flex-col justify-center items-center text-center">
                <span className="text-3xl mb-2">⚠️</span>
                <h3 className="font-bold text-red-800 mb-1">SQL Setup Required</h3>
                <p className="text-sm text-red-600">Run the provided SQL script to track AI scanner discrepancies.</p>
            </div>
        );
    }

    const isHigh = rate > 5; // Example threshold: 5% is bad
    const isGood = rate < 2;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <h3 className="text-lg font-bold text-gray-800">AI Discrepancy Rate</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Percentage of orders where the AI trolley scanner caught unbilled items.</p>

                <div className="flex items-end gap-3 mb-6">
                    <span className={`text-5xl font-extrabold ${isHigh ? 'text-red-600' : isGood ? 'text-green-600' : 'text-orange-500'}`}>
                        {rate.toFixed(1)}%
                    </span>
                    {isHigh && <span className="text-sm font-bold bg-red-100 text-red-800 px-2 py-1 rounded mb-1 animate-pulse">Needs Review</span>}
                    {isGood && <span className="text-sm font-bold bg-green-100 text-green-800 px-2 py-1 rounded mb-1">Excellent</span>}
                </div>
            </div>

            <div className="mt-auto">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">Recent AI Catches</h4>
                {(!recent || recent.length === 0) ? (
                    <p className="text-sm text-gray-400">No discrepancies recorded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {recent.map((d: any, i: number) => (
                            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm flex justify-between items-center group">
                                <div className="flex flex-col">
                                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 w-fit px-1 rounded border border-indigo-100 mb-1">
                                        {d.order_id?.substring(0, 8)}...
                                    </span>
                                    <span className="text-gray-600 text-xs italic">{d.notes || 'Unbilled items found'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-500 mb-1">Conf. Score</span>
                                    <span className={`font-bold ${d.discrepancy_score > 80 ? 'text-red-600' : 'text-orange-500'}`}>
                                        {d.discrepancy_score}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
