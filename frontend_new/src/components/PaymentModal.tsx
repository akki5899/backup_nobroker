"use client";

import { useState } from "react";
import { X, CreditCard, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalDismiss } from "@/hooks/useModalDismiss";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    paymentType: string;
    referenceId?: number;
    onSuccess: (txId: string) => void;
    metadata?: any;
}

export default function PaymentModal({
    isOpen,
    onClose,
    amount,
    paymentType,
    referenceId,
    onSuccess,
    metadata
}: PaymentModalProps) {
    const [loading, setLoading] = useState(false);

    useModalDismiss(isOpen, onClose);

    // Initialize Razorpay
    const handlePayment = async () => {
        setLoading(true);
        try {
            // Step 1: Create Order on Backend
            const token = localStorage.getItem("token");
            const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/payments/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ amount, payment_type: paymentType, reference_id: referenceId, metadata_json: metadata }),
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) throw new Error(orderData.detail || "Failed to create order");

            // Step 2: Open Razorpay Checkout Modal
            const options = {
                key: orderData.key_id,
                amount: orderData.amount * 100, // paise 
                currency: "INR",
                name: "RightVillaNest",
                description: `Payment for ${paymentType.replace('_', ' ')}`,
                image: "/logo.png",
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // Step 3: Verify Payment Signature on Backend
                    try {
                        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/payments/verify-payment`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        });

                        if (verifyRes.ok) {
                            onSuccess(response.razorpay_payment_id);
                            onClose();
                        } else {
                            alert("Payment Verification Failed. Contact Support.");
                        }
                    } catch (err) {
                        alert("Unable to reach verification server.");
                    }
                },
                prefill: {
                    name: "User Name", // Ideally fetched from context
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#0f172a" // primary-950 slate
                }
            };

            // Check if Razorpay script is loaded dynamically
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => {
                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    alert(response.error.description);
                });
                rzp.open();
            };
            document.body.appendChild(script);

        } catch (error: any) {
            alert(error.message || "Failed to initialize payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-overlay transition-all cursor-pointer"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 pointer-events-none z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="pointer-events-auto w-full max-w-md bg-card rounded-[2rem] shadow-2xl border border-border overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 pb-0 flex justify-between items-start">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-4">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-muted rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 pt-2">
                                <h3 className="text-2xl font-black text-foreground capitalize mb-2">
                                    Complete Payment
                                </h3>
                                <p className="text-muted-foreground text-sm mb-6 font-medium">
                                    {paymentType.replace('_', ' ')}
                                </p>

                                <div className="bg-muted/50 rounded-2xl p-6 border border-border mb-8 shadow-inner">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-500 font-bold text-sm">Amount</span>
                                        <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                                            ₹{amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-4" />
                                    <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl">
                                        <ShieldCheck className="w-4 h-4" />
                                        100% Secure Transaction via Razorpay
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full bg-primary-900 dark:bg-accent-500 hover:bg-slate-800 dark:hover:bg-accent-400 text-white dark:text-primary-950 py-4 rounded-2xl font-black transition-all disabled:opacity-50 uppercase tracking-widest shadow-xl shadow-primary-900/20 dark:shadow-accent-500/20"
                                    >
                                        {loading ? "Processing..." : `Pay ₹${amount.toLocaleString()}`}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full bg-transparent hover:bg-muted text-foreground/80 py-3.5 rounded-2xl font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
