"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Home, LayoutList, Copy } from "lucide-react";
import { useToast } from "@/components/Toast";

function SuccessContent() {
    const params = useSearchParams();
    const { showToast } = useToast();
    const referenceId = params.get("ref") || "RVN-PENDING";
    const propertyId = params.get("id");

    const copyRef = async () => {
        try {
            await navigator.clipboard.writeText(referenceId);
            showToast("Reference ID copied", "success");
        } catch {
            showToast("Could not copy reference ID", "error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg bg-card rounded-2xl shadow-sm border border-border p-8 sm:p-12 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                >
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </motion.div>

                <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
                    Property Submitted Successfully
                </h1>
                <p className="text-muted-foreground font-light mb-8">
                    Your listing has been received and is now pending review by our team.
                    It will appear in search once approved — we&apos;ll email you the moment
                    it goes live. Keep the reference ID below for tracking.
                </p>

                <div className="bg-muted/50 border border-border rounded-2xl px-5 py-4 mb-8 flex items-center justify-between gap-4">
                    <div className="text-left">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            Reference ID
                        </p>
                        <p className="text-xl font-display text-foreground dark:text-accent-400 tracking-wide">
                            {referenceId}
                        </p>
                    </div>
                    <button
                        onClick={copyRef}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-accent-600 hover:bg-muted transition-all"
                        aria-label="Copy reference ID"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/my-listings"
                        className="flex-1 bg-accent-500 hover:bg-accent-400 text-primary-950 py-3.5 rounded-full font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <LayoutList className="w-5 h-5" /> My Listings
                    </Link>
                    {propertyId && (
                        <Link
                            href={`/properties/${propertyId}`}
                            className="flex-1 border border-border text-foreground/80 py-3.5 rounded-full font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:border-accent-400/60 hover:text-accent-600 transition-all"
                        >
                            View Listing
                        </Link>
                    )}
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 mt-6 text-sm font-semibold text-muted-foreground hover:text-accent-600 transition-colors"
                >
                    <Home className="w-4 h-4" /> Back to Home
                </Link>
            </motion.div>
        </div>
    );
}

export default function PostPropertySuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <SuccessContent />
        </Suspense>
    );
}
