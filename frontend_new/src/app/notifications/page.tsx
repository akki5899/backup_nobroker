"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, TrendingDown, Home, MessageCircle } from "lucide-react";
import { notificationAPI } from "@/utils/api_client";
import ScrollReveal from "@/components/ScrollReveal";

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications();
            setNotifs(response.data.notifications || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (err: any) {
            console.error("Failed to load notifications:", err);
            setError("Failed to load notifications. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifs(notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifs(notifs.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const deleteNotif = async (id: number) => {
        // Optimistic removal; restore on failure.
        const prev = notifs;
        const removed = notifs.find((n) => n.id === id);
        setNotifs(notifs.filter((n) => n.id !== id));
        if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await notificationAPI.delete(id);
        } catch (error) {
            console.error("Failed to delete notification:", error);
            setNotifs(prev);
            if (removed && !removed.is_read) setUnreadCount((c) => c + 1);
        }
    };

    const getIcon = (title: string) => {
        if (title.includes("Price")) return <TrendingDown className="w-5 h-5" />;
        if (title.includes("Listing")) return <Home className="w-5 h-5" />;
        return <MessageCircle className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="py-10 min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground font-light">Loading notifications...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-10 min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-red-500 font-semibold mb-4">{error}</p>
                    <button
                        onClick={loadNotifications}
                        className="px-6 py-3 bg-accent-500 hover:bg-accent-400 text-primary-950 rounded-full font-semibold tracking-wide text-sm transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ───────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="mesh-bg grain-overlay absolute inset-0" />
                <div className="relative z-raised max-w-2xl mx-auto px-4 lg:px-8 py-16 sm:py-20">
                    <div className="flex justify-between items-end gap-4">
                        <div>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="eyebrow text-accent-300 mb-4"
                            >
                                Activity
                            </motion.p>
                            <motion.h1
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.05 }}
                                className="text-4xl sm:text-5xl font-display text-[#fbf8f2] leading-[1.05] mb-3"
                            >
                                Notifications
                            </motion.h1>
                            <motion.p
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.12 }}
                                className="text-[#e6dcc9] font-light"
                            >
                                {unreadCount} unread
                            </motion.p>
                        </div>
                        {unreadCount > 0 && (
                            <motion.button
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.18 }}
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-accent-300 hover:text-accent-200 flex items-center gap-2 shrink-0"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all as read
                            </motion.button>
                        )}
                    </div>
                </div>
            </section>

            <div className="max-w-2xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
                {notifs.length === 0 ? (
                    <ScrollReveal variant="scale">
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-600">
                                <Bell className="w-10 h-10" />
                            </div>
                            <h2 className="font-display text-2xl text-foreground mb-2">
                                No notifications yet
                            </h2>
                            <p className="text-muted-foreground font-light max-w-sm mx-auto">
                                You&apos;ll see notifications here when there&apos;s activity on your account.
                            </p>
                        </div>
                    </ScrollReveal>
                ) : (
                    <div className="space-y-3">
                        {notifs.map((notif, index) => (
                            <ScrollReveal key={notif.id} variant="slideUp" delay={index * 0.08}>
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className={`bg-card rounded-2xl p-5 border transition-colors duration-500 ${notif.is_read
                                        ? "border-border hover:border-accent-400/50"
                                        : "border-accent-400/50 bg-accent-500/5"
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notif.is_read
                                                ? "bg-muted text-muted-foreground"
                                                : "bg-accent-500/15 text-accent-600"
                                                }`}
                                        >
                                            {getIcon(notif.title || "")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-display text-base text-foreground mb-1">
                                                {notif.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 font-light">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <CheckCheck className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotif(notif.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
