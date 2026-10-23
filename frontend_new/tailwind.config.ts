import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // shadcn/ui semantic tokens (consumed by ui/* components like the
                // mapcn map). Values come from CSS vars in globals.css (:root/.dark).
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                // shadcn `secondary`/`destructive` tokens (used by ui/button variants).
                secondary: {
                    DEFAULT: "hsl(var(--secondary-token))",
                    foreground: "hsl(var(--secondary-token-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                // Warmer, more distinctive bronze palette.
                // DEFAULT/foreground added so shadcn `bg-primary`/`text-primary-foreground`
                // resolve to brand bronze; numbered shades (primary-900, etc.) unchanged.
                primary: {
                    DEFAULT: 'hsl(var(--primary-token))',
                    foreground: 'hsl(var(--primary-token-foreground))',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020817',
                },
                // Emerald accent scale for modern real estate feel
                accent: {
                    DEFAULT: 'hsl(var(--accent-token))',
                    foreground: 'hsl(var(--accent-token-foreground))',
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
                // Sage — calm botanical contrast
                sage: {
                    50: '#f5f7f2',
                    100: '#e7ede0',
                    200: '#d0dcc2',
                    300: '#aec199',
                    400: '#8aa471',
                    500: '#6c8753',
                    600: '#546b40',
                    700: '#425435',
                    800: '#37442d',
                    900: '#2f3a28',
                    955: '#171e12',
                },
            },
            fontFamily: {
                sans: ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
                display: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
                body: ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
                serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
            },
            animation: {
                "slide-in": "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                "fade-in": "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "scale-in": "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "bounce-soft": "bounceSoft 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                "wiggle": "wiggle 0.3s ease-in-out",
            },
            keyframes: {
                slideIn: {
                    from: { transform: "translateX(100%)", opacity: "0" },
                    to: { transform: "translateX(0)", opacity: "1" },
                },
                slideUp: {
                    from: { transform: "translateY(20px)", opacity: "0" },
                    to: { transform: "translateY(0)", opacity: "1" },
                },
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                fadeInUp: {
                    from: { opacity: "0", transform: "translateY(30px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                scaleIn: {
                    from: { transform: "scale(0.95)", opacity: "0" },
                    to: { transform: "scale(1)", opacity: "1" },
                },
                bounceSoft: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-5px)" },
                },
                wiggle: {
                    "0%, 100%": { transform: "rotate(0deg)" },
                    "25%": { transform: "rotate(-3deg)" },
                    "75%": { transform: "rotate(3deg)" },
                },
            },
            borderRadius: {
                "4xl": "2rem",
                "5xl": "2.5rem",
                // Tremor tokens — used by ui/filter-badge.
                "tremor-small": "0.375rem",
                "tremor-full": "9999px",
            },
            // Tremor label scale — used by ui/filter-badge.
            fontSize: {
                "tremor-label": "0.75rem",
            },
            // Extra spacing/width used by ui/mapcn-marker-popup (w-62 / max-w-62 = 15.5rem).
            spacing: {
                "62": "15.5rem",
            },
            maxWidth: {
                "62": "15.5rem",
            },
            // `backdrop-blur-xs` used by the map loader (Tailwind v3 ships `sm` as the
            // smallest blur; add an extra-small step).
            backdropBlur: {
                xs: "2px",
            },
            // Documented z-index scale — use these tokens instead of arbitrary values.
            // base(0) → raised → dropdown → sticky header → overlay/backdrop → modal → toast → maximum
            zIndex: {
                base: "0",
                raised: "10",
                dropdown: "1000",
                sticky: "1100",
                overlay: "1200",
                modal: "1300",
                toast: "1400",
                max: "1500",
            },
            transitionTimingFunction: {
                "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
                "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            },
            transitionDuration: {
                "250": "250ms",
                "350": "350ms",
            },
        },
    },
    // tailwindcss-animate powers the `animate-in fade-in-0 zoom-in-95` utilities
    // used by the mapcn popups/tooltips.
    plugins: [require("tailwindcss-animate")],
};

export default config;

