"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: "slideUp" | "slideLeft" | "slideRight" | "scale" | "rotate";
  delay?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  variant = "slideUp",
  delay = 0,
  className = ""
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    slideUp: {
      hidden: { y: 75, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    },
    slideLeft: {
      hidden: { x: -75, opacity: 0 },
      visible: { x: 0, opacity: 1 }
    },
    slideRight: {
      hidden: { x: 75, opacity: 0 },
      visible: { x: 0, opacity: 1 }
    },
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1 }
    },
    rotate: {
      hidden: { rotate: -10, opacity: 0 },
      visible: { rotate: 0, opacity: 1 }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[variant]}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
