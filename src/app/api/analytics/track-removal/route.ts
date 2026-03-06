import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productName, quantity } = body;

        if (!productName || !quantity) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('cart_removals')
            .insert([
                {
                    product_name: productName,
                    quantity: parseInt(quantity)
                }
            ]);

        if (error) {
            // Check if table doesn't exist yet (user hasn't run the SQL script)
            if (error.code === '42P01') {
                console.warn('cart_removals table not created yet. Skipping tracking.');
                return NextResponse.json({ success: true, warning: 'Table not found, tracking skipped' });
            }
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error tracking cart removal:', error);
        return NextResponse.json({ success: false, error: 'Failed to track removal' }, { status: 500 });
    }
}
