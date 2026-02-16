import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const role = request.cookies.get('auth_role')?.value;
    const { pathname } = request.nextUrl;

    // Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        // Allow access to login page
        if (pathname === '/admin/login') {
            if (role === 'admin') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // Redirect to login if not admin
        if (role !== 'admin') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Protect Security Routes
    if (pathname.startsWith('/security')) {
        // Allow access to login page
        if (pathname === '/security/login') {
            if (role === 'security') {
                return NextResponse.redirect(new URL('/security/scan', request.url));
            }
            return NextResponse.next();
        }

        // Redirect to login if not security
        if (role !== 'security') {
            return NextResponse.redirect(new URL('/security/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/security/:path*'],
};
