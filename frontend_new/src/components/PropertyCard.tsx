"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MapPin, Eye, BedDouble, Maximize2, Home } from "lucide-react";
import { Property } from "@/types";
import { getPropertyImageUrl } from "@/utils/imageUrl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { wishlistAPI } from "@/utils/api_client";

interface PropertyCardProps {
    property: Property;
    index?: number;
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const { push } = useRouter();

    const formatPrice = (price: number, type: string) => {
        if (type === "rent") {
            if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L/mo`;
            return `₹${price.toLocaleString()}/mo`;
        }
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
        return `₹${price.toLocaleString()}`;
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem("token");
        if (!token) {
            push('/login');
            return;
        }

        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);

        try {
            if (newFavoriteState) {
                await wishlistAPI.addToWishlist(property.id);
            } else {
                await wishlistAPI.removeFromWishlist(property.id);
            }
        } catch (error) {
            // Revert state if api fails
            setIsFavorite(!newFavoriteState);
            console.error("Failed to update wishlist", error);
        }
    };

    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        push(`/properties/${property.id}`);
    };

    const imageUrl = getPropertyImageUrl(property);

    return (
        <Link href={`/properties/${property.id}`} className="block h-full group">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="bg-white dark:bg-slate-900 rounded-xl h-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
            >
                {/* Image Section with dramatic reveal effect */}
                <div className="relative h-52 sm:h-60 md:h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    {/* Skeleton shimmer — shown until image loads or on error */}
                    {!imgLoaded && !imgError && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%]" />
                    )}

                    {imgError ? (
                        // Styled placeholder when image fails to load
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center">
                            <Home className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-2" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Image</span>
                        </div>
                    ) : (
                        <motion.div
                            animate={{ scale: isHovered ? 1.05 : 1 }}
                            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                            className="w-full h-full"
                        >
                            <Image
                                src={imageUrl}
                                alt={property.title}
                                fill
                                className={`object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'
                                    }`}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => { setImgError(true); setImgLoaded(true); }}
                            />
                        </motion.div>
                    )}

                    {/* Animated gradient overlay on hover */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none"
                    />

                    {/* Type Badge */}
                    <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                        <span className="eyebrow text-[9px] font-bold text-white tracking-wider uppercase">
                            {property.listing_type}
                        </span>
                    </div>

                    {/* Animated favorite button */}
                    <motion.button
                        onClick={handleFavoriteClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={isFavorite ? "Remove from saved homes" : "Save home"}
                        className="absolute top-4 right-4 w-9 h-9 bg-white/95 dark:bg-slate-900/95 shadow-md rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800"
                    >
                        <motion.div
                            animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Heart
                                className={`w-4 h-4 transition-colors ${isFavorite
                                    ? "text-red-500 fill-red-500"
                                    : "text-slate-400 dark:text-slate-500 hover:text-red-500"
                                    }`}
                            />
                        </motion.div>
                    </motion.button>

                    {/* Views Badge */}
                    <div className="absolute bottom-4 right-4 bg-black/45 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">{property.views}</span>
                    </div>
                </div>

                {/* Content Section with editorial typography hierarchy */}
                <div className="p-5 flex flex-col flex-1">
                    {/* Price Display as prominent first element */}
                    <p className="stats-value text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                        {formatPrice(property.price, property.listing_type)}
                    </p>

                    {/* Title */}
                    <h3 className="property-card-title text-base font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 leading-tight mb-1.5">
                        {property.title}
                    </h3>

                    {/* Location */}
                    <p className="text-[0.72rem] font-medium text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate min-w-0">{property.address}, {property.city}</span>
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-850 py-3 mb-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <BedDouble className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate">{property.bedrooms || "-"} BHK</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Maximize2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate">{property.area} Sq Ft</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate">{property.views} Views</span>
                        </div>
                    </div>

                    {/* Owner Info & Contact Button */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                O
                            </div>
                            <span className="text-[0.72rem] font-medium text-slate-500 dark:text-slate-400 truncate">
                                Listed by Owner
                            </span>
                        </div>
                        <button
                            onClick={handleContactClick}
                            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 shadow-sm"
                        >
                            Enquire
                        </button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
