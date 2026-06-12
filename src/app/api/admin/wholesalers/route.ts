import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('wholesalers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, phone } = body;

        if (!name || !email || !phone) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('wholesalers')
            .insert([{ name, email, phone }])
            .select()
            .single();

        if (error) throw error;

        // Auto-seed some stock for this new wholesaler so the demo works right away
        const mockStocks = [
            { wholesaler_id: data.id, product_name: 'Bulk Potato Chips', price: 15, stock: 500 },
            { wholesaler_id: data.id, product_name: 'Bulk Soda Cans', price: 30, stock: 1000 }
        ];

        await supabase.from('wholesaler_stocks').insert(mockStocks);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
