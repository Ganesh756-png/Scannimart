import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        // Clear existing products and users to avoid duplicates
        // Note: Supabase delete without where clause is tricky, usually need a condition.
        // We'll delete where ID is not null (effectively all)

        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all
        await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const products = [
            {
                name: "Potato Chips",
                price: 20,
                barcode: "1234567890",
                stock: 100
            },
            {
                name: "Soda Can",
                price: 40,
                barcode: "0987654321",
                stock: 100
            },
            {
                name: "Chocolate Bar",
                price: 15,
                barcode: "1122334455",
                stock: 100
            },
            {
                name: "Water Bottle",
                price: 12,
                barcode: "5544332211",
                stock: 100
            }
        ];

        const users = [
            {
                name: "Admin User",
                email: "admin@store.com",
                password: "password123", // In real app, hash this!
                role: "admin"
            },
            {
                name: "Security Guard",
                email: "security@store.com",
                password: "password123",
                role: "security"
            },
            {
                name: "John Customer",
                email: "john@example.com",
                password: "password123",
                role: "customer"
            }
        ];

        const { error: productError } = await supabase.from('products').insert(products);
        if (productError) throw productError;

        const { error: userError } = await supabase.from('users').insert(users);
        if (userError) throw userError;

        return NextResponse.json({ success: true, message: 'Database seeded with products and users' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
