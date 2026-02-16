const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkOrder() {
    const orderId = 'c788d274-ee30-4a17-a88e-a9dc7a456b9c';
    console.log(`Checking Order: ${orderId}`);

    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Order Status:', order.status);
    console.log('Readable ID:', order.readable_id);
    console.log('QR String:', order.qr_code_string);

    // Also try to hit the local API to see what it says
    try {
        const res = await fetch('http://localhost:3000/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCodeString: orderId })
        });
        const apiData = await res.json();
        console.log('\nAPI Response for UUID:', JSON.stringify(apiData, null, 2));
    } catch (e) {
        console.error('API Call failed:', e.message);
    }
}

checkOrder();
