import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ code: string }> }
) {
    const params = await props.params;
    const { code } = params;

    try {
        // 'code' here is likely the Order ID based on our previous refactor
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', code)
            .single();

        if (error || !order) {
            return NextResponse.json({ success: false, message: 'Invalid QR Code: Order not found' }, { status: 404 });
        }

        if (order.status === 'verified') {
            return NextResponse.json({ success: true, message: 'Warning: This order has already been verified/exited!', data: order });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Invalid QR Code format', error: error.message }, { status: 400 });
    }
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ code: string }> }
) {
    // Action to mark as verified/exited
    const params = await props.params;
    const { code } = params;

    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', code)
            .single();

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'verified' })
            .eq('id', code);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Verified successfully. Customer may exit.', data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
