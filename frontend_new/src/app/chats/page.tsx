// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Send, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import { chatAPI, userAPI } from "@/utils/api_client";
import { useToast } from "@/components/Toast";

const fmtTime = (d: any) =>
    d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function ChatsPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");
    const { showToast } = useToast();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const selectedIdRef = useRef<number | null>(null);

    const scrollToBottom = () =>
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    // Initial load: profile + conversations.
    useEffect(() => {
        (async () => {
            try {
                const [userRes, convRes] = await Promise.all([
                    userAPI.getProfile(),
                    chatAPI.getConversations(),
                ]);
                setUser(userRes.data);
                setConversations(convRes.data || []);
                if ((convRes.data || []).length > 0) openConversation(convRes.data[0]);
            } catch (error) {
                console.error("Failed to load conversations", error);
                showToast("Failed to load conversations", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const res = await chatAPI.getConversations();
            setConversations(res.data || []);
        } catch { /* silent — list refresh shouldn't error-toast on every poll */ }
    }, []);

    const loadMessages = useCallback(async (chatId: number, markListRead = true) => {
        try {
            const res = await chatAPI.getMessages(chatId);
            setMessages(res.data.messages || []);
            if (markListRead) {
                // Viewing a thread clears its unread count locally.
                setConversations(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    }, []);

    const openConversation = (conv: any) => {
        setSelected(conv);
        selectedIdRef.current = conv.id;
        setMobileView("chat");
        loadMessages(conv.id).then(scrollToBottom);
    };

    // Poll the open thread + conversation list for new messages every 5s.
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedIdRef.current) loadMessages(selectedIdRef.current, false);
            loadConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, [loadMessages, loadConversations]);

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || !selected || sending) return;
        setSending(true);
        // Optimistic append.
        const optimistic = {
            id: `tmp-${Date.now()}`,
            message: text,
            is_mine: true,
            created_at: new Date().toISOString(),
            pending: true,
        };
        setMessages(prev => [...prev, optimistic]);
        setMessage("");
        scrollToBottom();
        try {
            const res = await chatAPI.sendMessage(selected.id, text);
            // Replace the optimistic bubble with the server message.
            setMessages(prev => prev.map(m => (m.id === optimistic.id ? res.data : m)));
            setConversations(prev =>
                prev.map(c => c.id === selected.id
                    ? { ...c, last_message: text, last_message_at: res.data.created_at }
                    : c));
        } catch (error) {
            // Roll back the optimistic message on failure.
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setMessage(text);
            showToast("Failed to send message", "error");
        } finally {
            setSending(false);
        }
    };

    const filtered = conversations.filter(c =>
        !search ||
        (c.counterparty_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.property_title || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)] flex items-center justify-center bg-muted/50">
                <div className="w-12 h-12 bg-accent-500/20 rounded-full animate-pulse" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)] flex flex-col items-center justify-center bg-muted/50 text-muted-foreground px-4 text-center">
                <MessageCircle className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <h2 className="font-display text-2xl text-foreground mb-2">No Messages Yet</h2>
                <p className="font-light">Start a conversation from any property page to chat with the owner.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)] flex">
            {/* Conversation List */}
            <div className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 border-r border-border bg-card flex-col`}>
                <div className="p-4 border-b border-border">
                    <h2 className="font-display text-xl mb-4 text-foreground">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full bg-muted/50 border border-border rounded-xl px-10 py-3 outline-none focus:border-accent-400 text-sm font-medium text-foreground"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {filtered.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => openConversation(conv)}
                            className={`w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left ${selected?.id === conv.id ? "bg-accent-500/10" : ""}`}
                        >
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 bg-accent-500/15 rounded-full flex items-center justify-center font-semibold text-accent-600">
                                    {(conv.counterparty_name || "U").charAt(0).toUpperCase()}
                                </div>
                                {conv.unread > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-accent-500 text-primary-950 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-card">
                                        {conv.unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <h3 className="font-semibold text-sm text-foreground truncate">{conv.counterparty_name}</h3>
                                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                                        {conv.role === "owner" ? "Buyer" : "Owner"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-accent-600/80 font-semibold truncate">{conv.property_title}</p>
                                <p className={`text-xs truncate ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {conv.last_message || "No messages yet"}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            {selected && (
                <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col bg-muted/50`}>
                    {/* Header */}
                    <div className="p-4 bg-card border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <button
                                onClick={() => setMobileView("list")}
                                className="md:hidden p-2 -ml-2 hover:bg-muted rounded-xl transition-colors shrink-0"
                                aria-label="Back to conversations"
                            >
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <div className="w-10 h-10 bg-accent-500/15 rounded-full flex items-center justify-center font-semibold text-accent-600 shrink-0">
                                {(selected.counterparty_name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-foreground truncate">{selected.counterparty_name}</h3>
                                <p className="text-[10px] font-semibold text-muted-foreground truncate">{selected.property_title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => selected.counterparty_phone ? window.open(`tel:${selected.counterparty_phone}`) : showToast("No phone number available for this contact.", "warning")}
                                className="p-2.5 hover:bg-muted rounded-xl transition-colors"
                            >
                                <Phone className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <MessageCircle className="w-12 h-12 mb-3 text-muted-foreground/40" />
                                <p className="text-sm font-light">No messages yet. Say hello 👋</p>
                            </div>
                        ) : (
                            messages.map((msg: any) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[70%] p-4 rounded-2xl ${msg.is_mine
                                        ? "bg-accent-500 text-primary-950 rounded-br-none"
                                        : "bg-card text-foreground rounded-bl-none border border-border"}`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                        <p className={`text-[9px] mt-1 ${msg.is_mine ? "text-primary-950/60" : "text-muted-foreground"}`}>
                                            {msg.pending ? "Sending…" : fmtTime(msg.created_at)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-card border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Type a message..."
                                    maxLength={1000}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-5 py-3.5 outline-none focus:border-accent-400 text-sm font-medium text-foreground"
                                />
                                {message.length > 800 && (
                                    <span className={`absolute right-3 bottom-1 text-[10px] font-bold ${message.length >= 1000 ? "text-red-500" : "text-amber-500"}`}>
                                        {message.length}/1000
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim() || sending}
                                className="w-12 h-12 bg-accent-500 hover:bg-accent-400 text-primary-950 rounded-xl flex items-center justify-center transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
