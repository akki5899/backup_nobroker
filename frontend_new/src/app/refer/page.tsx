"use client";

import { motion } from "framer-motion";
import { Gift, Share2, Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  { icon: Share2, title: "Share your code", desc: "Send your unique code to friends." },
  { icon: Users, title: "Friend joins", desc: "They sign up using your code." },
  { icon: Gift, title: "Earn rewards", desc: "You both get ₹500 in credits." },
];

export default function ReferPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "PROP2024";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg grain-overlay absolute inset-0" />
        <div className="relative z-raised max-w-3xl mx-auto px-4 lg:px-8 py-16 sm:py-20 text-center">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="eyebrow text-accent-300 mb-4"
          >
            Refer &amp; Earn
          </motion.p>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-display text-[#fbf8f2] leading-[1.05] mb-3"
          >
            Invite friends,
            <span className="italic text-accent-300"> earn together.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-[#e6dcc9] font-light"
          >
            Earn rewards every time someone you invite joins and gets started.
          </motion.p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
        {/* ── Referral card ──────────────────────────────── */}
        <ScrollReveal variant="slideUp">
          <div className="bg-card rounded-3xl p-8 sm:p-10 border border-border mb-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center text-accent-600 mb-6">
                <Gift className="w-10 h-10" />
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
                Earn ₹500 for every referral
              </h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-8 max-w-md">
                Share your unique code with friends. When they sign up and post a
                property or buy a plan, you both get ₹500.
              </p>

              <div className="w-full max-w-sm bg-muted/60 border border-border rounded-2xl p-2 flex items-center justify-between pl-6 mb-8">
                <span className="font-display text-lg tracking-[0.2em] text-foreground">
                  {referralCode}
                </span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={copyToClipboard}
                  className="bg-card p-3 rounded-xl border border-border hover:border-accent-400/60 transition-colors"
                  aria-label="Copy referral code"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-sage-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button className="bg-[#25D366] text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <Share2 className="w-5 h-5" />
                  WhatsApp
                </button>
                <button className="bg-[#1DA1F2] text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <Share2 className="w-5 h-5" />
                  Twitter
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── How it works ───────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} variant="scale" delay={index * 0.1}>
              <div className="relative h-full bg-card p-6 rounded-2xl border border-border text-center hover:border-accent-400/50 hover:-translate-y-1 transition-all duration-500 group">
                <span className="absolute top-4 right-5 font-display text-4xl text-accent-500/15">
                  {index + 1}
                </span>
                <div className="w-12 h-12 bg-accent-500/10 rounded-full flex items-center justify-center text-accent-600 mx-auto mb-4 group-hover:bg-accent-500 group-hover:text-white transition-colors duration-500">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground font-light">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
