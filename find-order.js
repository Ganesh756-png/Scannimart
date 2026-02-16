const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrder() {
    const partialId = 'c788d274';
    console.log(`Searching for order starting with: ${partialId}`);

    // Fetch recent orders (UUIDs are random but created_at is good enough to find recent test orders)
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, qr_code_string, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    const matched = orders.filter(o => o.id.toString().startsWith(partialId));

    if (matched.length > 0) {
        console.log('Found Order(s):');
        matched.forEach(o => {
            console.log(`\nFull Order ID: ${o.id}`);
            console.log(`QR Code String (for manual verify): ${o.qr_code_string}`);
            console.log(`Created At: ${o.created_at}`);
        });
    } else {
        console.log('No order found with that ID prefix in recent 100 orders.');
        console.log('\nListing last 5 orders instead:');
        console.table(orders.slice(0, 5));
    }
}

findOrder();
