"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Home,
    Eye,
    MessageCircle,
    Gift,
    Plus,
    ChevronRight,
    TrendingUp,
    Calendar
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import PropertyCard from "@/components/PropertyCard";
import { getImageUrl } from "@/utils/imageUrl";
import { userAPI, inquiryAPI, rewardsAPI, wishlistAPI, propertyAPI } from "@/utils/api_client";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [myProperties, setMyProperties] = useState<any[]>([]);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Load user profile
            const userResponse = await userAPI.getProfile();
            const userData = userResponse.data;
            setUser(userData);

            const userType = userData.user_type || "";
            const isPrivRole = ['owner', 'agent', 'builder'].includes(userType.toLowerCase());

            // Load user's properties or wishlist
            if (isPrivRole) {
                const propertiesResponse = await userAPI.getMyProperties();
                setMyProperties(propertiesResponse.data.slice(0, 3));

                try {
                    const inquiriesResponse = await inquiryAPI.getPropertyInquiries();
                    setInquiries(inquiriesResponse.data.slice(0, 3));
                } catch (error) {
                    console.log("No inquiries available");
                }
            } else {
                // Buyer/Tenant: Load Wishlist
                try {
                    const wishlistResponse = await wishlistAPI.getWishlist();
                    // Assuming wishlist returns list of Wishlist objects with property embedded or property data
                    const wishlistItems = wishlistResponse.data.map((item: any) => item.property || item).slice(0, 3);
                    setMyProperties(wishlistItems);
                } catch (e) {
                    console.log("Wishlist not available");
                }

                // Load their own inquiries
                try {
                    const inquiriesResponse = await inquiryAPI.getMyInquiries();
                    setInquiries(inquiriesResponse.data.slice(0, 3));
                } catch (error) {
                    console.log("No inquiries available");
                }
            }

            // Load AI recommendations (mocked using standard search for now)
            if (!isPrivRole) {
                try {
                    const recommendationsResponse = await propertyAPI.search({ limit: 3 });
                    // API returns an array or an object with items
                    const data = recommendationsResponse.data;
                    setAiRecommendations(Array.isArray(data) ? data : (data as any).items || []);
                } catch (e) {
                    console.log("AI recommendations not available", e);
                }
            }

            // Load reward points
            try {
                const rewardsResponse = await rewardsAPI.getUserPoints();
                setRewardPoints(rewardsResponse.data.points);
            } catch (error) {
                console.log("Rewards not available");
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: "Active Listings", value: myProperties.length.toString(), icon: Home, color: "bg-primary-800" },
        { label: "Total Inquiries", value: inquiries.length.toString(), icon: MessageCircle, color: "bg-sage-600" },
        { label: "Property Views", value: myProperties.reduce((sum, p) => sum + (p.views || 0), 0).toString(), icon: Eye, color: "bg-accent-500" },
        { label: "Reward Points", value: rewardPoints.toString(), icon: Gift, color: "bg-accent-700" },
    ];

    if (loading) {
        return (
            <div className="py-10 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const isPrivilegedRole = user?.user_type && ['owner', 'agent', 'builder'].includes(user.user_type.toLowerCase());

    return (
        <div className="py-8 sm:py-10 min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                {/* Welcome Header */}
                <AnimatedSection>
                    <div className="relative overflow-hidden rounded-2xl bg-primary-950 p-6 sm:p-8 md:p-12 mb-8 sm:mb-10 shadow-2xl">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80"
                                alt="Dashboard Background"
                                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/90 to-primary-950/70" />
                        </div>

                        <div className="relative z-raised flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                            <div className="min-w-0 flex-1">
                                <p className="eyebrow text-accent-300 mb-3">Dashboard</p>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-white mb-2 leading-tight break-words">
                                    Welcome back, <span className="italic text-accent-300">{user?.full_name || "User"}</span>! 👋
                                </h1>
                                <p className="text-sm sm:text-base text-primary-100 font-light max-w-xl">
                                    Here&apos;s a quick overview of your account activity, property performance, and recent inquiries.
                                </p>
                            </div>
                            {isPrivilegedRole && (
                                <Link
                                    href="/post-property"
                                    className="shrink-0 bg-accent-500 hover:bg-accent-400 text-primary-950 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-semibold tracking-wide text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl shadow-accent-500/20"
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Post Property</span>
                                    <span className="sm:hidden">Post</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </AnimatedSection>

                {/* Stats Grid - Enhanced visual design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                            className="group relative"
                        >
                            {/* Diagonal stripe background effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 to-transparent rounded-2xl transform -skew-y-2 group-hover:skew-y-0 transition-transform duration-500" />

                            <div className="relative premium-card bg-card/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 md:p-8 border border-border hover:border-accent-400/50 shadow-xl hover:-translate-y-2 transition-all overflow-hidden min-h-[140px] sm:min-h-[160px]">
                                {/* Animated icon with color glow */}
                                <motion.div
                                    animate={{
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg relative`}
                                >
                                    <div className={`absolute inset-0 ${stat.color} opacity-30 blur-xl`} />
                                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 relative z-raised" />
                                </motion.div>

                                <p className="stats-value text-3xl sm:text-4xl md:text-5xl font-display text-foreground mb-2 truncate">
                                    {stat.value}
                                </p>
                                <p className="text-[9px] sm:text-[10px] md:text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground line-clamp-2">
                                    {stat.label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {/* Recent Listings or Saved Properties */}
                    <AnimatedSection delay={0.2}>
                        <div className="bg-card rounded-2xl p-5 sm:p-6 md:p-8 border border-border shadow-xl flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h2 className="font-display text-xl sm:text-2xl text-foreground">
                                    {isPrivilegedRole ? "Your Listings" : "Saved Properties"}
                                </h2>
                                <Link
                                    href={isPrivilegedRole ? "/my-listings" : "/properties"}
                                    className="text-xs font-semibold uppercase tracking-widest text-accent-600 flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View All <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {myProperties.length > 0 ? (
                                <div className="space-y-4 flex-1">
                                    {myProperties.map((property) => (
                                        <div
                                            key={property.id}
                                            className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-xl sm:rounded-2xl border border-border hover:border-accent-400/50 hover:shadow-lg transition-all cursor-pointer group"
                                        >
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg sm:rounded-xl overflow-hidden shrink-0 relative">
                                                {property.images && property.images[0] ? (
                                                    <img
                                                        src={getImageUrl(property.images[0].image_url)}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                                        <Home className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                                <h3 className="font-semibold text-sm text-foreground truncate mb-1">
                                                    {property.title}
                                                </h3>
                                                <p className="text-xs font-medium text-muted-foreground mb-2 truncate">
                                                    {property.city}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                                        <Eye className="w-3 h-3 text-accent-500" /> {property.views || 0} views
                                                    </span>
                                                    {isPrivilegedRole && (
                                                        <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${property.is_active ? "bg-sage-500/15 text-sage-700 dark:text-sage-300" : "bg-muted text-muted-foreground"}`}>
                                                            {property.is_active ? "Active" : "Draft"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex-1 flex flex-col items-center justify-center opacity-70">
                                    <Home className="w-12 h-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground font-medium mb-4">
                                        {isPrivilegedRole ? "You haven't posted any properties yet." : "You have no saved properties."}
                                    </p>
                                    <Link
                                        href={isPrivilegedRole ? "/post-property" : "/properties"}
                                        className="text-accent-600 font-semibold uppercase tracking-widest text-xs hover:text-accent-500 transition-colors"
                                    >
                                        {isPrivilegedRole ? "Post your first property" : "Browse premium listings"}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </AnimatedSection>

                    {/* Recent Inquiries */}
                    <AnimatedSection delay={0.3}>
                        <div className="bg-card rounded-2xl p-5 sm:p-6 md:p-8 border border-border shadow-xl flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h2 className="font-display text-xl sm:text-2xl text-foreground">
                                    Latest Inquiries
                                </h2>
                                <Link
                                    href="/notifications"
                                    className="text-xs font-semibold uppercase tracking-widest text-accent-600 flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View All <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {inquiries.length > 0 ? (
                                <div className="space-y-4 flex-1">
                                    {inquiries.map((inquiry) => (
                                        <div
                                            key={inquiry.id}
                                            className="p-5 bg-muted/50 rounded-2xl border border-border hover:border-accent-400/50 hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-semibold text-sm text-foreground">
                                                    {inquiry.message?.match(/Contact:\s*(.+?)(?=\n|$)/)?.[1] || "Inquiry # " + inquiry.id}
                                                </h3>
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${inquiry.status === "pending"
                                                        ? "bg-accent-500/15 text-accent-700 dark:text-accent-300"
                                                        : "bg-sage-500/15 text-sage-700 dark:text-sage-300"
                                                        }`}
                                                >
                                                    {inquiry.status || "pending"}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-muted-foreground mb-4 line-clamp-2">
                                                {inquiry.message || "No message provided."}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                                <Calendar className="w-3 h-3 text-accent-500" /> {new Date(inquiry.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex-1 flex flex-col items-center justify-center opacity-70">
                                    <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground font-medium">No recent inquiries to display.</p>
                                </div>
                            )}
                        </div>
                    </AnimatedSection>
                </div>

                {/* AI Recommendations (for buyers only) */}
                {!isPrivilegedRole && aiRecommendations.length > 0 && (
                    <AnimatedSection delay={0.35}>
                        <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <h2 className="font-display text-xl sm:text-2xl text-foreground flex items-center gap-2">
                                    <span className="text-xl sm:text-2xl">✨</span> AI-Powered Recommendations
                                </h2>
                                <Link
                                    href="/properties"
                                    className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-accent-600 flex items-center gap-1 hover:gap-2 transition-all shrink-0"
                                >
                                    Browse More <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {aiRecommendations.map((prop, idx) => (
                                    <PropertyCard key={prop.id} property={prop} index={idx} />
                                ))}
                            </div>
                        </div>
                    </AnimatedSection>
                )}

                {/* Quick Actions */}
                <AnimatedSection delay={0.4}>
                    <div className="mt-8 bg-primary-950 rounded-2xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/20 rounded-full blur-[80px]" />
                        <h2 className="font-display text-2xl mb-8 relative z-raised">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 relative z-raised">
                            {[
                                isPrivilegedRole ? { label: "Post Property", href: "/post-property", icon: Plus, color: "text-accent-400" } : null,
                                { label: "View Chats", href: "/chats", icon: MessageCircle, color: "text-teal-300" },
                                { label: "My Favorites", href: "/favorites", icon: Gift, color: "text-accent-300" },
                                { label: "Get Help", href: "/help", icon: MessageCircle, color: "text-teal-400" },
                            ].filter(Boolean).map((action: any) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="flex flex-col items-center justify-center gap-4 p-6 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-400/30 hover:-translate-y-1 rounded-2xl transition-all group"
                                >
                                    <action.icon className={`w-8 h-8 ${action.color} group-hover:scale-110 transition-transform`} />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-primary-100 text-center">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </div>
    );
}
