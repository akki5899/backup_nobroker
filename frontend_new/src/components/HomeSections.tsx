"use client";

import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import {
    BadgeIndianRupee,
    Video,
    CarFront,
    Handshake,
    Building2,
    Star,
    Crown,
    CalendarCheck,
    MapPin,
    Clock,
    ArrowRight,
} from "lucide-react";

// E19 — Why Choose Us / Advantages
const advantages = [
    {
        icon: BadgeIndianRupee,
        title: "Bottom Rate Guarantee",
        desc: "Competitive pricing and transparent property deals.",
    },
    {
        icon: Video,
        title: "Online Site Visit",
        desc: "Visit projects virtually from the comfort of your home.",
    },
    {
        icon: CarFront,
        title: "Free Site Visit",
        desc: "Free pickup and drop for unlimited property visits.",
    },
    {
        icon: Handshake,
        title: "No Brokerage Charges",
        desc: "Direct property access with transparent communication.",
    },
];

// E20 — Top Developers
const developers = [
    {
        icon: Building2,
        title: "Top Builders",
        desc: "Partnered with India's most reputed construction names.",
    },
    {
        icon: Star,
        title: "Featured Developers",
        desc: "Hand-picked developers with proven track records.",
    },
    {
        icon: Crown,
        title: "Premium Villa Developers",
        desc: "Specialists in luxury villas and premium row-houses.",
    },
];

// E21 — Free Site Visit highlights
const visitPerks = [
    {
        icon: CalendarCheck,
        title: "Schedule Easily",
        desc: "Pick a date and time that works for you.",
    },
    {
        icon: MapPin,
        title: "Hassle-Free Booking",
        desc: "Free pickup and drop to your chosen projects.",
    },
    {
        icon: Clock,
        title: "Convenient Exploration",
        desc: "Explore multiple properties in a single trip.",
    },
];

export default function HomeSections() {
    return (
        <>
            {/* E19 — Why Choose Us / Advantages */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 lg:px-8">
                <ScrollReveal variant="slideUp">
                    <p className="eyebrow text-center text-emerald-600 mb-4 font-semibold">
                        The Advantages
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-5 text-center text-foreground">
                        Why people choose us
                    </h2>
                    <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto font-light leading-relaxed">
                        A few of the reasons buyers and owners trust us with one of the
                        biggest decisions they&rsquo;ll make.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {advantages.map((item, index) => (
                        <ScrollReveal key={item.title} variant="scale" delay={index * 0.1}>
                            <div className="h-full p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-500 group">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-sans font-semibold text-lg mb-2 text-foreground">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                                    {item.desc}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* E20 — Top Developers */}
            <section className="bg-slate-50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/60 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <ScrollReveal variant="slideUp">
                        <p className="eyebrow text-center text-emerald-600 mb-4 font-semibold">
                            Our Partners
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-5 text-center text-foreground">
                            The names behind the homes
                        </h2>
                        <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto font-light leading-relaxed">
                            We partner with India&rsquo;s most reputed developers so every
                            listing meets a standard worth your trust.
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        {developers.map((item, index) => (
                            <ScrollReveal key={item.title} variant="scale" delay={index * 0.1}>
                                <div className="h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-500 group">
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mb-8 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-sans font-semibold text-lg mb-2 text-foreground">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                                        {item.desc}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* E21 — Free Site Visit */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 lg:px-8">
                <div className="rounded-3xl mesh-bg grain-overlay p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
                    <div className="relative z-raised grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="eyebrow text-emerald-400 mb-4 font-semibold">
                                Free Site Visit
                            </p>
                            <h2 className="text-3xl sm:text-5xl font-display text-white mb-5 leading-[1.05]">
                                See it in person.<br />
                                <span className="italic text-emerald-400">We&rsquo;ll drive.</span>
                            </h2>
                            <p className="text-slate-300 mb-9 max-w-md font-light leading-relaxed">
                                Hassle-free booking and convenient exploration — we handle the
                                logistics so you can focus on finding the right home.
                            </p>
                            <Link
                                href="/properties"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold tracking-wide text-sm rounded-full transition-all shadow-md"
                            >
                                Book a Free Visit
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid gap-4">
                            {visitPerks.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-4 bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800"
                                >
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-display text-lg text-white mb-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm text-slate-300 font-light">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
