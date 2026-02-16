import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                success: false,
                message: "Gemini API Key is missing. Please add it to .env.local"
            }, { status: 500 });
        }

        // 1. Fetch Product Context
        const { data: products, error } = await supabase
            .from('products')
            .select('name, price, stock, barcode');

        if (error) {
            console.error("Supabase Product Fetch Error:", error);
            // Continue even if DB fails, just won't have product context
        }

        // 2. Construct System Prompt
        const productContext = products
            ? products.map(p => `- ${p.name} (₹${p.price}) - Stock: ${p.stock}`).join('\n')
            : "No product data available.";

        const systemPrompt = `You are a helpful Shop-Bot assistant for "Scan N Mart".
        
        Your Goal: Help customers find products, check prices, and give shopping advice.
        
        Current Product Inventory:
        ${productContext}
        
        Rules:
        1. Only recommend products from the inventory list above.
        2. If a user asks for something not in the list, politely say we don't have it.
        3. Be concise and friendly.
        4. Prices differ per item. Always quote the exact price from the list.
        5. If asked about the store, say we are an AI-powered smart store.
        
        User Question: ${message}`;

        // 3. Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Response:", text);

        return NextResponse.json({ success: true, reply: text });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({
            success: false,
            message: `Error: ${error.message || error.toString()}`
        }, { status: 500 });
    }
}
