import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { ConditionalHeader, ConditionalFooter, ConditionalChatBot } from "@/components/ConditionalElements";
import "./globals.css";

import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
    title: "RightVillaNest | Find Your Dream Home",
    description:
        "Find your dream property with confidence. Join the most trusted and reliable RightVillaNest community today. Buy, Rent, or list villas and row-houses directly.",
    keywords: [
        "real estate",
        "property",
        "buy property",
        "rent property",
        "Bangalore",
        "apartments",
        "villas",
        "row houses",
    ],
    openGraph: {
        title: "RightVillaNest | Find Your Dream Home",
        description: "Find your dream property with confidence. Join the most trusted and reliable RightVillaNest community today.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden font-body">
                <ThemeProvider>
                    <ToastProvider>
                        <ConditionalHeader />
                        <AuthGuard>
                            <main className="min-h-screen">{children}</main>
                        </AuthGuard>
                        <ConditionalFooter />
                        <ConditionalChatBot />
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
