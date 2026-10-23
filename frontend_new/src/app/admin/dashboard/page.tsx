"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Home, MessageSquare, TrendingUp,
    Trash2, LogOut, ChevronRight, Activity, Mail, Phone, Calendar, IndianRupee, MapPin,
    CheckCircle, XCircle, Clock, ShieldCheck, Search, Star, Eye, EyeOff, BadgeCheck,
    Ban, Megaphone, ScrollText, CreditCard, Handshake, CalendarCheck, UserCog, Wallet,
    RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import api from "@/utils/api_client";
import { useToast } from "@/components/Toast";
import AnimatedSection from "@/components/AnimatedSection";

type Tab = "overview" | "review" | "users" | "properties" | "revenue" | "engagement" | "broadcast" | "audit";

const inr = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d: any) => (d ? new Date(d).toLocaleString() : "—");

export default function AdminDashboardPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const [stats, setStats] = useState<any>({});
    const [growth, setGrowth] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [actioningId, setActioningId] = useState<number | null>(null);

    // Users
    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState("");

    // Properties
    const [properties, setProperties] = useState<any[]>([]);
    const [propSearch, setPropSearch] = useState("");
    const [propFilter, setPropFilter] = useState("");

    // Revenue
    const [payments, setPayments] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<any>({ daily: [], by_type: [] });

    // Engagement
    const [leads, setLeads] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [engTab, setEngTab] = useState<"leads" | "visits" | "agreements" | "inquiries">("leads");
    const [inquiries, setInquiries] = useState<any[]>([]);

    // Broadcast
    const [broadcast, setBroadcast] = useState({ title: "", message: "", audience: "all" });
    const [sending, setSending] = useState(false);

    // Audit
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
            return;
        }
        loadCore();
    }, []);

    const handleAuthError = (error: any) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            router.push("/admin/login");
        }
    };

    // Core data needed for the overview + review badge.
    const loadCore = async () => {
        try {
            setLoading(true);
            const [statsRes, growthRes, pendingRes] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/analytics/growth?days=30"),
                api.get("/admin/properties/pending"),
            ]);
            setStats(statsRes.data);
            setGrowth(growthRes.data);
            setPending(pendingRes.data);
        } catch (error: any) {
            showToast("Failed to fetch admin data. Session might be expired.", "error");
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    // ---- Lazy loaders per tab ---------------------------------------------
    const loadUsers = useCallback(async () => {
        try {
            const res = await api.get("/admin/users", { params: { search: userSearch || undefined, limit: 200 } });
            setUsers(res.data.items || []);
        } catch (e) { showToast("Failed to load users", "error"); }
    }, [userSearch]);

    const loadProperties = useCallback(async () => {
        try {
            const res = await api.get("/admin/properties", {
                params: { search: propSearch || undefined, moderation_status: propFilter || undefined, limit: 200 },
            });
            setProperties(res.data.items || []);
        } catch (e) { showToast("Failed to load properties", "error"); }
    }, [propSearch, propFilter]);

    const loadRevenue = useCallback(async () => {
        try {
            const [pay, subs, rev] = await Promise.all([
                api.get("/admin/payments", { params: { limit: 200 } }),
                api.get("/admin/subscriptions"),
                api.get("/admin/analytics/revenue?days=30"),
            ]);
            setPayments(pay.data.items || []);
            setSubscriptions(subs.data || []);
            setRevenue(rev.data || { daily: [], by_type: [] });
        } catch (e) { showToast("Failed to load revenue data", "error"); }
    }, []);

    const loadEngagement = useCallback(async () => {
        try {
            const [l, v, a, i] = await Promise.all([
                api.get("/admin/leads"), api.get("/admin/visits"),
                api.get("/admin/agreements"), api.get("/admin/inquiries"),
            ]);
            setLeads(l.data || []); setVisits(v.data || []);
            setAgreements(a.data || []); setInquiries(i.data || []);
        } catch (e) { showToast("Failed to load engagement data", "error"); }
    }, []);

    const loadAudit = useCallback(async () => {
        try {
            const res = await api.get("/admin/audit-logs", { params: { limit: 200 } });
            setAuditLogs(res.data.items || []);
        } catch (e) { showToast("Failed to load audit log", "error"); }
    }, []);

    // Trigger the right loader when a tab opens.
    useEffect(() => {
        if (loading) return;
        if (activeTab === "users") loadUsers();
        else if (activeTab === "properties") loadProperties();
        else if (activeTab === "revenue") loadRevenue();
        else if (activeTab === "engagement") loadEngagement();
        else if (activeTab === "audit") loadAudit();
    }, [activeTab, loading]);

    // ---- Moderation -------------------------------------------------------
    const handleApprove = async (id: number) => {
        try {
            setActioningId(id);
            await api.post(`/admin/properties/${id}/approve`);
            showToast("Listing approved and published", "success");
            setPending(prev => prev.filter(p => p.id !== id));
            setSelected(prev => prev.filter(x => x !== id));
            setStats((s: any) => ({ ...s, pending: Math.max(0, (s.pending || 1) - 1) }));
        } catch { showToast("Failed to approve listing", "error"); }
        finally { setActioningId(null); }
    };

    const handleReject = async (id: number) => {
        const reason = window.prompt("Reason for rejection (optional — shared with the owner):") ?? undefined;
        try {
            setActioningId(id);
            await api.post(`/admin/properties/${id}/reject`, { reason });
            showToast("Listing rejected", "success");
            setPending(prev => prev.filter(p => p.id !== id));
            setSelected(prev => prev.filter(x => x !== id));
            setStats((s: any) => ({ ...s, pending: Math.max(0, (s.pending || 1) - 1) }));
        } catch { showToast("Failed to reject listing", "error"); }
        finally { setActioningId(null); }
    };

    const bulkAction = async (kind: "approve" | "reject") => {
        if (selected.length === 0) return;
        let reason: string | undefined;
        if (kind === "reject") reason = window.prompt(`Reason for rejecting ${selected.length} listings (optional):`) ?? undefined;
        try {
            await api.post(`/admin/properties/bulk-${kind}`, { ids: selected, reason });
            showToast(`${selected.length} listings ${kind === "approve" ? "approved" : "rejected"}`, "success");
            const done = new Set(selected);
            setPending(prev => prev.filter(p => !done.has(p.id)));
            setStats((s: any) => ({ ...s, pending: Math.max(0, (s.pending || 0) - selected.length) }));
            setSelected([]);
        } catch { showToast(`Bulk ${kind} failed`, "error"); }
    };

    const toggleSelect = (id: number) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // ---- User actions -----------------------------------------------------
    const userAction = async (id: number, action: "suspend" | "activate" | "verify") => {
        try {
            const res = await api.post(`/admin/users/${id}/${action}`);
            setUsers(prev => prev.map(u => u.id === id ? res.data.user : u));
            showToast(`User ${action}d`, "success");
            if (action === "suspend") setStats((s: any) => ({ ...s, suspended_users: (s.suspended_users || 0) + 1 }));
            if (action === "activate") setStats((s: any) => ({ ...s, suspended_users: Math.max(0, (s.suspended_users || 1) - 1) }));
        } catch { showToast(`Failed to ${action} user`, "error"); }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            showToast("User deleted", "success");
            setUsers(prev => prev.filter(u => u.id !== id));
            setStats((s: any) => ({ ...s, users: Math.max(0, (s.users || 1) - 1) }));
        } catch { showToast("Failed to delete user", "error"); }
    };

    // ---- Property actions -------------------------------------------------
    const propAction = async (id: number, action: "feature" | "toggle-active") => {
        try {
            const res = await api.post(`/admin/properties/${id}/${action}`);
            setProperties(prev => prev.map(p => p.id === id ? res.data.property : p));
            showToast(action === "feature" ? "Featured flag toggled" : "Visibility toggled", "success");
        } catch { showToast("Action failed", "error"); }
    };

    const handleDeleteProperty = async (id: number) => {
        if (!window.confirm("Delete this property permanently? This cannot be undone.")) return;
        try {
            await api.delete(`/admin/properties/${id}`);
            showToast("Property deleted", "success");
            setProperties(prev => prev.filter(p => p.id !== id));
            setStats((s: any) => ({ ...s, properties: Math.max(0, (s.properties || 1) - 1) }));
        } catch { showToast("Failed to delete property", "error"); }
    };

    // ---- Broadcast --------------------------------------------------------
    const sendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcast.title.trim() || !broadcast.message.trim()) return;
        try {
            setSending(true);
            const res = await api.post("/admin/broadcast", broadcast);
            showToast(res.data.message || "Broadcast sent", "success");
            setBroadcast({ title: "", message: "", audience: "all" });
        } catch { showToast("Failed to send broadcast", "error"); }
        finally { setSending(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-16 h-16 bg-red-600/20 rounded-full animate-pulse" />
            </div>
        );
    }

    const StatCards = [
        { label: "Total Users", value: stats.users ?? 0, icon: Users, sub: `+${stats.new_users_30d ?? 0} in 30d` },
        { label: "Total Properties", value: stats.properties ?? 0, icon: Home, sub: `${stats.active_listings ?? 0} live` },
        { label: "Pending Review", value: stats.pending ?? 0, icon: Clock, sub: "awaiting action" },
        { label: "Total Revenue", value: inr(stats.total_revenue), icon: Wallet, sub: `${inr(stats.revenue_30d)} in 30d` },
        { label: "Active Subs", value: stats.active_subscriptions ?? 0, icon: CreditCard, sub: "subscriptions" },
        { label: "Leads", value: stats.leads ?? 0, icon: TrendingUp, sub: "captured" },
        { label: "Visits", value: stats.visits ?? 0, icon: CalendarCheck, sub: "scheduled" },
        { label: "Agreements", value: stats.agreements ?? 0, icon: Handshake, sub: "rental deals" },
    ];

    const statusBadgeClass = (status?: string) => {
        if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
        if (status === "rejected") return "bg-red-500/15 text-red-600 dark:text-red-400";
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    };

    const tabs: { key: Tab; label: string; badge?: number }[] = [
        { key: "overview", label: "Overview" },
        { key: "review", label: "Review Queue", badge: stats.pending || 0 },
        { key: "users", label: "Users" },
        { key: "properties", label: "Properties" },
        { key: "revenue", label: "Revenue" },
        { key: "engagement", label: "Engagement" },
        { key: "broadcast", label: "Broadcast" },
        { key: "audit", label: "Audit Log" },
    ];

    const maxGrowth = Math.max(1, ...growth.map(g => Math.max(g.users, g.properties)));
    const maxRev = Math.max(1, ...(revenue.daily || []).map((d: any) => d.amount));

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Header */}
            <motion.header
                initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
                className="sticky top-0 z-sticky bg-card/80 backdrop-blur-md border-b border-border"
            >
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white scale-90">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg text-foreground">RightVillaNest Admin</h1>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Control Center</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-full font-semibold tracking-wide text-sm transition-all">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </motion.header>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar">
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-3 rounded-full font-semibold tracking-wide text-sm whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.key
                                ? "bg-accent-500 text-primary-950 shadow-xl"
                                : "bg-card border border-border text-muted-foreground hover:border-accent-400/50 hover:text-foreground"}`}>
                            {tab.label}
                            {tab.badge ? (
                                <span className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === tab.key ? "bg-primary-950 text-accent-400" : "bg-amber-500 text-white"}`}>
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                <AnimatedSection key={activeTab}>
                    {/* ===================== OVERVIEW ===================== */}
                    {activeTab === "overview" && (
                        <div className="space-y-8">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {StatCards.map((stat) => (
                                    <div key={stat.label} className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden hover:border-accent-400/50 transition-all">
                                        <div className="relative z-raised">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                                            <p className="text-3xl font-display text-foreground">{stat.value}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">{stat.sub}</p>
                                        </div>
                                        <stat.icon className="absolute right-5 bottom-5 w-9 h-9 text-muted-foreground opacity-40" />
                                    </div>
                                ))}
                            </div>

                            {/* Growth chart */}
                            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-display text-xl text-foreground">Platform Growth (30 days)</h3>
                                    <div className="flex items-center gap-4 text-xs font-semibold">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-accent-400" /> Users</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500" /> Listings</span>
                                    </div>
                                </div>
                                <div className="h-48 flex items-end gap-1">
                                    {growth.map((g, i) => (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative" title={`${g.date}: ${g.users} users, ${g.properties} listings`}>
                                            <div className="w-full bg-accent-400/80 rounded-t" style={{ height: `${(g.users / maxGrowth) * 100}%` }} />
                                            <div className="w-full bg-teal-500/70 rounded-t" style={{ height: `${(g.properties / maxGrowth) * 100}%` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setActiveTab("review")}
                                className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-6 py-3 rounded-full font-semibold tracking-wide text-sm inline-flex items-center gap-2 transition-colors">
                                Go to Review Queue{stats.pending > 0 ? ` (${stats.pending})` : ""} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ===================== REVIEW ===================== */}
                    {activeTab === "review" && (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="font-display text-2xl text-foreground">Review Queue</h2>
                                        <p className="text-sm text-muted-foreground">{pending.length} {pending.length === 1 ? "listing" : "listings"} awaiting approval.</p>
                                    </div>
                                </div>
                                {selected.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-muted-foreground">{selected.length} selected</span>
                                        <button onClick={() => bulkAction("approve")} className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Approve all</button>
                                        <button onClick={() => bulkAction("reject")} className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500/15 text-red-600 hover:bg-red-500/25 transition-all flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Reject all</button>
                                    </div>
                                )}
                            </div>

                            {pending.length === 0 ? (
                                <div className="text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4"><CheckCircle className="w-8 h-8" /></div>
                                    <h3 className="font-display text-xl text-foreground mb-1">All caught up</h3>
                                    <p className="text-muted-foreground font-light">No listings are waiting for review right now.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {pending.map((prop) => (
                                        <div key={prop.id} className={`bg-card rounded-2xl border shadow-sm p-6 transition-all ${selected.includes(prop.id) ? "border-accent-500 ring-2 ring-accent-400/30" : "border-border hover:border-amber-400/50"}`}>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <label className="flex items-start gap-3 min-w-0 cursor-pointer">
                                                    <input type="checkbox" checked={selected.includes(prop.id)} onChange={() => toggleSelect(prop.id)} className="mt-1 w-4 h-4 accent-accent-500" />
                                                    <span className="min-w-0">
                                                        <h3 className="font-display text-lg text-foreground truncate">{prop.title}</h3>
                                                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground mt-1 uppercase block">ID: PROP-{prop.id} • USER-{prop.owner_id}</span>
                                                    </span>
                                                </label>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap ${statusBadgeClass(prop.moderation_status)}`}>{prop.moderation_status || "pending"}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                                                <div className="flex items-center gap-1.5 text-foreground/80 font-semibold"><IndianRupee className="w-3.5 h-3.5" /> {prop.price?.toLocaleString() || "N/A"}</div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {prop.city || "—"}</div>
                                                <div className="text-muted-foreground capitalize">{prop.property_type} • {prop.listing_type}</div>
                                                <div className="text-muted-foreground">{[prop.bedrooms && `${prop.bedrooms} BHK`, prop.area && `${prop.area} sqft`].filter(Boolean).join(" • ") || "—"}</div>
                                            </div>
                                            <div className="flex gap-3">
                                                <a href={`/properties/${prop.id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground/80 hover:border-accent-400/60 hover:text-accent-600 transition-all">View</a>
                                                <button onClick={() => handleApprove(prop.id)} disabled={actioningId === prop.id} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60"><CheckCircle className="w-4 h-4" /> Approve</button>
                                                <button onClick={() => handleReject(prop.id)} disabled={actioningId === prop.id} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500/15 text-red-600 hover:bg-red-500/25 transition-all disabled:opacity-60"><XCircle className="w-4 h-4" /> Deny</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===================== USERS ===================== */}
                    {activeTab === "users" && (
                        <div className="space-y-4">
                            <form onSubmit={(e) => { e.preventDefault(); loadUsers(); }} className="flex gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name, email or phone…"
                                        className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-accent-400 transition-all" />
                                </div>
                                <button type="submit" className="px-5 py-3 rounded-xl bg-accent-500 text-primary-950 font-semibold text-sm">Search</button>
                            </form>
                            <div className="bg-card rounded-2xl p-2 sm:p-6 border border-border shadow-sm overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-4 rounded-tl-2xl">User</th><th className="px-4 py-4">Contact</th>
                                            <th className="px-4 py-4">Role</th><th className="px-4 py-4">Status</th>
                                            <th className="px-4 py-4">Joined</th><th className="px-4 py-4 text-right rounded-tr-2xl">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4 font-semibold text-foreground">
                                                    <div className="flex items-center gap-2">{u.full_name || "Unknown"} {u.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}</div>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">USER-{u.id}</span>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground space-y-1">
                                                    <div className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" /> {u.email}</div>
                                                    <div className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> {u.phone}</div>
                                                </td>
                                                <td className="px-4 py-4"><span className="px-3 py-1 bg-muted rounded-lg text-[10px] font-semibold uppercase tracking-widest text-foreground/80">{u.user_type}</span></td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${u.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>{u.is_active ? "active" : "suspended"}</span>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground text-xs font-semibold">{fmtDate(u.created_at)}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {!u.is_verified && <button onClick={() => userAction(u.id, "verify")} title="Verify user" className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"><BadgeCheck className="w-4 h-4" /></button>}
                                                        {u.is_active
                                                            ? <button onClick={() => userAction(u.id, "suspend")} title="Suspend user" className="p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"><Ban className="w-4 h-4" /></button>
                                                            : <button onClick={() => userAction(u.id, "activate")} title="Reactivate user" className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"><RefreshCw className="w-4 h-4" /></button>}
                                                        <button onClick={() => handleDeleteUser(u.id)} title="Delete user" className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No users found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===================== PROPERTIES ===================== */}
                    {activeTab === "properties" && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <form onSubmit={(e) => { e.preventDefault(); loadProperties(); }} className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input value={propSearch} onChange={(e) => setPropSearch(e.target.value)} placeholder="Search title, city or address…"
                                        className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-accent-400 transition-all" />
                                </form>
                                <select value={propFilter} onChange={(e) => { setPropFilter(e.target.value); }} className="bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-400">
                                    <option value="">All statuses</option><option value="pending">Pending</option>
                                    <option value="approved">Approved</option><option value="rejected">Rejected</option>
                                </select>
                                <button onClick={() => loadProperties()} className="px-5 py-3 rounded-xl bg-accent-500 text-primary-950 font-semibold text-sm">Apply</button>
                            </div>
                            <div className="bg-card rounded-2xl p-2 sm:p-6 border border-border shadow-sm overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-4 rounded-tl-2xl">Property</th><th className="px-4 py-4">Info</th>
                                            <th className="px-4 py-4">Owner</th><th className="px-4 py-4">Status</th>
                                            <th className="px-4 py-4 text-right rounded-tr-2xl">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {properties.map((p) => (
                                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4 text-foreground max-w-[240px]">
                                                    <div className="font-semibold truncate flex items-center gap-1.5">{p.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}{p.title}</div>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PROP-{p.id} • {p.views || 0} views</span>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground space-y-1">
                                                    <div className="flex items-center gap-1 font-semibold text-foreground/80"><IndianRupee className="w-3 h-3" /> {p.price?.toLocaleString() || "N/A"}</div>
                                                    <div className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3" /> {p.city} • <span className="capitalize">{p.property_type}</span></div>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground font-semibold text-xs">USER-{p.owner_id}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${statusBadgeClass(p.moderation_status)}`}>{p.moderation_status}</span>
                                                    {!p.isActive && <span className="ml-1 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-muted text-muted-foreground">hidden</span>}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => propAction(p.id, "feature")} title="Toggle featured" className={`p-2 rounded-lg transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 ${p.is_featured ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}><Star className="w-4 h-4" /></button>
                                                        <button onClick={() => propAction(p.id, "toggle-active")} title="Show / hide" className="p-2 text-muted-foreground hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-all">{p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                                                        <a href={`/properties/${p.id}`} target="_blank" rel="noopener noreferrer" title="View" className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-all"><MapPin className="w-4 h-4" /></a>
                                                        <button onClick={() => handleDeleteProperty(p.id)} title="Delete" className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {properties.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No properties found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===================== REVENUE ===================== */}
                    {activeTab === "revenue" && (
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-3 gap-5">
                                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Revenue (30d)</p>
                                    <p className="text-3xl font-display text-foreground">{inr(revenue.total)}</p>
                                </div>
                                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Transactions (30d)</p>
                                    <p className="text-3xl font-display text-foreground">{revenue.transactions ?? 0}</p>
                                </div>
                                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Active Subscriptions</p>
                                    <p className="text-3xl font-display text-foreground">{subscriptions.filter(s => s.status === "active").length}</p>
                                </div>
                            </div>

                            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                <h3 className="font-display text-xl text-foreground mb-6">Daily Revenue (30 days)</h3>
                                <div className="h-40 flex items-end gap-1">
                                    {(revenue.daily || []).map((d: any, i: number) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-accent-500/30 to-accent-400 rounded-t" style={{ height: `${(d.amount / maxRev) * 100}%` }} title={`${d.date}: ${inr(d.amount)}`} />
                                    ))}
                                </div>
                            </div>

                            {revenue.by_type?.length > 0 && (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {revenue.by_type.map((t: any) => (
                                        <div key={t.type} className="bg-card p-5 rounded-2xl border border-border">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 capitalize">{t.type.replace(/_/g, " ")}</p>
                                            <p className="text-2xl font-display text-foreground">{inr(t.amount)}</p>
                                            <p className="text-[11px] text-muted-foreground">{t.count} txns</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-card rounded-2xl p-2 sm:p-6 border border-border shadow-sm overflow-x-auto">
                                <h3 className="font-display text-lg text-foreground px-2 sm:px-0 mb-4">Recent Payments</h3>
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50">
                                        <tr><th className="px-4 py-4 rounded-tl-2xl">Payment</th><th className="px-4 py-4">User</th><th className="px-4 py-4">Amount</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right rounded-tr-2xl">Date</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {payments.map((p) => (
                                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4 text-muted-foreground text-xs font-mono">{p.razorpay_payment_id || p.razorpay_order_id}</td>
                                                <td className="px-4 py-4 text-muted-foreground font-semibold text-xs">USER-{p.user_id}</td>
                                                <td className="px-4 py-4 font-semibold text-foreground">{inr(p.amount)}</td>
                                                <td className="px-4 py-4 text-muted-foreground text-xs capitalize">{(p.payment_type || "").replace(/_/g, " ")}</td>
                                                <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${p.status === "success" ? "bg-emerald-500/15 text-emerald-600" : p.status === "failed" ? "bg-red-500/15 text-red-600" : "bg-amber-500/15 text-amber-600"}`}>{p.status}</span></td>
                                                <td className="px-4 py-4 text-right text-muted-foreground text-xs font-semibold">{fmtDate(p.created_at)}</td>
                                            </tr>
                                        ))}
                                        {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No payments recorded yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===================== ENGAGEMENT ===================== */}
                    {activeTab === "engagement" && (
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                {([["leads", leads.length], ["visits", visits.length], ["agreements", agreements.length], ["inquiries", inquiries.length]] as const).map(([k, n]) => (
                                    <button key={k} onClick={() => setEngTab(k as any)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${engTab === k ? "bg-primary-950 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>{k} ({n})</button>
                                ))}
                            </div>
                            <div className="bg-card rounded-2xl p-2 sm:p-6 border border-border shadow-sm overflow-x-auto">
                                {engTab === "leads" && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50"><tr><th className="px-4 py-4 rounded-tl-2xl">Property</th><th className="px-4 py-4">Lead</th><th className="px-4 py-4">Contact</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right rounded-tr-2xl">Date</th></tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {leads.map((l) => (
                                                <tr key={l.id} className="hover:bg-muted/30"><td className="px-4 py-4 font-semibold text-muted-foreground uppercase text-xs">PROP-{l.property_id}</td><td className="px-4 py-4 text-muted-foreground text-xs">USER-{l.user_id} → owner {l.owner_id}</td><td className="px-4 py-4 text-muted-foreground text-xs">{l.phone || l.email || "—"}</td><td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-accent-500/15 text-accent-700 dark:text-accent-300">{l.status}</span></td><td className="px-4 py-4 text-right text-muted-foreground text-xs font-semibold">{fmtDate(l.created_at)}</td></tr>
                                            ))}
                                            {leads.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No leads yet.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                                {engTab === "visits" && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50"><tr><th className="px-4 py-4 rounded-tl-2xl">Property</th><th className="px-4 py-4">Visitor</th><th className="px-4 py-4">Visit Date</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right rounded-tr-2xl">Booked</th></tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {visits.map((v) => (
                                                <tr key={v.id} className="hover:bg-muted/30"><td className="px-4 py-4 font-semibold text-muted-foreground uppercase text-xs">PROP-{v.property_id}</td><td className="px-4 py-4 text-muted-foreground text-xs">USER-{v.user_id}</td><td className="px-4 py-4 text-foreground/80 text-xs">{fmtDateTime(v.visit_date)}</td><td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-teal-500/15 text-teal-700 dark:text-teal-300">{v.status}</span></td><td className="px-4 py-4 text-right text-muted-foreground text-xs font-semibold">{fmtDate(v.created_at)}</td></tr>
                                            ))}
                                            {visits.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No visits scheduled.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                                {engTab === "agreements" && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50"><tr><th className="px-4 py-4 rounded-tl-2xl">Property</th><th className="px-4 py-4">Parties</th><th className="px-4 py-4">Rent / Deposit</th><th className="px-4 py-4">Term</th><th className="px-4 py-4 text-right rounded-tr-2xl">Status</th></tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {agreements.map((a) => (
                                                <tr key={a.id} className="hover:bg-muted/30"><td className="px-4 py-4 font-semibold text-muted-foreground uppercase text-xs">PROP-{a.property_id}</td><td className="px-4 py-4 text-muted-foreground text-xs">T:{a.tenant_id} / O:{a.owner_id}</td><td className="px-4 py-4 text-foreground/80 text-xs">{inr(a.rent_amount)} / {inr(a.deposit_amount)}</td><td className="px-4 py-4 text-muted-foreground text-xs">{fmtDate(a.start_date)} → {fmtDate(a.end_date)}</td><td className="px-4 py-4 text-right"><span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-emerald-500/15 text-emerald-600">{a.status}</span></td></tr>
                                            ))}
                                            {agreements.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No agreements yet.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                                {engTab === "inquiries" && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50"><tr><th className="px-4 py-4 rounded-tl-2xl">Property</th><th className="px-4 py-4">Sender</th><th className="px-4 py-4">Message</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right rounded-tr-2xl">Date</th></tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {inquiries.map((i) => (
                                                <tr key={i.id} className="hover:bg-muted/30"><td className="px-4 py-4 font-semibold text-muted-foreground uppercase text-xs">PROP-{i.property_id}</td><td className="px-4 py-4 text-muted-foreground text-xs">USER-{i.user_id}</td><td className="px-4 py-4 text-foreground/80 max-w-xs truncate">{i.message}</td><td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-accent-500/15 text-accent-700 dark:text-accent-300">{i.status}</span></td><td className="px-4 py-4 text-right text-muted-foreground text-xs font-semibold">{fmtDate(i.created_at)}</td></tr>
                                            ))}
                                            {inquiries.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No inquiries yet.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===================== BROADCAST ===================== */}
                    {activeTab === "broadcast" && (
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-accent-500/15 text-accent-600 flex items-center justify-center"><Megaphone className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="font-display text-2xl text-foreground">Broadcast Notification</h2>
                                    <p className="text-sm text-muted-foreground">Push an in-app notification to a segment of users.</p>
                                </div>
                            </div>
                            <form onSubmit={sendBroadcast} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Title</label>
                                    <input value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} placeholder="e.g. New feature: instant rent agreements" className="mt-2 w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-400" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Message</label>
                                    <textarea value={broadcast.message} onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })} rows={4} placeholder="What do you want users to know?" className="mt-2 w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-400 resize-none" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Audience</label>
                                    <select value={broadcast.audience} onChange={(e) => setBroadcast({ ...broadcast, audience: e.target.value })} className="mt-2 w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-400">
                                        <option value="all">All users</option><option value="owner">Owners</option><option value="tenant">Tenants</option>
                                        <option value="buyer">Buyers</option><option value="agent">Agents</option><option value="builder">Builders</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={sending} className="w-full bg-accent-500 hover:bg-accent-400 text-primary-950 font-semibold tracking-wide text-sm py-4 rounded-full transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    <Megaphone className="w-4 h-4" /> {sending ? "Sending…" : "Send Broadcast"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ===================== AUDIT LOG ===================== */}
                    {activeTab === "audit" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-600 flex items-center justify-center"><ScrollText className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="font-display text-2xl text-foreground">Audit Log</h2>
                                    <p className="text-sm text-muted-foreground">Every admin action, newest first.</p>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl p-2 sm:p-6 border border-border shadow-sm overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50"><tr><th className="px-4 py-4 rounded-tl-2xl">Action</th><th className="px-4 py-4">Target</th><th className="px-4 py-4">Detail</th><th className="px-4 py-4">Actor</th><th className="px-4 py-4 text-right rounded-tr-2xl">When</th></tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {auditLogs.map((l) => (
                                            <tr key={l.id} className="hover:bg-muted/30">
                                                <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-muted text-foreground/80">{l.action}</span></td>
                                                <td className="px-4 py-4 text-muted-foreground text-xs uppercase font-semibold">{l.target_type ? `${l.target_type}-${l.target_id ?? "*"}` : "—"}</td>
                                                <td className="px-4 py-4 text-foreground/80 max-w-md truncate">{l.detail || "—"}</td>
                                                <td className="px-4 py-4 text-muted-foreground text-xs">{l.actor}</td>
                                                <td className="px-4 py-4 text-right text-muted-foreground text-xs font-semibold">{fmtDateTime(l.created_at)}</td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No actions recorded yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </AnimatedSection>
            </div>
        </div>
    );
}
