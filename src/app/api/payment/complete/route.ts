import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, paymentMethod, transactionId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Missing order ID' }, { status: 400 });
        }

        // 1. Check if order exists
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            console.error("Order fetch error on complete:", fetchError);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'paid' || order.status === 'verified') {
            return NextResponse.json({ success: true, message: 'Order already paid', order });
        }

        // 2. Update order status to paid and update payment method
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'paid',
                payment_method: paymentMethod || 'UPI'
            })
            .eq('id', orderId)
            .select()
            .single();

        if (updateError) {
            console.error("Order update error on complete:", updateError);
            throw updateError;
        }

        console.log(`Order ${orderId} successfully marked as PAID via ${paymentMethod}. Transaction: ${transactionId}`);

        return NextResponse.json({
            success: true,
            message: 'Payment completed successfully',
            order: updatedOrder
        }, { status: 200 });

    } catch (error: any) {
        console.error("Payment complete route error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
