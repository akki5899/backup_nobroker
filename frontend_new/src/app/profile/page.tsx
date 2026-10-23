"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Bell, Moon, LogOut, Home } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { userAPI, authAPI } from "@/utils/api_client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
        phone: "",
        user_type: "buyer",
    });

    const [notifications, setNotifications] = useState({
        priceDrops: true,
        newListings: true,
        messages: true,
        promotions: false,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            setProfile({
                full_name: response.data.full_name || "",
                email: response.data.email || "",
                phone: response.data.phone || "",
                user_type: response.data.user_type || "buyer",
            });
        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await userAPI.updateProfile({
                full_name: profile.full_name,
                phone: profile.phone,
            });
            showToast("Profile saved successfully!", "success");
        } catch (error) {
            console.error("Failed to save profile:", error);
            showToast("Failed to save profile. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login");
        }
    };

    if (isLoading) {
        return (
            <div className="py-10 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-10 min-h-screen">
            <div className="max-w-3xl mx-auto px-4">
                <AnimatedSection>
                    <p className="eyebrow text-accent-600 mb-2">Account</p>
                    <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-10">
                        My Profile
                    </h1>
                </AnimatedSection>

                {/* Profile Card */}
                <AnimatedSection delay={0.1}>
                    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm mb-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                            <div className="relative">
                                <div className="w-28 h-28 bg-accent-500/15 rounded-full flex items-center justify-center font-display text-4xl text-accent-600">
                                    {profile.full_name.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute bottom-0 right-0 w-10 h-10 bg-accent-500 hover:bg-accent-400 text-primary-950 rounded-full flex items-center justify-center shadow-lg transition-colors">
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="font-display text-2xl text-foreground">
                                    {profile.full_name}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-sage-500/15 text-sage-700 dark:text-sage-300 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Verified
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none text-sm font-medium text-foreground opacity-60"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2">
                                    Phone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2">
                                    User Type
                                </label>
                                <div className="relative">
                                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-raised" />
                                    <Select value={profile.user_type} disabled>
                                        <SelectTrigger className="w-full h-12 sm:h-14 pl-12 rounded-xl bg-muted/50 border-border text-sm font-medium opacity-60">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="buyer" className="font-semibold">Buyer</SelectItem>
                                            <SelectItem value="owner" className="font-semibold">Owner</SelectItem>
                                            <SelectItem value="agent" className="font-semibold">Agent</SelectItem>
                                            <SelectItem value="builder" className="font-semibold">Builder</SelectItem>
                                            <SelectItem value="tenant" className="font-semibold">Tenant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="mt-6 w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-primary-950 font-semibold tracking-wide text-sm py-3.5 rounded-full transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </AnimatedSection>

                {/* Settings */}
                <AnimatedSection delay={0.2}>
                    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm mb-6">
                        <h3 className="font-display text-xl text-foreground mb-6">Preferences</h3>

                        <div className="space-y-4">
                            {Object.entries(notifications).map(([key, value]) => (
                                <label key={key} className="flex items-center p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                                        className="w-5 h-5 accent-accent-500 cursor-pointer"
                                    />
                                    <span className="ml-3 font-semibold text-foreground capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>

                {/* Logout */}
                <AnimatedSection delay={0.3}>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold tracking-wide text-sm py-3.5 rounded-full transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </AnimatedSection>
            </div>
        </div>
    );
}
