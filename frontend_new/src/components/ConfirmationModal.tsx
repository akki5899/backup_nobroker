"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useModalDismiss } from '@/hooks/useModalDismiss';

export type ModalType = 'danger' | 'success' | 'info' | 'warning';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: ModalType;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false
}: ConfirmationModalProps) {

    const getModalTheme = (type: ModalType) => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
                    bg: 'bg-red-50 dark:bg-red-900/10',
                    border: 'border-red-100 dark:border-red-900/30',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-500/20 text-white'
                };
            case 'success':
                return {
                    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
                    bg: 'bg-green-50 dark:bg-green-900/10',
                    border: 'border-green-100 dark:border-green-900/30',
                    confirmBtn: 'bg-green-600 hover:bg-green-700 shadow-green-500/20 text-white'
                };
            case 'info':
                return {
                    icon: <Info className="w-8 h-8 text-blue-500" />,
                    bg: 'bg-blue-50 dark:bg-blue-900/10',
                    border: 'border-blue-100 dark:border-blue-900/30',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
                    bg: 'bg-amber-50 dark:bg-amber-900/10',
                    border: 'border-amber-100 dark:border-amber-900/30',
                    confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white'
                };
            default:
                return {
                    icon: <Info className="w-8 h-8 text-primary-500" />,
                    bg: 'bg-primary-50 dark:bg-primary-900/10',
                    border: 'border-primary-100 dark:border-primary-900/30',
                    confirmBtn: 'bg-primary-900 dark:bg-accent-500 hover:bg-primary-800 text-white'
                };
        }
    };

    const theme = getModalTheme(type);

    useModalDismiss(isOpen, onClose);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary-950/40 dark:bg-slate-950/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-md bg-card rounded-[2rem] shadow-2xl border border-border overflow-hidden"
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-muted hover:bg-muted rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 sm:p-10">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${theme.bg} ${theme.border}`}>
                                {theme.icon}
                            </div>

                            <h3 className="text-2xl font-black text-foreground mb-3">
                                {title}
                            </h3>

                            <p className="text-muted-foreground font-medium mb-8">
                                {description}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-4 bg-muted/50 border border-border text-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${theme.confirmBtn}`}
                                >
                                    {isLoading && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {isLoading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
