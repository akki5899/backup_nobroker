"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight } from "lucide-react";
import { authAPI } from "@/utils/api_client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import OTPStep from "@/components/OTPStep";

export default function MobileLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [devOtp, setDevOtp] = useState("");

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await authAPI.sendOTP({ phone });
            // Dev mode: backend returns the OTP directly when no SMS gateway is set.
            setDevOtp(res.data?.dev_otp || "");
            setStep("otp");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAutofill = (code: string) => {
        setOtp(code.split("").slice(0, 6));
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const otpValue = otp.join("");
            const res = await authAPI.verifyOTP({ phone, otp: otpValue });
            // Store Auth data context setup
            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            window.dispatchEvent(new Event("storage")); // Trigger App hydration sync

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP entered.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    return (
        <main className="min-h-screen flex bg-background">
            {/* Left Column (Image) */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-950 items-end p-14 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80"
                        alt="Luxury Real Estate"
                        className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>

                <div className="relative z-raised max-w-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <span className="font-display italic text-white text-xl font-bold">R</span>
                        </div>
                        <span className="font-display text-2xl text-white whitespace-nowrap">
                            Right<span className="italic text-emerald-400">Villa</span>Nest
                        </span>
                    </div>
                    <h1 className="text-5xl font-display text-white mb-5 leading-[1.05]">
                        Welcome <span className="italic text-emerald-400">home.</span>
                    </h1>
                    <p className="text-slate-300 text-lg font-light leading-relaxed">
                        Sign in to pick up where you left off — your saved homes,
                        enquiries, and visits, all in one place.
                    </p>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-12 relative">
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
                        <div className="w-11 h-11 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="font-display italic text-white dark:text-slate-950 text-lg font-bold">R</span>
                        </div>
                        <span className="font-display text-xl text-foreground whitespace-nowrap font-bold">
                            Right<span className="italic text-emerald-600 dark:text-emerald-450">Villa</span>Nest
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === "phone" ? (
                            <motion.div
                                key="phone"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800"
                            >
                                <p className="eyebrow text-emerald-600 mb-3 font-semibold">Sign In</p>
                                <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-2 text-slate-800 dark:text-white">Welcome back</h2>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mb-7 font-light">Enter your mobile number to sign in securely.</p>

                                {/* Reserved space for error — prevents layout shift */}
                                <div className="min-h-[44px] mb-2">
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-905/10 border border-red-100 dark:border-red-900/50 text-red-650 text-red-500 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                            {error}
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div>
                                        <label className="block eyebrow text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 font-semibold">Mobile Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <Phone className="w-5 h-5 text-slate-400" />
                                                <span className="ml-2 pr-3 text-slate-500 font-medium border-r border-slate-200 dark:border-slate-800">
                                                    +91
                                                </span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Enter 10 digit number"
                                                className="w-full pl-20 pr-4 py-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all text-sm"
                                                required
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || phone.length < 10}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-md"
                                    >
                                        {loading ? "Sending OTP…" : "Continue"}
                                        {!loading && <ArrowRight className="w-5 h-5" />}
                                    </button>
                                </form>

                                <div className="text-center mt-6">
                                    <Link href="/forgot-password" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors link-underline">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <p className="text-center text-sm font-light text-slate-500 mt-4">
                                    Don&rsquo;t have an account?{" "}
                                    <Link href="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
                                        Create one
                                    </Link>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800"
                            >
                                <OTPStep
                                    phone={phone}
                                    otp={otp}
                                    onChange={handleOtpChange}
                                    onVerify={handleVerifyOTP}
                                    onBack={() => setStep("phone")}
                                    onResend={handleSendOTP}
                                    loading={loading}
                                    error={error}
                                    title="Verify Number"
                                    buttonLabel="Verify & Sign In"
                                    loadingLabel="Verifying..."
                                    devOtp={devOtp}
                                    onAutofill={handleAutofill}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
