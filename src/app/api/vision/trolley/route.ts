import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash for fastest vision
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Strip the data:image/...;base64, prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        // 1. Fetch all products from our DB to give Gemini context so it can match names exactly
        const { data: products, error: dbError } = await supabase.from('products').select('*');
        if (dbError) throw dbError;

        const catalogStr = products?.map(p => `- ${p.name} (Barcode: ${p.barcode}, Price: ${p.price})`).join('\n') || 'No products in database.';

        const prompt = `
You are an AI checkout assistant for a smart shopping system.
You will be provided with an image of a shopping trolley or basket containing various items.

Here is the store's current product catalog:
${catalogStr}

Identify all the products in the image and match them against the catalog. 
If an item in the image looks very similar to an item in the catalog, assume it is that item.
Estimate the quantity of each distinct item.

Return a JSON array of objects, where each object has:
{
  "barcode": "the exact barcode from the catalog",
  "name": "the product name from the catalog",
  "quantity": estimated_integer_quantity,
  "confidence": standard_confidence_score_0_to_1
}

ONLY output the JSON code block, do not output any markdown formatting or extra text.
If no items are detected or matched, return [].
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

        // Clean JSON string
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);

        let detectedItems = [];
        try {
            detectedItems = JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return NextResponse.json({ success: false, error: 'AI parsing failed' }, { status: 500 });
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


        return NextResponse.json({ success: true, items: hydratedItems, raw: detectedItems });

    } catch (error: any) {
        console.error('Vision API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Vision processing failed' }, { status: 500 });
    }
}
