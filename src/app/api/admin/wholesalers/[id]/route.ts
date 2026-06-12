import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // Fetch wholesaler details
        const { data: wholesaler, error: wError } = await supabase
            .from('wholesalers')
            .select('*')
            .eq('id', id)
            .single();

        if (wError) throw wError;

        // Fetch their stock
        const { data: stock, error: sError } = await supabase
            .from('wholesaler_stocks')
            .select('*')
            .eq('wholesaler_id', id)
            .order('created_at', { ascending: false });

        if (sError) throw sError;

        // Fetch their message history
        const { data: messages, error: mError } = await supabase
            .from('wholesaler_messages')
            .select('*')
            .eq('wholesaler_id', id)
            .order('created_at', { ascending: false });

        if (mError) throw mError;

        return NextResponse.json({ 
            success: true, 
            data: {
                ...wholesaler,
                stock: stock || [],
                messages: messages || []
            } 
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
