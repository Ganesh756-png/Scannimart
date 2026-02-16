import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create new user (role defaults to 'customer')
        const { data: user, error } = await supabase
            .from('users')
            .insert([
                {
                    name,
                    email,
                    password, // In real app, hash this!
                    role: 'customer'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
