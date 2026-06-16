import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Define static presets for demo purposes
const PRESETS: Record<string, { barcode: string; quantity: number; confidence: number }[]> = {
    'chips_and_soda': [
        { barcode: '1234567890', quantity: 1, confidence: 0.98 }, // Potato Chips
        { barcode: '0987654321', quantity: 1, confidence: 0.95 }  // Soda Can
    ],
    'soda_and_chocolate': [
        { barcode: '0987654321', quantity: 1, confidence: 0.97 }, // Soda Can
        { barcode: '1122334455', quantity: 2, confidence: 0.94 }  // Chocolate Bar
    ],
    'chips_and_water': [
        { barcode: '1234567890', quantity: 1, confidence: 0.96 }, // Potato Chips
        { barcode: '5544332211', quantity: 1, confidence: 0.98 }  // Water Bottle
    ],
    'all_products': [
        { barcode: '1234567890', quantity: 1, confidence: 0.95 },
        { barcode: '0987654321', quantity: 1, confidence: 0.96 },
        { barcode: '1122334455', quantity: 1, confidence: 0.92 },
        { barcode: '5544332211', quantity: 1, confidence: 0.97 }
    ],
    'extra_cola': [
        { barcode: '0987654321', quantity: 2, confidence: 0.98 }  // 2x Soda Can (mismatch)
    ],
    'unbilled_chocolate': [
        { barcode: '0987654321', quantity: 1, confidence: 0.98 }, // Soda Can (billed)
        { barcode: '1122334455', quantity: 1, confidence: 0.95 }  // Chocolate Bar (unbilled)
    ]
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64, demoPreset } = body;

        if (!imageBase64) {
            return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
        }

        // 1. Fetch products from DB (we need this context for both AI and fallback matching)
        const { data: products, error: dbError } = await supabase.from('products').select('*');
        if (dbError) throw dbError;

        const catalogStr = products?.map(p => `- ${p.name} (Barcode: ${p.barcode}, Price: ${p.price})`).join('\n') || 'No products in database.';

        let detectedItems = [];
        let isUsingFallback = false;

        // Check if demoPreset is specified or if GEMINI_API_KEY is not set
        const apiKey = process.env.GEMINI_API_KEY;
        if (demoPreset || !apiKey) {
            isUsingFallback = true;
            console.log(`Using vision fallback. Preset: ${demoPreset || 'default (chips_and_soda)'}`);
            const presetKey = demoPreset && PRESETS[demoPreset] ? demoPreset : 'chips_and_soda';
            detectedItems = PRESETS[presetKey];
        } else {
            // Run real Gemini Vision API
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    generationConfig: {
                        responseMimeType: 'application/json'
                    }
                });

                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

                const prompt = `
You are an AI checkout assistant for a smart shopping system.
You will be provided with an image of a shopping trolley or basket containing various items.

Here is the store's current product catalog:
${catalogStr}

Identify all the products in the image and match them against the catalog. 
If an item in the image looks very similar to an item in the catalog, assume it is that item.
Estimate the quantity of each distinct item.

Return a JSON array of objects, where each object has:
barcode: "the exact barcode from the catalog"
name: "the product name from the catalog"
quantity: estimated_integer_quantity
confidence: standard_confidence_score_0_to_1

If no items are detected or matched, return an empty array [].
`;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: 'image/jpeg'
                        }
                    }
                ]);

                const responseText = result.response.text();
                detectedItems = JSON.parse(responseText.trim());
            } catch (error) {
                console.warn("Gemini call failed, switching to demo fallback:", error);
                isUsingFallback = true;
                detectedItems = PRESETS['chips_and_soda'];
            }
        }

        // 2. Hydrate the detected items with full product data
        const hydratedItems = detectedItems.map((item: any) => {
            const productData = products?.find(p => p.barcode === item.barcode);
            if (productData) {
                return {
                    ...productData,
                    detectedQuantity: item.quantity || 1,
                    confidence: item.confidence || 0.8
                };
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json({ 
            success: true, 
            items: hydratedItems, 
            raw: detectedItems,
            isUsingFallback 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Vision API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Vision processing failed' }, { status: 500 });
    }
}
