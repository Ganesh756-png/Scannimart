'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PeakHoursChartProps {
    data: { hour: string, count: number }[];
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl">No peak hour data available yet.</div>;
    }

    return (
        <div className="h-72 w-full bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⏰</span>
                <h3 className="text-lg font-bold text-gray-800">Peak Shopping Hours</h3>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: -20, bottom: 5, }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#8B5CF6"
                            name="Orders/Sales"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
