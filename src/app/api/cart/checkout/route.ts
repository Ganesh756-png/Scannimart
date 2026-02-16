import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
        }

        let calculatedTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.productId)
                .single();

            if (!product) {
                return NextResponse.json({ success: false, message: `Product not found: ${item.name}` }, { status: 404 });
            }

            // --- STOCK CHECK ---
            if ((product.stock || 0) < item.quantity) {
                return NextResponse.json({
                    success: false,
                    message: `Out of Stock: ${product.name} (Only ${product.stock || 0} left)`
                }, { status: 400 });
            }

            calculatedTotal += product.price * item.quantity;
            orderItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: product.price,
                name: product.name,
                weight: product.weight || 0, // Add weight (default 0 if missing)
            });
        }

        // Create Order
        const { data: order, error } = await supabase
            .from('orders')
            .insert([
                {
                    items: orderItems,
                    total_amount: calculatedTotal,
                    status: 'paid', // Simulating successful payment
                    payment_method: 'Manual',
                    qr_code_string: `CHECKOUT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    readable_id: Math.random().toString(36).substring(2, 8).toUpperCase(), // Generate 6-char Short ID
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // --- DECREMENT STOCK ---
        // Since we already validated stock, we can safely decrement now (though race conditions exist, acceptable for prototype)
        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.productId)
                .single();

            if (product) {
                await supabase
                    .from('products')
                    .update({ stock: (product.stock || 0) - item.quantity })
                    .eq('id', item.productId);
            }
        }

        return NextResponse.json({ success: true, order: order });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
