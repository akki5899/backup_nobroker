"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, KeyRound } from "lucide-react";
import { authAPI } from "@/utils/api_client";
import { useToast } from "@/components/Toast";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState<"request" | "reset">("request");
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await authAPI.forgotPassword(identifier.trim());
            showToast("Reset code sent to your registered email/phone", "success");
            setStep("reset");
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Could not send reset code. Please try again.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await authAPI.resetPassword({
                identifier: identifier.trim(),
                otp: otp.trim(),
                new_password: newPassword,
            });
            showToast("Password reset successful. Please sign in.", "success");
            router.push("/login");
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Could not reset password. Please try again.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-muted/50 p-4 sm:p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div className="w-12 h-12 bg-primary-900 dark:bg-accent-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="font-display italic text-accent-400 dark:text-primary-950 text-xl">R</span>
                    </div>
                    <span className="font-display text-xl text-foreground whitespace-nowrap">
                        Right<span className="italic text-accent-600 dark:text-accent-400">Villa</span>Nest
                    </span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-card p-6 sm:p-10 rounded-2xl shadow-2xl border border-border"
                    >
                        <div className="w-12 h-12 rounded-full bg-accent-500/10 flex items-center justify-center mb-6 text-accent-600">
                            <KeyRound className="w-6 h-6" />
                        </div>

                        <p className="eyebrow text-accent-600 mb-3">
                            {step === "request" ? "Account Recovery" : "Almost there"}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-display mb-2 text-foreground">
                            {step === "request" ? (
                                <>Forgot <span className="italic text-accent-600">password?</span></>
                            ) : (
                                <>Reset <span className="italic text-accent-600">password.</span></>
                            )}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-8 font-light leading-relaxed">
                            {step === "request"
                                ? "Enter your registered email or mobile number. We'll send you a verification code."
                                : "Enter the code we sent and choose a new password."}
                        </p>

                        {error && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        {step === "request" ? (
                            <form onSubmit={handleRequest} className="space-y-6">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-600" />
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Email or Mobile Number"
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !identifier.trim()}
                                    className="w-full bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-primary-800 dark:hover:bg-accent-400 transition-all"
                                >
                                    {loading ? "Sending…" : "Send Reset Code"}
                                    {!loading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-5">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    className="w-full text-center tracking-[0.5em] bg-muted/50 border border-border rounded-xl px-4 py-4 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-display text-xl text-foreground placeholder:tracking-normal placeholder:font-light placeholder:text-muted-foreground"
                                    required
                                />
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-600" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-600" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-primary-800 dark:hover:bg-accent-400 transition-all"
                                >
                                    {loading ? "Resetting…" : "Reset Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep("request")}
                                    className="w-full eyebrow text-[9px] text-muted-foreground hover:text-accent-600 transition-colors"
                                >
                                    ← Use a different account
                                </button>
                            </form>
                        )}

                        <p className="text-center text-sm font-light text-muted-foreground mt-8">
                            Remembered it?{" "}
                            <Link href="/login" className="font-semibold text-accent-700 dark:text-accent-400 hover:text-accent-600 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
