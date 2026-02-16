import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        // Fetch recent sales data (limit to last 50 for context window)
        // Adjust column names to match Supabase schema (snake_case)
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .order('sale_date', { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        if (!sales || sales.length === 0) {
            return NextResponse.json({ success: false, error: 'No sales data available for analysis' }, { status: 400 });
        }

        // Format data for the prompt
        const salesSummary = sales.map(s =>
            `- ${new Date(s.sale_date).toISOString().split('T')[0]}: Sold ${s.quantity}x ${s.item_name} (Revenue: ${s.total_revenue}, Profit: ${s.total_profit})`
        ).join('\n');

        const prompt = `
            Analyze the following sales data for a local shop called "Scannimart" and provide 3-4 actionable business insights.
            Focus on trends, best-selling items, and profitability.
            
            Sales Data:
            ${salesSummary}
            
            Provide the response in simple bullet points.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-flash-latest as it is the current standard and widely accessible
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, analysis: text });

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate insights: ' + error.message }, { status: 500 });
    }
}
