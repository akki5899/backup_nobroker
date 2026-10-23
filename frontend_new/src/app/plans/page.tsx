"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import { useToast } from "@/components/Toast";
import ScrollReveal from "@/components/ScrollReveal";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    features: [
      "List 1 Property",
      "Basic Visibility",
      "Email Support",
      "Standard Listing Duration"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹999/mo",
    features: [
      "List 5 Properties",
      "Priority Visibility",
      "Phone & Email Support",
      "Extended Listing Duration",
      "Verified Badge"
    ],
    cta: "Upgrade to Pro",
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited Listings",
      "Top Visibility",
      "Dedicated Account Manager",
      "API Access",
      "Custom Branding"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PlansPage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("basic");
  const { showToast } = useToast();

  useEffect(() => {
    // Read the current plan from local user data
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.subscription_plan) {
          setCurrentPlan(parsed.subscription_plan);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handlePlanClick = (plan: any) => {
    if (plan.id === currentPlan) {
      return; // Already active
    }

    if (plan.price.includes("₹")) {
      setSelectedPlan(plan);
      setIsPaymentOpen(true);
    } else {
      showToast(plan.id === "basic" ? "Basic Plan Activated!" : "Redirecting to Sales Contact...", "info");
    }
  };

  const getPlanAmount = (priceString: string) => {
    return parseInt(priceString.replace(/\D/g, ""), 10) || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg grain-overlay absolute inset-0" />
        <div className="relative z-raised max-w-7xl mx-auto px-4 lg:px-8 py-20 sm:py-28 text-center">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="eyebrow text-accent-300 mb-5"
          >
            Pricing
          </motion.p>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-display text-[#fbf8f2] leading-[1.05] mb-6"
          >
            Plans that grow
            <br />
            <span className="italic text-accent-300">with your listings.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-lg text-[#e6dcc9] max-w-2xl mx-auto font-light leading-relaxed"
          >
            Simple, transparent pricing. Upgrade, downgrade or cancel anytime —
            no contracts, no surprises.
          </motion.p>
        </div>
      </section>

      {/* ── Plans grid ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-20 sm:py-24">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => {
            const isActive = plan.id === currentPlan;
            return (
              <ScrollReveal key={plan.id} variant="slideUp" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className={`relative h-full rounded-3xl p-8 flex flex-col transition-colors duration-500 ${plan.popular
                    ? "bg-card border-2 border-accent-500/60 shadow-xl md:scale-[1.03]"
                    : "bg-card border border-border hover:border-accent-400/50"
                    }`}
                >
                  {plan.popular && !isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-500 text-primary-950 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sage-600 text-white px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> Active Plan
                    </div>
                  )}

                  <h3 className="font-display text-2xl text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-8 mt-3">
                    <span className="font-display text-4xl text-foreground">
                      {plan.price}
                    </span>
                  </div>

                  <ul className="space-y-3.5 mb-8 flex-1 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-foreground/80 font-light">
                        <div className="w-5 h-5 rounded-full bg-accent-500/15 flex items-center justify-center text-accent-600 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={isActive}
                    className={`w-full py-3.5 rounded-full font-semibold tracking-wide text-sm transition-all ${isActive
                      ? "bg-sage-600 text-white cursor-not-allowed"
                      : plan.popular
                        ? "bg-accent-500 hover:bg-accent-400 text-primary-950"
                        : "bg-muted text-foreground hover:bg-muted/70 border border-border"
                      }`}
                  >
                    {isActive ? "Current Plan" : plan.cta}
                  </button>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground font-light mt-12">
          All plans include secure payments and can be changed at any time.
        </p>
      </section>

      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentOpen}
          amount={getPlanAmount(selectedPlan.price)}
          paymentType="subscription"
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={(txId) => {
            // Simulate updating the user's plan in DB on the frontend
            setCurrentPlan(selectedPlan.id);
            const userData = localStorage.getItem("user");
            if (userData) {
              const parsed = JSON.parse(userData);
              parsed.subscription_plan = selectedPlan.id;
              localStorage.setItem("user", JSON.stringify(parsed));
              window.dispatchEvent(new Event("storage")); // alert Header
            }
            showToast(`Payment successful! ${selectedPlan.name} plan activated. Tx: ${txId}`, "success");
          }}
          metadata={{ plan_id: selectedPlan.id }}
        />
      )}
    </div>
  );
}
