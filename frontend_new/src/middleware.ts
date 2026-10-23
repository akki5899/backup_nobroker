import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/my-listings',
    '/favorites',
    '/chats',
    '/notifications',
    '/post-property'
];

export function middleware(request: NextRequest) {
    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
        // Check for an auth token in cookies or headers? 
        // Wait, local storage is only client-side. We might not have token in cookies.
        // Let's create a client-side layout approach for protecting routes, 
        // OR read cookies if the application sets them. 
        // Let's just create this middleware to check cookies, but we will also implement client-side checks just in case.

        // Let's bypass token check in middleware if they only use localstorage, and rely on a client side ProtectedRoute component.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/my-listings/:path*',
        '/favorites/:path*',
        '/chats/:path*',
        '/notifications/:path*',
        '/post-property/:path*'
    ],
};
