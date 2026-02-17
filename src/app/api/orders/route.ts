import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, paymentMethod } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Verify items and calculate total from DB prices
        for (const item of items) {
            // Using 'product' as the ID field from frontend, but in DB it's '_id' or 'id'.
            // In Supabase, we used 'id'.
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.product)
                .single();

            if (!product) {
                // Try finding by _id if migration kept old IDs? No, we are using new UUIDs.
                // If frontend sends old IDs, this might break until we clear cart.
                return NextResponse.json({ success: false, message: `Product not found: ${item.product}` }, { status: 404 });
            }

            orderItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: product.price,
                name: product.name
            });
            totalAmount += product.price * item.quantity;
        }

        // Create Order
        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert([
                {
                    items: orderItems, // JSONB
                    total_amount: totalAmount,
                    status: (paymentMethod === 'CASH') ? 'pending_payment' : 'paid',
                    payment_method: paymentMethod || 'UPI',
                    qr_code_string: `ORDER-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase Order Insert Error:", error);
            throw error;
        }

        console.log("Order Created Successfully:", newOrder.id, "QR:", newOrder.qr_code_string);

        // Record Sale (Analytics) for each item
        const salesInserts = orderItems.map(item => ({
            item_name: item.name,
            quantity: item.quantity,
            selling_price: item.price,
            cost_price: item.price * 0.7, // Mock cost price
            total_revenue: item.price * item.quantity,
            total_profit: (item.price * item.quantity) * 0.3, // Mock profit
            sale_date: new Date().toISOString()
        }));

        await supabase.from('sales').insert(salesInserts);

        return NextResponse.json({ success: true, order: newOrder }, { status: 201 });

    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
