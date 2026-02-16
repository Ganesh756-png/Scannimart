const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrder() {
    const partialId = 'c788d274';
    const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(50);

    if (orders) {
        const matched = orders.find(o => o.id.toString().startsWith(partialId));
        if (matched) {
            console.log(`ORDER_ID:${matched.id}`);
        } else {
            console.log(`ORDER_ID:NOT_FOUND`);
        }
    }
}

findOrder();
