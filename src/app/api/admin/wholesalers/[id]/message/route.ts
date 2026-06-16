import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { message_body } = body;

        if (!message_body) {
            return NextResponse.json({ success: false, error: 'Message payload is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('wholesaler_messages')
            .insert([{ 
                wholesaler_id: id, 
                message_body 
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
