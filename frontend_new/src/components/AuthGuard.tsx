"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/my-listings',
        '/favorites',
        '/chats',
        '/notifications',
        '/post-property'
    ];

    useEffect(() => {
        const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

        if (isProtectedRoute) {
            const token = localStorage.getItem('token');
            if (!token) {
                setAuthorized(false);
                router.replace('/login');
            } else {
                setAuthorized(true);
            }
        } else {
            setAuthorized(true);
        }
    }, [pathname, router, protectedRoutes]);

    // Prevent flashing protected content before redirect
    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}
