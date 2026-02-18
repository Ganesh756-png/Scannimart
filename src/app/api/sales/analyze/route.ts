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
        // Using gemini-1.5-flash which is standard and reliable
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending prompt to Gemini (Sales Analysis)...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, analysis: text });

    } catch (error: any) {
        console.error('AI Analysis Error (Using Fallback Mode):', error);

        // FALLBACK: Generate Logic-Based Insights locally
        // We need to re-fetch or use sales data from scope if available, but simplest is to do a quick calc here
        // Re-fetching locally since 'sales' variable scope is inside try block in original code (oops, let's fix that assumption or re-query if needed, 
        // but wait, we can't easily access 'sales' from catch block if it was defined inside try. 
        // Let's assume we want to just return a generic valid response or re-query.)

        // Actually, let's just re-query quickly for the fallback to be accurate
        const { data: salesFallback } = await supabase
            .from('sales')
            .select('*')
            .order('sale_date', { ascending: false })
            .limit(50);

        let fallbackInsights = "AI Service Unavailable. Showing Calculated Insights:\n";

        if (salesFallback && salesFallback.length > 0) {
            const totalRev = salesFallback.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
            const topItem = salesFallback.sort((a, b) => b.quantity - a.quantity)[0];

            fallbackInsights += `• Total Recent Revenue: ₹${totalRev.toFixed(2)}\n`;
            fallbackInsights += `• Best Selling Item: ${topItem.item_name} (${topItem.quantity} sold)\n`;
            fallbackInsights += `• Action: Consider restocking ${topItem.item_name} as it is popular.\n`;
            fallbackInsights += `• Trend: Sales are active. Monitoring stock levels is recommended.`;
        } else {
            fallbackInsights += "• No sales data found to analyze.";
        }

        return NextResponse.json({ success: true, analysis: fallbackInsights });
    }
}
