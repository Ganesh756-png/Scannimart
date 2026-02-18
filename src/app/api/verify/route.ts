import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Verify API Request Body:", body);
        const { qrCodeString } = body;

        if (!qrCodeString) {
            return NextResponse.json({ success: false, message: 'No QR code provided' }, { status: 400 });
        }

        // 1. Fetch Order
        let query = supabase.from('orders').select('*');

        // specific check for UUID format to allow manual entry of Order ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrCodeString);
        // Check for Short ID (6 chars)
        const isShortID = /^[A-Z0-9]{6}$/i.test(qrCodeString);

        if (isUUID) {
            query = query.eq('id', qrCodeString);
        } else if (isShortID) {
            // OPTION 3: Direct DB Lookup for Readable ID
            // We assume 'readable_id' column exists. If not, this might fail, but we added it to insert.
            query = supabase.from('orders').select('*').eq('readable_id', qrCodeString.toUpperCase());

            // Note: If multiple orders have same ID (collisions), we might get multiple.
            // We should take the latest one or handle it. 
            // supabase .single() would fail if multiple.
            // Let's use .limit(1) and .single() if we want just one, or handle array.
            // 'query' above is a builder.
            query = query.limit(1);
        } else {
            query = query.eq('qr_code_string', qrCodeString);
        }

        const { data, error } = await query;
        const order: any = (data && data.length > 0) ? data[0] : null;

        if (error || !order) {
            console.error("Verify API Error:", error);
            console.log("Searching for QR:", qrCodeString);
            return NextResponse.json({
                success: false,
                message: error ? `DB Error: ${error.message}` : 'Invalid QR Code: Order not found'
            }, { status: 404 });
        }

        if (order.status === 'verified') {
            return NextResponse.json({
                success: false,
                message: 'ALREADY USED: This pass has already been scanned at exit.'
            }, { status: 400 });
        }

        // Handle Pending Payment (Cash)
        if (order.status === 'pending_payment') {
            const { confirmPayment } = body;

            if (!confirmPayment) {
                return NextResponse.json({
                    success: false,
                    requiresPayment: true,
                    message: 'Payment Required',
                    order: {
                        id: order.id,
                        totalAmount: order.total_amount,
                        items: order.items
                    }
                }, { status: 200 }); // 200 OK because it's a valid "step", not an error
            }

            // If confirmed, mark as paid AND verified
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'verified',
                    // payment_status: 'paid', // unnecessary column removed
                    payment_method: 'CASH'
                })
                .eq('id', order.id);

            if (updateError) throw updateError;

            // Skip the standard verification update below since we did it here
            return NextResponse.json({
                success: true,
                message: 'Payment Collected & Access Granted',
                order: {
                    id: order.id,
                    totalAmount: order.total_amount,
                    items: order.items
                }
            });
        }

        if (order.status !== 'paid') {
            return NextResponse.json({
                success: false,
                message: 'PAYMENT PENDING: This order has not been paid yet.'
            }, { status: 400 });
        }

        // 2. Mark as verified
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'verified' })
            .eq('id', order.id);

        if (updateError) {
            throw updateError;
        }

        // Parse items if it's a string (sometimes Supabase returns JSONB as object, sometimes string depending on driver)
        let items = order.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error("Failed to parse items JSON:", e);
                items = [];
            }
        }

        const itemCount = Array.isArray(items) ? items.length : 0;

        // Calculate Total Expected Weight (sum of item.weight * item.quantity)
        // If weight is missing, we assume 0 or handle it gracefully.
        // For existing orders without weight, this might return 0 which is fine.
        const totalExpectedWeight = Array.isArray(items)
            ? items.reduce((sum: number, item: any) => sum + ((item.weight || 0) * (item.quantity || 1)), 0)
            : 0;

        return NextResponse.json({
            success: true,
            message: 'Access Granted',
            order: {
                id: order.id,
                totalAmount: order.total_amount,
                totalExpectedWeight: totalExpectedWeight,
                items: order.items // Return full item details
            }
        });

    } catch (error: any) {
        console.error("Verification API Critical Error:", error);
        return NextResponse.json({
            success: false,
            error: 'Verification failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
