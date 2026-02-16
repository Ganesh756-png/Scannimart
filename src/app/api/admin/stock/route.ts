import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role Key for Admin actions

export async function POST(req: Request) {
    try {
        const { id, stock } = await req.json();

        if (!id || typeof stock !== 'number') {
            return NextResponse.json({ success: false, message: 'Invalid Input' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
            .from('products')
            .update({ stock })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating stock:', error);
            return NextResponse.json({ success: false, message: 'Database Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Stock updated', data });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
