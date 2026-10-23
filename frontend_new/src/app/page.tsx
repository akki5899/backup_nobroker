"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Key, Home, Building2, Building, Train, Bus, Route, GraduationCap, Stethoscope, Plane, Laptop, ShoppingBag, Plus, ArrowUpRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import ScrollReveal from "@/components/ScrollReveal";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import HomeSections from "@/components/HomeSections";
import { stats, categories } from "@/data/properties";
import { propertyAPI } from "@/utils/api_client";
import { Property } from "@/types";

const connectivityIcons: Record<string, React.ReactNode> = {
    Metro: <Train className="w-5 h-5" />,
    Bus: <Bus className="w-5 h-5" />,
    Highway: <Route className="w-5 h-5" />,
    Schools: <GraduationCap className="w-5 h-5" />,
    Hospitals: <Stethoscope className="w-5 h-5" />,
    Airport: <Plane className="w-5 h-5" />,
    "IT Hubs": <Laptop className="w-5 h-5" />,
    Malls: <ShoppingBag className="w-5 h-5" />,
};

const categoryIcons: Record<string, React.ReactNode> = {
    Key: <Key className="w-7 h-7" />,
    Home: <Home className="w-7 h-7" />,
    Building2: <Building2 className="w-7 h-7" />,
    Building: <Building className="w-7 h-7" />,
};

// label -> backend connectivity key (see /properties?connectivity=<key>)
const connectivityFilters: { label: string; key: string }[] = [
    { label: "Metro", key: "metro" },
    { label: "Bus", key: "bus" },
    { label: "Highway", key: "highway" },
    { label: "Schools", key: "schools" },
    { label: "Hospitals", key: "hospitals" },
    { label: "Airport", key: "airport" },
    { label: "IT Hubs", key: "it_hubs" },
    { label: "Malls", key: "malls" },
];

export default function HomePage() {
    const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [highwayProperties, setHighwayProperties] = useState<Property[]>([]);
    const [loadingHighwayProperties, setLoadingHighwayProperties] = useState(true);

    useEffect(() => {
        const fetchFeaturedProperties = async () => {
            try {
                const response = await propertyAPI.search({ limit: 6, sort_by: "views" });
                const data = response.data;
                const properties = Array.isArray(data) ? data : (data as any).items || [];
                setFeaturedProperties(properties);
            } catch (err) {
                console.error("Failed to fetch featured properties:", err);
            } finally {
                setLoadingProperties(false);
            }
        };

        const fetchHighwayProperties = async () => {
            try {
                // Fetch properties with highway/main road connectivity
                // This would ideally use a backend filter for connectivity
                const response = await propertyAPI.search({ limit: 6, sort_by: "created_at" });
                const data = response.data;
                const properties = Array.isArray(data) ? data : (data as any).items || [];
                setHighwayProperties(properties);
            } catch (err) {
                console.error("Failed to fetch highway properties:", err);
            } finally {
                setLoadingHighwayProperties(false);
            }
        };

        fetchFeaturedProperties();
        fetchHighwayProperties();
    }, []);

    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-[620px] sm:min-h-[720px] flex items-center justify-center pt-20 pb-40 sm:pb-48 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
                        alt="Luxury Property"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Modern editorial scrim — slate charcoal, not warm espresso */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-raised max-w-5xl mx-auto px-4 text-center mt-4 sm:mt-8">
                    <AnimatedSection delay={0.1}>
                        <div className="inline-flex items-center gap-2.5 bg-slate-900/60 border border-slate-700/60 px-5 py-2 text-white text-xs font-semibold rounded-full mb-7 sm:mb-9 tracking-wide shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="eyebrow text-[10px] text-slate-100">
                                <span className="hidden xs:inline">Verified Villas &amp; Row-Houses</span>
                                <span className="xs:hidden">Verified Homes</span>
                            </span>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                        <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] text-white mb-5 sm:mb-7 px-2">
                            Find your{" "}
                            <span className="italic text-emerald-400">forever</span>{" "}
                            home.
                        </h1>
                    </AnimatedSection>

                    <AnimatedSection delay={0.3}>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-9 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed px-4">
                            A considered collection of villas and row-houses — verified, broker-free,
                            and ready for you to explore on your own terms.
                        </p>
                    </AnimatedSection>

                    <AnimatedSection delay={0.4}>
                        <Suspense fallback={<div className="h-24 w-full" />}>
                            <SearchBar />
                        </Suspense>
                    </AnimatedSection>

                    <AnimatedSection delay={0.5}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-7 relative z-0">
                            <Link
                                href="/post-property"
                                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold tracking-wide rounded-full transition-all w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                <span>List Your Property — Free</span>
                            </Link>
                            <span className="text-slate-400 text-[0.8rem] font-light">
                                Trusted by thousands of homeowners
                            </span>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Stats Section */}
            <section className="max-w-5xl mx-auto px-4 -mt-24 sm:-mt-28 relative z-raised">
                <div className="glass-strong rounded-3xl border border-border shadow-2xl px-6 sm:px-10 py-8 sm:py-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 divide-x-0 lg:divide-x divide-border">
                        {stats.map((stat, index) => (
                            <ScrollReveal key={stat.label} variant="scale" delay={index * 0.1}>
                                <div className="text-center px-2 lg:px-4 group">
                                    <h3 className="stats-value text-4xl sm:text-5xl text-primary-800 dark:text-accent-400 mb-2 group-hover:scale-105 transition-transform origin-center">
                                        {stat.value}
                                    </h3>
                                    <p className="eyebrow text-[9px] text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 lg:px-8">
                <ScrollReveal variant="slideUp">
                    <p className="eyebrow text-center text-accent-600 mb-4">Browse by Type</p>
                    <h2 className="text-3xl sm:text-5xl font-display mb-5 text-center text-foreground">
                        What are you looking for?
                    </h2>
                    <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto font-light leading-relaxed">
                        Every listing is verified by our team — start with the kind of home you have in mind.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {categories.map((cat, index) => (
                        <ScrollReveal key={cat.title} variant="scale" delay={index * 0.1}>
                            <Link href={(cat as any).link || "/buy"}>
                                <div className="p-8 rounded-2xl bg-card border border-border hover:border-accent-400/50 hover:-translate-y-1 transition-all duration-500 group cursor-pointer h-full relative overflow-hidden">
                                    <div className="absolute -right-12 -top-12 w-44 h-44 bg-accent-500/[0.06] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                    <div className="w-14 h-14 bg-primary-900/5 dark:bg-accent-500/10 rounded-full flex items-center justify-center mb-7 group-hover:bg-primary-900 dark:group-hover:bg-accent-500 group-hover:text-accent-300 dark:group-hover:text-primary-950 text-primary-800 dark:text-accent-400 transition-colors duration-500 relative z-raised">
                                        {categoryIcons[cat.icon]}
                                    </div>
                                    <h4 className="font-display text-xl mb-2 text-foreground flex items-center gap-2">
                                        {cat.title}
                                        <ArrowUpRight className="w-4 h-4 text-accent-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h4>
                                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                                        {cat.description}
                                    </p>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* New Homepage Sections: Why Choose Us, Top Developers, Free Site Visit */}
            <HomeSections />

            {/* Connectivity Filters */}
            <section className="bg-muted/50 engrave-top border-b border-border py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <AnimatedSection>
                        <p className="eyebrow text-accent-600 mb-4">Location &amp; Access</p>
                        <h2 className="text-3xl sm:text-5xl font-display mb-5 text-foreground">
                            Connectivity matters
                        </h2>
                        <p className="text-muted-foreground mb-12 max-w-xl font-light leading-relaxed">
                            Browse homes by what&rsquo;s nearby — the commute, the schools, the
                            things that shape everyday life.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
                        {connectivityFilters.map((item, index) => (
                            <AnimatedSection key={item.key} delay={index * 0.05}>
                                <Link href={`/properties?connectivity=${item.key}`}>
                                    <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border hover:border-accent-400/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer group w-full">
                                        <div className="text-primary-800 dark:text-accent-400 group-hover:scale-110 group-hover:text-accent-600 transition-all duration-300">
                                            {connectivityIcons[item.label]}
                                        </div>
                                        <span className="eyebrow text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 lg:px-8">
                <ScrollReveal variant="slideUp">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
                        <div>
                            <p className="eyebrow text-accent-600 mb-4">Hand-picked</p>
                            <h2 className="text-3xl sm:text-5xl font-display text-foreground">
                                Featured homes
                            </h2>
                        </div>
                        <Link
                            href="/properties"
                            className="group inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-wide text-foreground/70 hover:text-accent-600 transition-colors link-underline"
                        >
                            View Full Collection
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </ScrollReveal>

                {loadingProperties ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <PropertyCardSkeleton key={i} />
                        ))}
                    </div>
                ) : featuredProperties.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                        <Home className="w-10 h-10 mx-auto mb-4 text-muted-foreground/60" />
                        <h3 className="font-display text-2xl text-foreground mb-2">
                            No homes listed yet
                        </h3>
                        <p className="text-muted-foreground font-light">
                            New listings are added regularly — do check back soon.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {featuredProperties.map((property, index) => (
                            <PropertyCard key={property.id} property={property} index={index} />
                        ))}
                    </div>
                )}
            </section>

            {/* Highway/Main Road-Connected Properties */}
            <section className="py-20 sm:py-28 bg-muted/50 engrave-top border-b border-border">
              <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <AnimatedSection>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
                        <div>
                            <p className="eyebrow text-accent-600 mb-4 flex items-center gap-2">
                                <Route className="w-4 h-4" /> Well Connected
                            </p>
                            <h2 className="text-3xl sm:text-5xl font-display text-foreground">
                                Close to the main roads
                            </h2>
                        </div>
                        <Link
                            href="/properties?connectivity=highway"
                            className="group inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-wide text-foreground/70 hover:text-accent-600 transition-colors link-underline"
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </AnimatedSection>

                {loadingHighwayProperties ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <PropertyCardSkeleton key={i} />
                        ))}
                    </div>
                ) : highwayProperties.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                        <Route className="w-10 h-10 mx-auto mb-4 text-muted-foreground/60" />
                        <h3 className="font-display text-2xl text-foreground mb-2">
                            Nothing here just yet
                        </h3>
                        <p className="text-muted-foreground font-light">
                            New well-connected listings are added regularly.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {highwayProperties.map((property, index) => (
                            <PropertyCard key={property.id} property={property} index={index} />
                        ))}
                    </div>
                )}
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-slate-950 dark:bg-[#0b0f19] border-t border-slate-900 py-24 sm:py-36 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.18]">
                    <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] bg-emerald-500 rounded-full blur-3xl mix-blend-screen" />
                    <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] bg-slate-800 rounded-full blur-3xl mix-blend-screen" />
                </div>
                <div className="max-w-3xl mx-auto px-4 text-center relative z-raised">
                    <AnimatedSection>
                        <p className="eyebrow text-emerald-400 mb-5">For Homeowners</p>
                        <h2 className="text-4xl sm:text-6xl font-display text-white mb-6 leading-[1.05]">
                            List your home, <span className="italic text-emerald-400">your way.</span>
                        </h2>
                        <p className="text-slate-300 text-lg mb-11 max-w-xl mx-auto font-light leading-relaxed">
                            No brokerage, no middlemen. Reach serious buyers directly and stay
                            in control of every conversation.
                        </p>
                        <Link
                            href="/post-property"
                            className="inline-flex items-center gap-3 bg-emerald-600 text-white px-9 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-emerald-700 hover:scale-[1.02] transition-all duration-300 shadow-lg"
                        >
                            List Your Property
                            <ArrowUpRight className="w-5 h-5" />
                        </Link>
                    </AnimatedSection>
                </div>
            </section>
        </>
    );
}
