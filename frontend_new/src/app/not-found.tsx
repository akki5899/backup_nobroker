"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center max-w-lg w-full"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <div className="w-12 h-12 bg-primary-900 dark:bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/20 dark:shadow-accent-500/20">
                        <span className="text-white dark:text-primary-950 font-black text-xl">P</span>
                    </div>
                    <span className="font-black text-xl text-foreground tracking-tight">
                        Prop<span className="text-accent-500">Direct</span>
                    </span>
                </div>

                {/* 404 Visual */}
                <div className="relative mb-8">
                    <div className="text-[10rem] font-black text-slate-200 dark:text-slate-800 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">🏚️</span>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-4 leading-tight">
                    Oops! Page Not Found
                </h1>
                <p className="text-muted-foreground font-medium mb-10 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back to finding your dream property.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-2xl font-black uppercase tracking-widest hover:bg-primary-800 dark:hover:bg-accent-400 transition-all shadow-xl shadow-primary-900/20 dark:shadow-accent-500/20 text-sm"
                    >
                        <Home className="w-5 h-5" />
                        Back to Homepage
                    </Link>
                    <Link
                        href="/buy"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-card border-2 border-border text-foreground rounded-2xl font-black uppercase tracking-widest hover:border-primary-900 dark:hover:border-accent-500 hover:text-primary-900 dark:hover:text-accent-400 transition-all shadow-sm text-sm"
                    >
                        <Search className="w-5 h-5" />
                        Browse Properties
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
