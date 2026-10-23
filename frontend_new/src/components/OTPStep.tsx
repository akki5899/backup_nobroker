"use client";

interface OTPStepProps {
    phone: string;
    otp: string[];
    onChange: (index: number, value: string) => void;
    onVerify: (e: React.FormEvent) => void;
    onBack: () => void;
    onResend: (e: React.FormEvent) => void;
    loading: boolean;
    error?: string;
    /** Heading text, e.g. "Verify Number" */
    title?: string;
    /** Submit button label, e.g. "Verify & Sign In" or "Create Account" */
    buttonLabel: string;
    /** Submit button label while loading */
    loadingLabel?: string;
    /** Dev-only: OTP returned by the backend when no SMS gateway is configured. */
    devOtp?: string;
    /** Called when the user taps "Autofill" on the dev banner. */
    onAutofill?: (otp: string) => void;
}

/**
 * Shared OTP verification step used by both the login and signup flows so that
 * they render an identical design element.
 */
export default function OTPStep({
    phone,
    otp,
    onChange,
    onVerify,
    onBack,
    onResend,
    loading,
    error,
    title = "Verify Number",
    buttonLabel,
    loadingLabel = "Verifying...",
    devOtp,
    onAutofill,
}: OTPStepProps) {
    return (
        <>
            <button
                type="button"
                onClick={onBack}
                className="eyebrow text-[9px] text-muted-foreground hover:text-accent-600 mb-5 transition-colors flex items-center gap-1.5"
            >
                ← Back
            </button>
            <h2 className="text-3xl sm:text-4xl font-display mb-2 text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mb-7 font-light">
                We sent a 6-digit code to <span className="font-semibold text-foreground break-all">+91 {phone}</span>
            </p>

            {/* Dev-mode helper: SMS gateway not configured, so the backend returns
                the code directly. Lets you complete the flow without a subscription. */}
            {devOtp && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800 dark:text-amber-300">Dev mode — no SMS sent</p>
                        <p className="text-amber-700 dark:text-amber-400/80 font-light">
                            Your code is <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                        </p>
                    </div>
                    {onAutofill && (
                        <button
                            type="button"
                            onClick={() => onAutofill(devOtp)}
                            className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                        >
                            Autofill
                        </button>
                    )}
                </div>
            )}

            {/* Reserved space for error — prevents layout shift */}
            <div className="min-h-[44px] mb-2">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        {error}
                    </div>
                )}
            </div>

            <form onSubmit={onVerify} className="space-y-8">
                <div className="flex gap-2 sm:gap-4 justify-center">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => onChange(index, e.target.value.replace(/\D/g, ''))}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl stats-value bg-muted/50 border border-border rounded-xl outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all text-foreground"
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.some((d) => !d)}
                    className="w-full bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 py-4 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-primary-800 dark:hover:bg-accent-400 transition-all"
                >
                    {loading ? loadingLabel : buttonLabel}
                </button>
            </form>

            <div className="text-center mt-8">
                <p className="text-sm font-light text-muted-foreground mb-2">
                    Didn&rsquo;t receive the code?
                </p>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={loading}
                    className="text-accent-700 dark:text-accent-400 hover:text-accent-600 font-semibold text-sm transition-colors"
                >
                    Resend Code
                </button>
            </div>
        </>
    );
}
