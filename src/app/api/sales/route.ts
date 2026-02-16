import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/sales (Manual Entry from Admin Dashboard)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { itemName, quantity, sellingPrice, costPrice, date } = body;

        // Basic validation
        if (!itemName || !quantity || !sellingPrice || !costPrice) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const totalRevenue = quantity * sellingPrice;
        const totalProfit = totalRevenue - (quantity * costPrice);

        const { data: sale, error } = await supabase
            .from('sales')
            .insert([
                {
                    item_name: itemName,
                    quantity: parseInt(quantity),
                    selling_price: parseFloat(sellingPrice),
                    cost_price: parseFloat(costPrice),
                    total_revenue: totalRevenue,
                    total_profit: totalProfit,
                    sale_date: date || new Date().toISOString(),
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, sale });
    } catch (error: any) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ success: false, error: 'Failed to create sale: ' + error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Fetch all sales, sorted by date (newest first)
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .order('sale_date', { ascending: false });

        if (error) throw error;

        // Map back to frontend expected camelCase if needed, or update frontend to use snake_case.
        // For now, let's map it to keep frontend happy.
        const mappedSales = sales.map(s => ({
            id: s.id,
            itemName: s.item_name,
            quantity: s.quantity,
            sellingPrice: s.selling_price,
            costPrice: s.cost_price,
            totalRevenue: s.total_revenue,
            totalProfit: s.total_profit,
            date: s.sale_date
        }));

        return NextResponse.json({ success: true, sales: mappedSales });
    } catch (error: any) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch sales' }, { status: 500 });
    }
}
