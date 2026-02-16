'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function AiInsightCard() {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInsight = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/sales/analyze', {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                setInsight(data.analysis);
            } else {
                setError(data.error || 'Failed to generate insights');
            }
        } catch (err) {
            console.error('AI Insight Error:', err);
            setError('Failed to connect to AI service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl shadow-md border border-purple-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">AI Business Insights</h3>
                </div>
                <button
                    onClick={generateInsight}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${loading
                            ? 'bg-purple-300 text-white cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200'
                        }`}
                >
                    {loading ? 'Analyzing...' : 'Generate Insights'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            {insight ? (
                <div className="prose prose-purple max-w-none text-gray-700 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                    <div style={{ whiteSpace: 'pre-line' }}>{insight}</div>
                </div>
            ) : (
                !loading && !error && (
                    <p className="text-gray-500 text-sm italic">
                        Click the button to generate AI-powered insights based on your recent sales data.
                    </p>
                )
            )}
        </div>
    );
}
