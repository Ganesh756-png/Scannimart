import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/offers - Fetch all active offers
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST /api/offers - Create a new offer
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, discount, code } = body;

        if (!title || !discount) {
            return NextResponse.json({ success: false, message: 'Title and Discount are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('offers')
            .insert([
                {
                    title,
                    description: description || '',
                    discount,
                    code: code || '',
                    active: true
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE /api/offers?id=... - Delete an offer
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Offer deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

