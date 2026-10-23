"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, User, ArrowRight, House, Building2, HardHat, CheckCircle, Lock } from "lucide-react";
import { authAPI } from "@/utils/api_client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import OTPStep from "@/components/OTPStep";

const userTypes = [
    { id: "tenant", label: "Tenant", icon: User, desc: "Looking to rent or buy" },
    { id: "owner", label: "Owner", icon: House, desc: "List my property" },
    { id: "builder", label: "Builder", icon: HardHat, desc: "Promote projects" },
    { id: "agent", label: "Broker", icon: Building2, desc: "Manage client listings" },
];

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [userType, setUserType] = useState("tenant");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [devOtp, setDevOtp] = useState("");

    const handleAutofill = (code: string) => {
        setOtp(code.split("").slice(0, 6));
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // 1. Register User
            await authAPI.register({
                email: formData.email || undefined,
                phone: formData.phone,
                full_name: formData.name,
                password: formData.password,
                user_type: userType as any
            });

            // 2. Send OTP
            const otpRes = await authAPI.sendOTP({ phone: formData.phone });
            // Dev mode: backend returns the OTP directly when no SMS gateway is set.
            setDevOtp(otpRes.data?.dev_otp || "");

            setStep(3);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Registration failed. Please try again.";
            setError(errorMessage);

            if (errorMessage.includes("already registered")) {
                showToast("Account already exists. Please login.", "info");
            } else {
                showToast(errorMessage, "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        setError("");

        try {
            const otpValue = otp.join("");
            // 3. Verify OTP
            const verifyResponse = await authAPI.verifyOTP({ phone: formData.phone, otp: otpValue });

            // Login is now handled by verifyOTP returning the token
            localStorage.setItem("token", verifyResponse.data.access_token);
            localStorage.setItem("user", JSON.stringify(verifyResponse.data.user));

            window.dispatchEvent(new Event("storage"));
            router.push("/dashboard");
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Invalid OTP. Please try again.";
            setError(errorMessage);
            showToast(errorMessage, "error");
        } finally {
            setIsLoading(false);
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
                        src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80"
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
                        Begin the <span className="italic text-emerald-400">search.</span>
                    </h1>
                    <p className="text-slate-300 text-lg font-light leading-relaxed">
                        Create your account to save homes, schedule visits, and reach
                        owners directly — no brokerage, ever.
                    </p>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center p-6 sm:p-12 relative overflow-y-auto max-h-screen">
                <div className="w-full max-w-lg my-auto py-6 sm:py-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
                        <div className="w-11 h-11 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="font-display italic text-white dark:text-slate-950 text-lg font-bold">R</span>
                        </div>
                        <span className="font-display text-xl text-foreground whitespace-nowrap font-bold">
                            Right<span className="italic text-emerald-600 dark:text-emerald-450">Villa</span>Nest
                        </span>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-3 mb-10">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 rounded-full transition-all duration-500 w-12 ${s <= step ? "bg-emerald-600" : "bg-slate-250 dark:bg-slate-800"
                                    }`}
                            />
                        ))}
                    </div>                    <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800"
                    >
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <p className="eyebrow text-emerald-605 text-emerald-600 mb-3 font-semibold">Step One</p>
                                <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-2 text-slate-800 dark:text-white">
                                    Create your account
                                </h2>
                                <p className="text-slate-400 dark:text-slate-500 font-light mb-8">
                                    Tell us a little about who you are.
                                </p>

                                <form onSubmit={handleStep1Submit} className="space-y-6">
                                    <div>
                                        <p className="eyebrow text-[11px] text-slate-450 dark:text-slate-500 mb-4 font-semibold">
                                            I am signing up as…
                                        </p>
                                        <div className="grid gap-3">
                                            {userTypes.map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setUserType(type.id)}
                                                    className={`flex items-center gap-5 p-4 rounded-2xl border transition-all text-left ${userType === type.id
                                                        ? "border-emerald-500 bg-emerald-500/[0.04]"
                                                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 hover:bg-slate-50/50 dark:hover:bg-slate-850"
                                                        }`}
                                                >
                                                    <div
                                                        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors shrink-0 ${userType === type.id
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                                            }`}
                                                    >
                                                        <type.icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 leading-tight mb-0.5">
                                                            {type.label}
                                                        </p>
                                                        <p className="text-xs font-light text-slate-500 dark:text-slate-400">
                                                            {type.desc}
                                                        </p>
                                                    </div>
                                                    {userType === type.id && (
                                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 transition-all shadow-md"
                                    >
                                        Continue
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <button
                                    onClick={() => setStep(1)}
                                    className="eyebrow text-[11px] text-slate-400 hover:text-emerald-600 mb-5 transition-colors flex items-center gap-1.5"
                                >
                                    ← Back
                                </button>

                                <p className="eyebrow text-emerald-600 mb-3 font-semibold">Step Two</p>
                                <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-2 text-slate-800 dark:text-white">
                                    Your details
                                </h2>
                                <p className="text-slate-400 dark:text-slate-500 font-light mb-8">
                                    Please provide your contact information.
                                </p>

                                {error && (
                                    <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 text-red-650 text-red-500 px-4 py-3 rounded-xl text-sm font-medium flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                            {error}
                                        </div>
                                        {error.includes("already registered") && (
                                            <div className="flex items-center gap-4 mt-1 ml-4">
                                                <Link href="/login" className="text-red-800 dark:text-red-400 font-semibold hover:underline">
                                                    Login
                                                </Link>
                                                <span className="text-red-305 text-red-300">|</span>
                                                <Link href="/forgot-password" className="text-red-800 dark:text-red-400 font-semibold hover:underline">
                                                    Forgot Password
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleStep2Submit} className="space-y-5">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Full Name"
                                            className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-12 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="Email Address (Optional)"
                                            className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-12 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                                            }
                                            placeholder="Mobile Number"
                                            maxLength={10}
                                            className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-12 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            placeholder="Password"
                                            className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-12 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-md mt-8"
                                    >
                                        {isLoading ? (
                                            "Sending OTP…"
                                        ) : (
                                            <>
                                                Send OTP
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <OTPStep
                                    phone={formData.phone}
                                    otp={otp}
                                    onChange={handleOtpChange}
                                    onVerify={(e) => {
                                        e.preventDefault();
                                        handleVerifyOtp();
                                    }}
                                    onBack={() => setStep(2)}
                                    onResend={async (e) => {
                                        e.preventDefault();
                                        try {
                                            const r = await authAPI.sendOTP({ phone: formData.phone });
                                            setDevOtp(r.data?.dev_otp || "");
                                            showToast("OTP resent successfully", "success");
                                        } catch (err) {
                                            showToast("Failed to resend OTP", "error");
                                        }
                                    }}
                                    loading={isLoading}
                                    error={error}
                                    title="Verify OTP"
                                    buttonLabel="Create Account"
                                    loadingLabel="Verifying..."
                                    devOtp={devOtp}
                                    onAutofill={handleAutofill}
                                />
                            </motion.div>
                        )}
                    </motion.div>

                    <p className="text-center text-sm font-light text-slate-500 mt-8">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
