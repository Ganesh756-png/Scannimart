import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/products?barcode=...
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');

    try {
        if (barcode) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', barcode)
                .single();

            if (error || !data) {
                return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data });
        } else {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// POST /api/products
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.name || !body.price || !body.barcode) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    name: body.name,
                    price: parseFloat(body.price),
                    barcode: body.barcode,
                    weight: parseFloat(body.weight || '0'),
                    stock: parseInt(body.stock || '0'),
                    variants: body.variants || null, // JSONB array of {name, price, barcode_suffix}
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Postgres unique violation code
                return NextResponse.json({ success: false, error: 'Duplicate barcode' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to add product' }, { status: 500 });
    }
}
