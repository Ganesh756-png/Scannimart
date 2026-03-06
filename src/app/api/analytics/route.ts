import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch Peak Shopping Hours (from orders or sales, using sales for simplicity)
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('sale_date');

        if (salesError) throw salesError;

        // Group by hour
        const hourlyData: { [key: string]: number } = {};
        sales?.forEach(sale => {
            if (!sale.sale_date) return;
            const hour = new Date(sale.sale_date).getHours();
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            hourlyData[hourLabel] = (hourlyData[hourLabel] || 0) + 1;
        });

        const peakHours = Object.keys(hourlyData).map(hour => ({
            hour,
            count: hourlyData[hour]
        })).sort((a, b) => a.hour.localeCompare(b.hour)); // Sort by time

        // 2. Fetch Most Frequently Removed Items
        let removedItems: any[] = [];
        const { data: removals, error: removalsError } = await supabase
            .from('cart_removals')
            .select('product_name, quantity');

        if (!removalsError && removals) {
            const removalCounts: { [key: string]: number } = {};
            removals.forEach(r => {
                removalCounts[r.product_name] = (removalCounts[r.product_name] || 0) + r.quantity;
            });
            removedItems = Object.keys(removalCounts).map(name => ({
                name,
                count: removalCounts[name]
            })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
        } else if (removalsError && removalsError.code === '42P01') {
            // Table not created yet
            removedItems = [{ name: 'Pending DB Setup', count: 0 }];
        } else if (removalsError) {
            console.error("Error fetching cart removals:", removalsError);
        }

        // 3. Discrepancy Rates
        let discrepancyRate = 0;
        let recentDiscrepancies: any[] = [];

        // Get total number of orders for the denominator
        const { count: totalOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { data: discrepancies, error: discrepanciesError } = await supabase
            .from('discrepancies')
            .select('*')
            .order('created_at', { ascending: false });

        if (!discrepanciesError && discrepancies && totalOrders !== null && totalOrders > 0) {
            discrepancyRate = (discrepancies.length / totalOrders) * 100;
            recentDiscrepancies = discrepancies.slice(0, 5);
        } else if (discrepanciesError && discrepanciesError.code === '42P01') {
            discrepancyRate = 0; // Pending DB setup
        } else if (discrepanciesError) {
            console.error("Error fetching discrepancies:", discrepanciesError);
        }

        // 4. Predictive Restocking (Items with stock < 20, or adapt logic as needed)
        const { data: inventory, error: inventoryError } = await supabase
            .from('products')
            .select('id, name, stock')
            .order('stock', { ascending: true })
            .limit(10); // Show top 10 low stock items

        if (inventoryError) throw inventoryError;

        const restockAlerts = inventory?.filter(item => item.stock < 15) || [];


        return NextResponse.json({
            success: true,
            analytics: {
                peakHours,
                removedItems,
                discrepancyRate: parseFloat(discrepancyRate.toFixed(2)),
                recentDiscrepancies,
                restockAlerts
            }
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics: ' + error.message }, { status: 500 });
    }
}
