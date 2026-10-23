"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/utils/api_client";
import { useToast } from "@/components/Toast";

export default function AdminLoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/auth/admin-login", formData);
            if (response.data.success) {
                // Save admin token
                localStorage.setItem("admin_token", response.data.access_token);
                // Also overwrite main token for requests naturally hitting api interceptors
                localStorage.setItem("token", response.data.access_token);
                localStorage.setItem("user", JSON.stringify(response.data.user));

                showToast("Admin login successful!", "success");
                router.push("/admin/dashboard");
            }
        } catch (error: any) {
            showToast(error.response?.data?.detail || "Invalid admin credentials", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <p className="eyebrow text-accent-600 mb-3">Admin Access</p>
                    <h1 className="font-display text-3xl text-foreground">Admin Portal</h1>
                    <p className="text-sm text-muted-foreground mt-2">Sign in to manage RightVillaNest</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-medium text-foreground transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-medium text-foreground transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold tracking-wide text-sm py-4 rounded-full shadow-lg shadow-red-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Authenticating..." : "Access Dashboard"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
