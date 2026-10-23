"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import ScrollReveal from "@/components/ScrollReveal";
import { wishlistAPI } from "@/utils/api_client";
import PropertySkeleton from "@/components/PropertySkeleton";
import { useToast } from "@/components/Toast";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const response = await wishlistAPI.getWishlist();
            setFavorites(response.data);
        } catch (err: any) {
            console.error("Failed to load wishlist:", err);
            setError("Failed to load favorites. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (propertyId: number) => {
        try {
            await wishlistAPI.removeFromWishlist(propertyId);
            setFavorites(favorites.filter((item) => item.property?.id !== propertyId));
        } catch (error) {
            console.error("Failed to remove from wishlist:", error);
            showToast("Failed to remove property. Please try again.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ───────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="mesh-bg grain-overlay absolute inset-0" />
                <div className="relative z-raised max-w-7xl mx-auto px-4 lg:px-8 py-16 sm:py-20">
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="eyebrow text-accent-300 mb-4"
                    >
                        Saved
                    </motion.p>
                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="text-4xl sm:text-5xl font-display text-[#fbf8f2] leading-[1.05] mb-3"
                    >
                        My Favorites
                    </motion.h1>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.12 }}
                        className="text-[#e6dcc9] font-light"
                    >
                        {favorites.length} saved properties
                    </motion.p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <PropertySkeleton key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500 font-semibold">{error}</p>
                        <button
                            onClick={loadWishlist}
                            className="mt-4 px-6 py-3 bg-accent-500 hover:bg-accent-400 text-primary-950 rounded-full font-semibold tracking-wide text-sm transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {favorites.map((item, index) => {
                            const property = item.property || item;
                            return (
                                <ScrollReveal key={item.id} variant="slideUp" delay={index * 0.08}>
                                    <div className="relative group">
                                        <PropertyCard property={property} index={index} />
                                        <button
                                            onClick={() => removeFavorite(property.id)}
                                            className="absolute top-4 right-4 z-raised bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                ) : (
                    <ScrollReveal variant="scale">
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-600">
                                <Heart className="w-10 h-10" />
                            </div>
                            <h2 className="font-display text-2xl text-foreground mb-2">
                                No favorites yet
                            </h2>
                            <p className="text-muted-foreground font-light mb-8 max-w-sm mx-auto">
                                Start exploring properties and save your favorites here.
                            </p>
                            <a
                                href="/buy"
                                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-primary-950 px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-all"
                            >
                                Explore Properties
                            </a>
                        </div>
                    </ScrollReveal>
                )}
            </div>
        </div>
    );
}
