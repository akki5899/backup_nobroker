"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

// Routes that render their own full-screen, immersive shell (their own top bar,
// no footer) — the global chrome is hidden so it doesn't double up or force scroll.
const isChromeless = (pathname: string | null) =>
    !!pathname && (pathname.startsWith("/admin") || pathname === "/map-view");

export function ConditionalHeader() {
    const pathname = usePathname();
    if (isChromeless(pathname)) return null;
    return <Header />;
}

export function ConditionalFooter() {
    const pathname = usePathname();
    if (isChromeless(pathname)) return null;
    return <Footer />;
}

export function ConditionalChatBot() {
    const pathname = usePathname();
    if (isChromeless(pathname)) return null;
    return <ChatBot />;
}
