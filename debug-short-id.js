const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkShortId() {
    const prefix = '81751C';
    console.log(`Searching for order with ID prefix: ${prefix}`);

    // Fetch recent orders and filter in JS to be safe
    const { data: recent, error } = await supabase
        .from('orders')
        .select('id, readable_id, qr_code_string, status')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    const match = recent.find(o => o.id.toUpperCase().startsWith(prefix));

    if (match) {
        console.log('Found Match:', JSON.stringify(match, null, 2));
    } else {
        console.log('No order found with that ID prefix.');
    }
}

checkShortId();
