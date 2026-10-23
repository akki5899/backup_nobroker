"use client";

import { motion } from "framer-motion";
import { Star, Clock, CheckCircle, Lock } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const rewards = [
  {
    id: 1,
    title: "Welcome Bonus",
    points: 500,
    description: "Earned for joining RightVillaNest",
    date: "2024-01-15",
    status: "claimed",
  },
  {
    id: 2,
    title: "Profile Completion",
    points: 200,
    description: "Complete your profile details",
    date: "2024-01-16",
    status: "pending",
  },
  {
    id: 3,
    title: "First Property Listing",
    points: 1000,
    description: "List your first property for rent/sale",
    date: "-",
    status: "locked",
  },
];

const statusStyles: Record<string, { icon: typeof Star; chip: string; ring: string }> = {
  claimed: {
    icon: CheckCircle,
    chip: "bg-sage-500/15 text-sage-700 dark:text-sage-300",
    ring: "bg-sage-500/15 text-sage-600 dark:text-sage-300",
  },
  pending: {
    icon: Clock,
    chip: "bg-accent-500/15 text-accent-700 dark:text-accent-300",
    ring: "bg-accent-500/15 text-accent-600 dark:text-accent-300",
  },
  locked: {
    icon: Lock,
    chip: "bg-muted text-muted-foreground",
    ring: "bg-muted text-muted-foreground",
  },
};

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg grain-overlay absolute inset-0" />
        <div className="relative z-raised max-w-4xl mx-auto px-4 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="eyebrow text-accent-300 mb-4"
              >
                Loyalty
              </motion.p>
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl sm:text-5xl font-display text-[#fbf8f2] leading-[1.05] mb-3"
              >
                My Rewards
              </motion.h1>
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="text-[#e6dcc9] font-light"
              >
                Track your points and redeem exciting offers.
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="bg-white/[0.07] backdrop-blur-xl border border-white/10 text-[#fbf8f2] px-6 py-4 rounded-2xl flex items-center gap-3 shrink-0"
            >
              <Star className="w-7 h-7 fill-accent-300 text-accent-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#e6dcc9]">
                  Total Points
                </p>
                <p className="font-display text-3xl">500</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Rewards list ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
        <div className="grid gap-4 sm:gap-5">
          {rewards.map((reward, index) => {
            const s = statusStyles[reward.status];
            const Icon = s.icon;
            return (
              <ScrollReveal key={reward.id} variant="slideUp" delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-accent-400/50 flex items-center justify-between gap-4 transition-colors duration-500"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.ring}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-foreground">
                        {reward.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-light">
                        {reward.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-xl text-accent-600">+{reward.points}</p>
                    <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${s.chip}`}>
                      {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                    </span>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
