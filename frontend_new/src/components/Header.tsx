"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationAPI } from "@/utils/api_client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
    Sun,
    Moon,
    Menu,
    X,
    Bell,
    MessageCircle,
    User,
    LogOut,
    Heart,
    LayoutDashboard,
    ChevronDown,
} from "lucide-react";

const navLinks = [
    { href: "/buy", label: "For Buyers", description: "Buy your dream home" },
    { href: "/rent", label: "For Tenants", description: "Find rental properties" },
    { href: "/services", label: "Services", description: "Explore our services" },
    { href: "/plans", label: "Pricing", description: "View plans" },
    { href: "/map-view", label: "Find Property with Maps", description: "Explore on map" },
];

export default function Header() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<{ name: string; email: string; full_name?: string; user_type?: string } | null>(null);

    const isPrivilegedRole = user?.user_type && ['owner', 'agent', 'builder'].includes(user.user_type.toLowerCase());

    // Lock background scroll while the mobile menu is open.
    useBodyScrollLock(mobileMenuOpen);

    useEffect(() => {
        setMounted(true);
        // Check if user is logged in
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const userData = localStorage.getItem("user");
            if (token && userData) {
                setUser(JSON.parse(userData));
            } else {
                setUser(null);
            }
        };
        checkAuth();
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, []);

    // Fetch unread notification count (C11) — only when logged in.
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        let active = true;
        const loadUnread = async () => {
            try {
                const res = await notificationAPI.getNotifications();
                if (active) setUnreadCount(res.data?.unread_count ?? 0);
            } catch {
                // Silent — header should never break on a notifications fetch failure.
            }
        };
        loadUnread();
        const interval = setInterval(loadUnread, 60000); // refresh every minute
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [user]);

    // Close the account/profile dropdown on outside click or Escape (C8).
    useEffect(() => {
        if (!userMenuOpen) return;
        const handleClickAway = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickAway);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickAway);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [userMenuOpen]);

    // Close mobile menu on Escape for keyboard parity with the dropdown.
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileMenuOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [mobileMenuOpen]);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <header className="sticky top-0 z-sticky glass border-b border-border">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo — serif wordmark with engraved monogram */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
                        <div className="w-10 h-10 lg:w-11 lg:h-11 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center ring-1 ring-emerald-600/10 dark:ring-emerald-500/30 group-hover:ring-emerald-500/40 transition-all shrink-0">
                            <span className="font-display italic text-white dark:text-slate-950 text-xl font-bold leading-none">R</span>
                        </div>
                        <div className="hidden sm:block whitespace-nowrap">
                            <h1 className="font-display text-xl lg:text-[1.4rem] text-primary-900 dark:text-foreground tracking-tight leading-none">
                                Right<span className="italic text-accent-600 dark:text-accent-400">Villa</span>Nest
                            </h1>
                        </div>
                    </Link>

                    {/* Desktop Navigation — editorial underline-on-hover */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="link-underline text-[0.875rem] font-semibold tracking-wide text-foreground/70 hover:text-foreground transition-colors"
                                title={link.description}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Post Property Button — Always Visible */}
                        <Link
                            href="/post-property"
                            className="hidden md:inline-flex px-5 lg:px-6 py-2.5 border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[0.8rem] font-semibold tracking-wide rounded-full transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20 items-center justify-center shrink-0"
                        >
                            <span className="hidden lg:inline">List a Property</span>
                            <span className="lg:hidden">List</span>
                        </Link>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-full text-muted-foreground hover:text-accent-600 hover:bg-muted transition-all"
                                aria-label="Toggle theme"
                            >
                                {resolvedTheme === "dark" ? (
                                    <Sun className="w-[18px] h-[18px]" />
                                ) : (
                                    <Moon className="w-[18px] h-[18px]" />
                                )}
                            </button>
                        )}

                        {user ? (
                            <>
                                {/* Notifications */}
                                <Link
                                    href="/notifications"
                                    className="relative p-2.5 rounded-full text-muted-foreground hover:text-accent-600 hover:bg-muted transition-all shrink-0"
                                    aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                                >
                                    <Bell className="w-[18px] h-[18px]" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-accent-600 text-white text-[9px] font-bold rounded-full border border-background leading-none">
                                            {unreadCount > 10 ? "10+" : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Messages */}
                                <Link
                                    href="/chats"
                                    aria-label="Messages"
                                    className="p-2.5 rounded-full text-muted-foreground hover:text-accent-600 hover:bg-muted transition-all shrink-0"
                                >
                                    <MessageCircle className="w-[18px] h-[18px]" />
                                </Link>

                                {/* User Menu */}
                                <div className="relative shrink-0" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        aria-label="Account menu"
                                        aria-haspopup="true"
                                        aria-expanded={userMenuOpen}
                                        className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-muted transition-all"
                                    >
                                        <div className="w-9 h-9 bg-primary-900 dark:bg-accent-500 rounded-full flex items-center justify-center text-accent-400 dark:text-primary-950 font-display italic text-base shrink-0">
                                            {(user.full_name || user.name).charAt(0)}
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-3 w-56 bg-popover rounded-2xl shadow-2xl border border-border py-2 overflow-hidden z-dropdown"
                                            >
                                                <div className="px-4 py-3 border-b border-border">
                                                    <p className="font-display text-base text-foreground leading-tight">
                                                        {user.full_name || user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                                                >
                                                    <User className="w-4 h-4 text-accent-600" /> Profile
                                                </Link>
                                                {isPrivilegedRole && (
                                                    <Link
                                                        href="/dashboard"
                                                        className="flex items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4 text-accent-600" /> Dashboard
                                                    </Link>
                                                )}
                                                <Link
                                                    href="/plans"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                                                >
                                                    <span className="w-4 h-4 flex items-center justify-center font-bold rounded-full bg-accent-100 dark:bg-accent-500/15 text-accent-600 text-[10px]">₹</span> My Plan
                                                </Link>
                                                <Link
                                                    href="/favorites"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                                                >
                                                    <Heart className="w-4 h-4 text-accent-600" /> Saved Homes
                                                </Link>
                                                <hr className="my-2 rule-hairline" />
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem("token");
                                                        localStorage.removeItem("user");
                                                        setUser(null);
                                                        setUserMenuOpen(false);
                                                        window.dispatchEvent(new Event("storage"));
                                                        window.location.href = "/";
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden md:block px-4 py-2.5 text-[0.875rem] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white transition-colors shrink-0 link-underline"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-[0.8rem] font-semibold tracking-wide transition-all shrink-0 shadow-sm"
                                >
                                    Join
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            aria-expanded={mobileMenuOpen}
                            className="lg:hidden p-2.5 rounded-full text-muted-foreground hover:bg-muted"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-border glass-strong"
                    >
                        <nav className="p-4 space-y-0.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 font-display text-lg text-foreground/80 hover:text-accent-600 hover:bg-muted rounded-xl transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="my-3 rule-hairline" />
                            <Link
                                href="/help"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 text-[0.85rem] font-medium text-foreground/70 hover:bg-muted rounded-xl"
                            >
                                Help &amp; Support
                            </Link>
                            <Link
                                href="/post-property"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 text-center text-[0.85rem] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-full mt-2"
                            >
                                List a Property
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
