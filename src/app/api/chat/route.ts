import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Simple in-memory cache to reduce Supabase latency
let cachedProducts: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                success: false,
                message: "Gemini API Key is missing. Please add it to .env.local"
            }, { status: 500 });
        }

        // 1. Fetch Product Context (with Caching)
        const now = Date.now();
        if (!cachedProducts || (now - lastFetchTime > CACHE_DURATION)) {
            console.log("Fetching products from Supabase (Cache Expired or Empty)...");
            const { data: products, error } = await supabase
                .from('products')
                .select('name, price, stock, barcode');

            if (error) {
                console.error("Supabase Product Fetch Error:", error);
                // Use stale cache if available, otherwise empty array
                if (!cachedProducts) cachedProducts = [];
            } else {
                cachedProducts = products;
                lastFetchTime = now;
            }
        } else {
            console.log("Using cached products.");
        }

        // 2. Construct System Prompt
        const productContext = cachedProducts && cachedProducts.length > 0
            ? cachedProducts.map((p: any) => `- ${p.name} (₹${p.price}) - ${(p.stock > 0 ? 'In Stock' : 'Out of Stock')}`).join('\n')
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

        // 3. Call Gemini API with Timeout
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending prompt to Gemini...");
        
        // Race the API call against a timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out")), 10000)
        );

        const resultPromise = model.generateContent(systemPrompt);

        const result: any = await Promise.race([resultPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Response:", text);

        return NextResponse.json({ success: true, reply: text });

    } catch (error: any) {
        console.error("Chat API Error:", error);

        // Graceful fallback for timeouts
        if (error.message === "Request timed out") {
            return NextResponse.json({ 
                success: true, 
                reply: "I'm thinking a bit too hard right now! Please ask me again." 
            });
        }

        return NextResponse.json({
            success: false,
            message: `Error: ${error.message || error.toString()}`
        }, { status: 500 });
    }
}
