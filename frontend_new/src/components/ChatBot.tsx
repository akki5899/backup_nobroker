"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
    id: number;
    text: string;
    isBot: boolean;
    timestamp: Date;
}

const botResponses = [
    "That's a great choice! Whitefield has excellent metro connectivity. Would you like to see 3BHK options there?",
    "I can help you find properties in that area. What's your budget range?",
    "We have several verified owner listings in HSR Layout. Shall I show you the top picks?",
    "For that price range, I'd recommend checking out Marathahalli and Sarjapur Road areas.",
    "Great question! We list verified villas and row-houses you can explore directly.",
    "I'll add that to your preferences. Would you also like properties with a gym and pool?",
];

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hello! 👋 I'm PropBot, your AI property assistant. How can I help you find your dream home today?",
            isBot: true,
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close the chat window on Escape for keyboard parity with other overlays.
    // (No body-scroll lock — this is a floating widget, the page should stay scrollable.)
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const sendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            isBot: false,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            const randomResponse =
                botResponses[Math.floor(Math.random() * botResponses.length)];
            const botMessage: Message = {
                id: Date.now() + 1,
                text: randomResponse,
                isBot: true,
                timestamp: new Date(),
            };
            setIsTyping(false);
            setMessages((prev) => [...prev, botMessage]);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-dropdown">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-20 right-0 w-[340px] sm:w-[380px] h-[500px] bg-card rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">VillaBot</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-primary-100">
                                            Online • Typically replies instantly
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Close chat"
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${message.isBot
                                            ? "bg-card rounded-tl-none border border-gray-100 dark:border-slate-700"
                                            : "bg-primary-600 text-white rounded-tr-none"
                                            }`}
                                    >
                                        <p className={`text-sm leading-relaxed ${message.isBot ? "text-foreground/80" : ""}`}>
                                            {message.text}
                                        </p>
                                        <p
                                            className={`text-[9px] mt-1.5 ${message.isBot
                                                ? "text-slate-400"
                                                : "text-primary-200"
                                                }`}
                                        >
                                            {message.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-card p-3.5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-card border-t border-gray-100 dark:border-slate-700 shrink-0">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about localities, prices..."
                                    className="flex-1 outline-none text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-slate-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputValue.trim()}
                                    className="w-11 h-11 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200 dark:shadow-primary-900/30"
                                >
                                    {isTyping ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
                aria-expanded={isOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 gradient-animated text-white rounded-full shadow-2xl flex items-center justify-center transition-all ${!isOpen ? "pulse-glow" : ""
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </motion.button>
        </div>
    );
}
