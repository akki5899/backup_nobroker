"use client";

import { useRef, useEffect, ReactNode } from "react";
import { motion, useInView, useAnimation, Variants } from "framer-motion";

interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

const variants: Record<string, Variants> = {
    up: {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
    },
    down: {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0 },
    },
    left: {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
    },
    right: {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 },
    },
    none: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
};

export default function AnimatedSection({
    children,
    className = "",
    delay = 0,
    direction = "up",
}: AnimatedSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={variants[direction]}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
