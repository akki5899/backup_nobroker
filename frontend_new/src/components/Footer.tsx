import Link from "next/link";
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    Mail,
    Phone,
    MapPin,
    Apple,
    Smartphone,
} from "lucide-react";

const footerLinks = {
    company: [
        { label: "About Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "Careers", href: "/careers" },
        { label: "Help Centre", href: "/help" },
        { label: "Ask a Question", href: "/ask" },
    ],
    locations: [
        { label: "Hyderabad", href: "/properties?city=Hyderabad" },
        { label: "Bangalore", href: "/properties?city=Bangalore" },
        { label: "Mumbai", href: "/properties?city=Mumbai" },
        { label: "Chennai", href: "/properties?city=Chennai" },
        { label: "Delhi", href: "/properties?city=Delhi" },
        { label: "Kolkata", href: "/properties?city=Kolkata" },
    ],
    searchProperty: [
        { label: "Search Home for Sale", href: "/buy" },
        { label: "Search Home for Rent", href: "/rent" },
        { label: "Search Villas", href: "/properties?property_type=villa" },
        { label: "Find Property on Map", href: "/map-view" },
    ],
    services: [
        { label: "Professional Property Sale Advice", href: "/services/sale-advice" },
        { label: "Professional Property Rent Advice", href: "/services/rent-advice" },
        { label: "Assistance in Finding Right Property", href: "/services/property-search" },
    ],
};

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-100 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 sm:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
                    {/* Brand Section */}
                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                <span className="font-display italic text-white text-xl font-bold leading-none">R</span>
                            </div>
                            <div className="whitespace-nowrap">
                                <h2 className="font-display text-2xl leading-none text-white">
                                    Right<span className="italic text-emerald-400">Villa</span>Nest
                                </h2>
                            </div>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm font-light">
                            A considered way to find a home — verified listings, no brokerage,
                            and a team that handles the details so you can focus on the place itself.
                        </p>

                        {/* App Download */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 ring-1 ring-slate-800 px-4 py-2.5 rounded-full transition-colors shrink-0">
                                <Apple className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div className="text-left">
                                    <p className="text-[8px] text-slate-400 uppercase tracking-wide leading-tight">Download on</p>
                                    <p className="text-xs font-semibold">App Store</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 ring-1 ring-slate-800 px-4 py-2.5 rounded-full transition-colors shrink-0">
                                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div className="text-left">
                                    <p className="text-[8px] text-slate-400 uppercase tracking-wide leading-tight">Get it on</p>
                                    <p className="text-xs font-semibold">Play Store</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="eyebrow text-[10px] text-emerald-400 mb-6">
                            Company
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-350 hover:text-emerald-400 text-sm font-light transition-colors link-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Locations */}
                    <div>
                        <h3 className="eyebrow text-[10px] text-emerald-400 mb-6">
                            Locations
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.locations.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-350 hover:text-emerald-400 text-sm font-light transition-colors link-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Search Property */}
                    <div>
                        <h3 className="eyebrow text-[10px] text-emerald-400 mb-6">
                            Search Property
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.searchProperty.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-350 hover:text-emerald-400 text-sm font-light transition-colors link-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="eyebrow text-[10px] text-emerald-400 mb-6">
                            Services
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.services.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-350 hover:text-emerald-400 text-sm font-light transition-colors link-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact & Social */}
                <div className="mt-14 sm:mt-16 pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300">
                        <a
                            href="mailto:support@rightvillanest.in"
                            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                        >
                            <Mail className="w-4 h-4 text-emerald-500" /> support@rightvillanest.in
                        </a>
                        <a
                            href="tel:+918001234567"
                            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                        >
                            <Phone className="w-4 h-4 text-emerald-500" /> +91 800-123-4567
                        </a>
                        <span className="flex items-center gap-2 text-slate-350">
                            <MapPin className="w-4 h-4 text-emerald-500" /> Bangalore, India
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                aria-label={social.label}
                                className="w-10 h-10 bg-slate-900 hover:bg-emerald-600 text-slate-350 hover:text-white rounded-full flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0"
                            >
                                <social.icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-10 text-center text-xs text-slate-500 font-light">
                    © {new Date().getFullYear()} RightVillaNest Technologies Pvt Ltd. All
                    rights reserved.
                </div>
            </div>
        </footer>
    );
}
