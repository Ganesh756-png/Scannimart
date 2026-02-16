const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWeights() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, weight');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('Current Product Weights:');
    console.table(products);

    // Update weights if they are 0
    const updates = products
        .filter(p => !p.weight || p.weight === 0)
        .map(p => {
            // Assign random weight between 100g and 1000g for demo
            const randomWeight = Math.floor(Math.random() * 900) + 100;
            return supabase
                .from('products')
                .update({ weight: randomWeight })
                .eq('id', p.id);
        });

    if (updates.length > 0) {
        console.log(`Updating ${updates.length} products with random weights...`);
        await Promise.all(updates);
        console.log('Weights updated!');
    } else {
        console.log('All products already have weights.');
    }
}

checkWeights();
