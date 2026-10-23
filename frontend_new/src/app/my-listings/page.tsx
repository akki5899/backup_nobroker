"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Eye,
    Heart,
    Share2,
    Edit,
    Trash2,
    ArrowLeft,
    MapPin,
    Bed,
    Bath,
    Maximize2,
    IndianRupee,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { userAPI } from "@/utils/api_client";
import { getImageUrl } from "@/utils/imageUrl";
import { useToast } from "@/components/Toast";
import { useModalDismiss } from "@/hooks/useModalDismiss";

export default function MyListingsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    useModalDismiss(showDetails, () => setShowDetails(false));

    // Map a listing's moderation state to a human label + badge styling.
    // Falls back to the legacy is_active flag for any pre-moderation rows.
    const getStatus = (p: any): { label: string; cls: string } => {
        const s = p?.moderation_status;
        if (s === "pending") return { label: "Pending Review", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
        if (s === "rejected") return { label: "Rejected", cls: "bg-red-500/15 text-red-600 dark:text-red-400" };
        if (s === "approved") return { label: "Approved", cls: "bg-sage-500/15 text-sage-700 dark:text-sage-300" };
        return p?.is_active
            ? { label: "Active", cls: "bg-sage-500/15 text-sage-700 dark:text-sage-300" }
            : { label: "Inactive", cls: "bg-red-500/15 text-red-600 dark:text-red-400" };
    };

    useEffect(() => {
        loadMyProperties();
    }, []);

    const loadMyProperties = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getMyProperties();
            setProperties(response.data);
        } catch (error) {
            console.error("Failed to load properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePropertyClick = (property: any) => {
        setSelectedProperty(property);
        setShowDetails(true);
    };

    const handleDeleteProperty = async (propertyId: number) => {
        if (pendingDeleteId === propertyId) {
            // Second click = confirmed
            try {
                await userAPI.deleteProperty(propertyId);
                setProperties(properties.filter(p => p.id !== propertyId));
                setShowDetails(false);
                setPendingDeleteId(null);
                showToast("Property deleted successfully", "success");
            } catch (error) {
                console.error("Failed to delete property:", error);
                showToast("Failed to delete property. Please try again.", "error");
                setPendingDeleteId(null);
            }
        } else {
            // First click = ask for confirmation via toast
            setPendingDeleteId(propertyId);
            showToast("Click Delete again to confirm removal.", "warning");
            setTimeout(() => setPendingDeleteId(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="py-10 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your listings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 sm:py-10 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <AnimatedSection>
                    <div className="flex items-center gap-4 mb-10">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-muted rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="eyebrow text-accent-600 mb-2">Dashboard</p>
                            <h1 className="font-display text-3xl sm:text-4xl text-foreground">
                                My Listings
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                {properties.length} {properties.length === 1 ? "property" : "properties"}
                            </p>
                        </div>
                    </div>
                </AnimatedSection>

                {properties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property, index) => (
                            <AnimatedSection key={property.id} delay={index * 0.05}>
                                <motion.div
                                    onClick={() => handlePropertyClick(property)}
                                    className="bg-card rounded-2xl overflow-hidden border border-border hover:border-accent-400/50 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Image Container */}
                                    <div className="relative h-48 bg-muted overflow-hidden">
                                        {property.images && property.images[0] ? (
                                            <img
                                                src={getImageUrl(property.images[0].image_url)}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${getStatus(property).cls}`}
                                            >
                                                {getStatus(property).label}
                                            </span>
                                        </div>

                                        {/* Views Counter */}
                                        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-semibold">
                                            <Eye className="w-3 h-3" />
                                            {property.views || 0}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-display text-lg text-foreground mb-2 line-clamp-2">
                                            {property.title}
                                        </h3>

                                        <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground mb-3">
                                            <MapPin className="w-3 h-3" />
                                            {property.city}, {property.state}
                                        </div>

                                        {/* Property Details */}
                                        <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-border">
                                            {property.bedrooms && (
                                                <div className="text-center">
                                                    <div className="flex justify-center mb-1">
                                                        <Bed className="w-4 h-4 text-foreground/80" />
                                                    </div>
                                                    <p className="text-[10px] font-semibold text-foreground/80">
                                                        {property.bedrooms}
                                                    </p>
                                                </div>
                                            )}
                                            {property.bathrooms && (
                                                <div className="text-center">
                                                    <div className="flex justify-center mb-1">
                                                        <Bath className="w-4 h-4 text-foreground/80" />
                                                    </div>
                                                    <p className="text-[10px] font-semibold text-foreground/80">
                                                        {property.bathrooms}
                                                    </p>
                                                </div>
                                            )}
                                            {property.area && (
                                                <div className="text-center">
                                                    <div className="flex justify-center mb-1">
                                                        <Maximize2 className="w-4 h-4 text-foreground/80" />
                                                    </div>
                                                    <p className="text-[10px] font-semibold text-foreground/80">
                                                        {property.area} sqft
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price */}
                                        {property.price && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <IndianRupee className="w-4 h-4 text-accent-600" />
                                                    <span className="font-display text-lg text-foreground">
                                                        {(property.price / 100000).toFixed(1)}L
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatedSection>
                        ))}
                    </div>
                ) : (
                    <AnimatedSection>
                        <div className="text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border">
                            <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center text-accent-600 mx-auto mb-4">
                                <Eye className="w-8 h-8" />
                            </div>
                            <h2 className="font-display text-2xl text-foreground mb-2">
                                No Listings Yet
                            </h2>
                            <p className="text-muted-foreground font-light mb-6">
                                Start by posting your first property
                            </p>
                            <Link
                                href="/post-property"
                                className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-6 py-3 rounded-full font-semibold tracking-wide text-sm inline-block transition-all"
                            >
                                Post a Property
                            </Link>
                        </div>
                    </AnimatedSection>
                )}
            </div>

            {/* Property Details Modal */}
            {showDetails && selectedProperty && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal flex items-center justify-center p-4"
                    role="dialog" aria-modal="true"
                    onClick={() => setShowDetails(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <div className="sticky top-0 bg-card flex justify-end p-4 border-b border-border z-raised">
                            <button
                                onClick={() => setShowDetails(false)}
                                aria-label="Close"
                                className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors"
                            >
                                <span className="text-2xl" aria-hidden="true">&times;</span>
                            </button>
                        </div>

                        <div className="p-6 sm:p-8">
                            {/* Images Gallery */}
                            <div className="mb-6">
                                {selectedProperty.images && selectedProperty.images[0] ? (
                                    <img
                                        src={getImageUrl(selectedProperty.images[0].image_url)}
                                        alt={selectedProperty.title}
                                        className="w-full h-80 object-cover rounded-2xl mb-4"
                                    />
                                ) : (
                                    <div className="w-full h-80 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-2xl mb-4" />
                                )}

                                {selectedProperty.images && selectedProperty.images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {selectedProperty.images.map((img: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                                            >
                                                <img
                                                    src={getImageUrl(img.image_url)}
                                                    alt={`Gallery ${idx}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-2">
                                {selectedProperty.title}
                            </h2>

                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <MapPin className="w-4 h-4" />
                                {selectedProperty.city}, {selectedProperty.state}
                            </div>

                            {/* Price */}
                            {selectedProperty.price && (
                                <div className="mb-6 p-4 bg-accent-500/10 rounded-xl">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-1">Price</p>
                                    <div className="flex items-baseline gap-2">
                                        <IndianRupee className="w-6 h-6 text-accent-600" />
                                        <span className="font-display text-3xl text-accent-600">
                                            {(selectedProperty.price / 100000).toFixed(1)}L
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Key Details */}
                            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
                                {selectedProperty.bedrooms && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bed className="w-5 h-5 text-foreground/80" />
                                            <span className="font-bold text-foreground/80">
                                                {selectedProperty.bedrooms}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-semibold text-muted-foreground">Bedrooms</p>
                                    </div>
                                )}
                                {selectedProperty.bathrooms && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bath className="w-5 h-5 text-foreground/80" />
                                            <span className="font-bold text-foreground/80">
                                                {selectedProperty.bathrooms}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-semibold text-muted-foreground">Bathrooms</p>
                                    </div>
                                )}
                                {selectedProperty.area && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Maximize2 className="w-5 h-5 text-foreground/80" />
                                            <span className="font-bold text-foreground/80">
                                                {selectedProperty.area}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-semibold text-muted-foreground">Sq. Ft.</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {selectedProperty.description && (
                                <div className="mb-6">
                                    <h3 className="font-display text-lg text-foreground mb-2">Description</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {selectedProperty.description}
                                    </p>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Views</p>
                                    <p className="font-display text-2xl text-foreground">
                                        {selectedProperty.views || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</p>
                                    <span className={`inline-block mt-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${getStatus(selectedProperty).cls}`}>
                                        {getStatus(selectedProperty).label}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Link
                                    href={`/post-property?id=${selectedProperty.id}`}
                                    className="flex-1 bg-accent-500 hover:bg-accent-400 text-primary-950 px-4 py-3 rounded-full font-semibold tracking-wide text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => handleDeleteProperty(selectedProperty.id)}
                                    className="flex-1 bg-red-500/15 text-red-600 px-4 py-3 rounded-full font-semibold tracking-wide text-sm flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="flex-1 bg-muted text-foreground px-4 py-3 rounded-full font-semibold tracking-wide text-sm hover:bg-muted/70 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
