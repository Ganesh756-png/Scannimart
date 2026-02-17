import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabase as publicSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, stock } = body;

        if (!id || typeof stock !== 'number') {
            return NextResponse.json({ success: false, message: 'Invalid Input' }, { status: 400 });
        }

        let supabase = publicSupabase;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

        // Prefer Service Role Header for Admin actions if available
        if (serviceKey && url) {
            try {
                supabase = createClient(url, serviceKey);
            } catch (e) {
                console.error("Failed to init admin client, using public", e);
            }
        }

        const { data, error } = await supabase
            .from('products')
            .update({ stock })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating stock:', error);
            return NextResponse.json({ success: false, message: error.message || 'Database Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Stock updated', data });

    } catch (error: any) {
        console.error("Server error handling stock update:", error);
        return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
    }
}
