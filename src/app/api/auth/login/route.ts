import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, role } = body;

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // Simple password check (In production, use bcrypt)
        if (user.password !== password) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user has the required role (if specified)
        if (role && user.role !== role) {
            return NextResponse.json({ success: false, error: 'Unauthorized access for this role' }, { status: 403 });
        }

        // Return user info (excluding password)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Create the response
        const response = NextResponse.json({ success: true, user: userData });

        // Set a cookie for the role (accessible by middleware)
        response.cookies.set('auth_role', user.role, {
            httpOnly: false, // Allow client to read if needed for UI
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
