'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
    data: any[];
}

export default function SalesChart({ data }: SalesChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No sales data available for chart.</div>;
    }

    // Aggregate data by date
    const aggregatedData = data.reduce((acc: any, curr: any) => {
        const date = new Date(curr.date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date, revenue: 0, profit: 0 };
        }
        acc[date].revenue += curr.totalRevenue;
        acc[date].profit += curr.totalProfit;
        return acc;
    }, {});

    const chartData = Object.values(aggregatedData);

    return (
        <div className="h-80 w-full bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Trends (Revenue vs Profit)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4F46E5" name="Revenue" />
                    <Bar dataKey="profit" fill="#10B981" name="Profit" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
