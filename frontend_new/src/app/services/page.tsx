"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Truck,
  PaintBucket,
  Wrench,
  ShieldCheck,
  FileText,
  ArrowRight,
  Search,
  CalendarCheck,
  Sparkles,
  BadgeCheck,
  IndianRupee,
  Clock,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
  {
    id: "packers",
    title: "Packers & Movers",
    icon: Truck,
    desc: "Safe, insured relocation with trained crews and real-time tracking.",
    price: "from ₹3,999",
  },
  {
    id: "painting",
    title: "Home Painting",
    icon: PaintBucket,
    desc: "Premium finishes, low-VOC paints and a spotless handover.",
    price: "from ₹12/sq.ft",
  },
  {
    id: "cleaning",
    title: "Deep Cleaning",
    icon: Home,
    desc: "Sanitised, move-in-ready homes — kitchens, baths and beyond.",
    price: "from ₹2,499",
  },
  {
    id: "repairs",
    title: "Repairs & Maintenance",
    icon: Wrench,
    desc: "Plumbing, electrical and carpentry by background-checked pros.",
    price: "from ₹299",
  },
  {
    id: "legal",
    title: "Legal & Documentation",
    icon: FileText,
    desc: "Agreement drafting, verification and registration assistance.",
    price: "from ₹1,499",
  },
  {
    id: "insurance",
    title: "Home Insurance",
    icon: ShieldCheck,
    desc: "Protect your home and belongings with tailored cover.",
    price: "from ₹999/yr",
  },
];

const steps = [
  {
    icon: Search,
    title: "Choose a service",
    desc: "Browse vetted offerings and pick what your home needs.",
  },
  {
    icon: CalendarCheck,
    title: "Book a slot",
    desc: "Select a date and time that works — no back-and-forth.",
  },
  {
    icon: Sparkles,
    title: "Sit back & relax",
    desc: "A verified professional arrives and gets the job done right.",
  },
];

const advantages = [
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    desc: "Every partner is background-checked and rated by real customers.",
  },
  {
    icon: IndianRupee,
    title: "Transparent pricing",
    desc: "Upfront quotes with no hidden charges, ever.",
  },
  {
    icon: Clock,
    title: "On-time, every time",
    desc: "Punctual service windows with live status updates.",
  },
  {
    icon: ShieldCheck,
    title: "Service guarantee",
    desc: "Not happy? We make it right — that's our promise.",
  },
];

// Stagger container for the service grid.
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const gridItem = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg grain-overlay absolute inset-0" />
        <div className="relative z-raised max-w-7xl mx-auto px-4 lg:px-8 py-24 sm:py-32 text-center">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="eyebrow text-accent-300 mb-5"
          >
            Home Services
          </motion.p>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-display text-[#fbf8f2] leading-[1.05] mb-6"
          >
            Everything your home needs,
            <br />
            <span className="italic text-accent-300">handled by experts.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-lg text-[#e6dcc9] max-w-2xl mx-auto font-light leading-relaxed mb-10"
          >
            From moving in to maintaining it for years — book verified
            professionals with transparent pricing and a service you can trust.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18 }}
          >
            <a
              href="#services"
              className="inline-flex items-center gap-3 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-primary-950 font-semibold tracking-wide text-sm rounded-full transition-all"
            >
              Explore services
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Services grid ────────────────────────────────── */}
      <section id="services" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <ScrollReveal variant="slideUp">
          <p className="eyebrow text-center text-accent-600 mb-4">What we offer</p>
          <h2 className="text-3xl sm:text-5xl font-display mb-5 text-center text-foreground">
            Pick a service, we&rsquo;ll do the rest
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto font-light leading-relaxed">
            A curated marketplace of trusted home professionals, all in one place.
          </p>
        </ScrollReveal>

        <motion.div
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={gridItem}
              whileHover={{ y: -6 }}
              className="group h-full p-7 rounded-2xl bg-card border border-border hover:border-accent-400/50 transition-colors duration-500 flex flex-col"
            >
              <div className="w-[52px] h-[52px] bg-accent-500/10 rounded-full flex items-center justify-center mb-6 text-accent-600 group-hover:bg-accent-500 group-hover:text-white transition-colors duration-500">
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl mb-2 text-foreground">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-6 flex-1">
                {service.desc}
              </p>
              <div className="flex items-center justify-between pt-5 engrave-top">
                <span className="text-sm font-semibold text-foreground">
                  {service.price}
                </span>
                <Link
                  href={`/help?service=${service.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-600 group-hover:gap-2.5 transition-all"
                >
                  Book now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="bg-muted/50 engrave-top border-b border-border py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <ScrollReveal variant="slideUp">
            <p className="eyebrow text-center text-accent-600 mb-4">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-display mb-14 text-center text-foreground">
              Three steps to done
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {steps.map((step, index) => (
              <ScrollReveal key={step.title} variant="scale" delay={index * 0.1}>
                <div className="relative h-full p-8 rounded-2xl bg-card border border-border">
                  <span className="absolute top-6 right-7 font-display text-5xl text-accent-500/15">
                    {index + 1}
                  </span>
                  <div className="w-14 h-14 bg-primary-900/5 dark:bg-accent-500/10 rounded-full flex items-center justify-center mb-6 text-primary-800 dark:text-accent-400">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <h4 className="font-display text-xl mb-2 text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <ScrollReveal variant="slideUp">
          <p className="eyebrow text-center text-accent-600 mb-4">The advantages</p>
          <h2 className="text-3xl sm:text-5xl font-display mb-14 text-center text-foreground">
            Why people book with us
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {advantages.map((item, index) => (
            <ScrollReveal key={item.title} variant="scale" delay={index * 0.1}>
              <div className="h-full p-7 rounded-2xl bg-card border border-border hover:border-accent-400/50 hover:-translate-y-1 transition-all duration-500 group">
                <div className="w-[52px] h-[52px] bg-accent-500/10 rounded-full flex items-center justify-center mb-6 text-accent-600 group-hover:bg-accent-500 group-hover:text-white transition-colors duration-500">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="font-display text-xl mb-2 text-foreground">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="pb-20 sm:pb-28 max-w-7xl mx-auto px-4 lg:px-8">
        <ScrollReveal variant="slideUp">
          <div className="rounded-3xl mesh-bg grain-overlay p-8 sm:p-12 lg:p-16 relative overflow-hidden text-center">
            <div className="relative z-raised max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-display text-[#fbf8f2] mb-5 leading-[1.05]">
                Ready to get started?
              </h2>
              <p className="text-[#e6dcc9] mb-9 font-light leading-relaxed">
                Tell us what your home needs and we&rsquo;ll match you with the
                right professional — usually within minutes.
              </p>
              <Link
                href="/help"
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-primary-950 font-semibold tracking-wide text-sm rounded-full transition-all"
              >
                Talk to us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
