"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const faqs = [
    {
        question: "What is RightVillaNest and how does it work?",
        answer:
            "RightVillaNest is a trusted property platform specialising in villas and row-houses. We connect property owners directly with buyers and tenants. Simply browse listings, contact owners directly, and close deals with confidence.",
    },
    {
        question: "Is RightVillaNest completely free?",
        answer:
            "Yes! For buyers and tenants, RightVillaNest is 100% free. Property owners can list their properties for free as well. We offer optional premium features for enhanced visibility, but the core service is always free.",
    },
    {
        question: "How do you verify property owners?",
        answer:
            "We use a multi-step verification process including phone verification, document verification, and property ownership verification. Look for the 'Verified Owner' badge on listings for maximum trust.",
    },
    {
        question: "Can I schedule site visits through the platform?",
        answer:
            "Absolutely! You can request site visits directly through our chat feature. Coordinate with property owners at your convenience and schedule visits that work for both parties.",
    },
    {
        question: "What happens if I face issues with a property owner?",
        answer:
            "Our support team is available 24/7 to help resolve any disputes. Use the 'Report' button on any listing or contact our support team directly. We take user safety very seriously.",
    },
    {
        question: "How do I get my property featured?",
        answer:
            "Premium listings appear at the top of search results and get up to 10x more visibility. You can upgrade your listing from your dashboard under 'My Properties' section.",
    },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const filteredFaqs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="mesh-bg grain-overlay absolute inset-0" />
                <div className="relative z-raised max-w-4xl mx-auto px-4 lg:px-8 py-16 sm:py-24 text-center">
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="eyebrow text-accent-300 mb-4"
                    >
                        Help Center
                    </motion.p>
                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="text-4xl sm:text-5xl font-display text-[#fbf8f2] leading-[1.05] mb-4"
                    >
                        How can we <span className="italic text-accent-300">help you?</span>
                    </motion.h1>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.12 }}
                        className="text-[#e6dcc9] max-w-xl mx-auto font-light leading-relaxed"
                    >
                        Find answers to common questions or get in touch with our support team.
                    </motion.p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
                {/* Search */}
                <ScrollReveal variant="slideUp">
                    <div className="relative mb-12">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for help..."
                            className="w-full bg-card border border-border rounded-2xl px-14 py-5 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-semibold shadow-sm text-foreground"
                        />
                    </div>
                </ScrollReveal>

                {/* FAQs */}
                <ScrollReveal variant="slideUp" delay={0.1}>
                    <p className="eyebrow text-accent-600 mb-4">Questions</p>
                    <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-6">
                        Frequently Asked Questions
                    </h2>
                </ScrollReveal>

                <div className="space-y-4">
                    {filteredFaqs.map((faq, index) => (
                        <ScrollReveal key={index} variant="slideUp" delay={index * 0.06}>
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-card rounded-2xl border border-border hover:border-accent-400/50 overflow-hidden transition-colors duration-500"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <span className="font-semibold text-sm text-foreground pr-4">
                                        {faq.question}
                                    </span>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-accent-600 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                                    )}
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: openIndex === index ? "auto" : 0,
                                        opacity: openIndex === index ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed font-light">
                                        {faq.answer}
                                    </p>
                                </motion.div>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Contact Section */}
                <ScrollReveal variant="slideUp" delay={0.15}>
                    <div className="mt-16 rounded-3xl mesh-bg grain-overlay p-8 sm:p-10 lg:p-12 relative overflow-hidden">
                        <div className="relative z-raised">
                            <h2 className="font-display text-2xl sm:text-3xl text-[#fbf8f2] mb-2">
                                Still need help?
                            </h2>
                            <p className="text-[#e6dcc9] font-light mb-8">
                                Our support team is here for you 24/7.
                            </p>

                            <div className="grid sm:grid-cols-3 gap-4">
                                <a
                                    href="mailto:support@propdirect.in"
                                    className="flex items-center gap-3 p-5 bg-white/[0.07] backdrop-blur-xl border border-white/10 hover:bg-white/[0.12] rounded-2xl transition-all text-[#fbf8f2]"
                                >
                                    <Mail className="w-6 h-6 text-accent-300" />
                                    <div>
                                        <p className="text-xs font-semibold text-[#e6dcc9]">Email</p>
                                        <p className="text-sm font-semibold">support@propdirect.in</p>
                                    </div>
                                </a>
                                <a
                                    href="tel:+918001234567"
                                    className="flex items-center gap-3 p-5 bg-white/[0.07] backdrop-blur-xl border border-white/10 hover:bg-white/[0.12] rounded-2xl transition-all text-[#fbf8f2]"
                                >
                                    <Phone className="w-6 h-6 text-accent-300" />
                                    <div>
                                        <p className="text-xs font-semibold text-[#e6dcc9]">Phone</p>
                                        <p className="text-sm font-semibold">+91 800-123-4567</p>
                                    </div>
                                </a>
                                <button className="flex items-center gap-3 p-5 bg-white/[0.07] backdrop-blur-xl border border-white/10 hover:bg-white/[0.12] rounded-2xl transition-all text-[#fbf8f2]">
                                    <MessageCircle className="w-6 h-6 text-accent-300" />
                                    <div className="text-left">
                                        <p className="text-xs font-semibold text-[#e6dcc9]">Live Chat</p>
                                        <p className="text-sm font-semibold">Chat with us</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
}
