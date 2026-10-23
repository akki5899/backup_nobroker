"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Phone, Mail, X } from "lucide-react";
import { Property } from "@/types";
import { propertyAPI, inquiryAPI, chatAPI } from "@/utils/api_client";
import { getImageUrl } from "@/utils/imageUrl";
import PaymentModal from "@/components/PaymentModal";
import { useToast } from "@/components/Toast";
import { useModalDismiss } from "@/hooks/useModalDismiss";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
    const [sending, setSending] = useState(false);
    const { showToast } = useToast();

    useModalDismiss(showContactModal, () => setShowContactModal(false));

    useEffect(() => {
        if (params.id) {
            loadProperty(params.id as string);
        }
    }, [params.id]);

    const loadProperty = async (id: string) => {
        try {
            setLoading(true);
            const response = await propertyAPI.getById(id);
            setProperty(response.data);
        } catch (error) {
            console.error("Failed to load property:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !contactInfo.name || !contactInfo.email) {
            showToast("Please fill in your name, email, and message.", "error");
            return;
        }

        try {
            setSending(true);
            const token = localStorage.getItem('token');
            if (!token) {
                showToast("Please login to send an inquiry", "warning");
                setTimeout(() => router.push('/login'), 1500);
                return;
            }

            // 1) Record a formal inquiry (lead) for the owner — best-effort.
            // A duplicate inquiry returns 400; that's fine, we still open the chat.
            try {
                await inquiryAPI.create({
                    property_id: property?.id,
                    message: `${message}\n\nContact: ${contactInfo.name}\nEmail: ${contactInfo.email}\nPhone: ${contactInfo.phone}`,
                });
            } catch (inqErr) {
                console.warn("Inquiry not recorded (may already exist):", inqErr);
            }

            // 2) Open a real, persistent chat thread with the owner and send the
            //    message as the opening line. This is what powers /chats.
            await chatAPI.start(property!.id, message);

            showToast("Message sent! Opening your conversation…", "success");
            setShowContactModal(false);
            setMessage("");
            setContactInfo({ name: "", email: "", phone: "" });
            setTimeout(() => router.push('/chats'), 800);
        } catch (error: any) {
            console.error("Failed to send message:", error);
            const detail = error?.response?.data?.detail;
            showToast(detail || "Failed to send message. Please try again.", "error");
        } finally {
            setSending(false);
        }
    };

    const handleCallOwner = () => {
        showToast("Owner's contact will be revealed after verification", "info");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="text-center bg-card p-12 rounded-2xl shadow-2xl border border-border">
                    <h2 className="text-3xl font-display mb-4 text-foreground">Property not found</h2>
                    <p className="text-muted-foreground font-light mb-8">The property you&rsquo;re looking for doesn&rsquo;t exist or has been removed.</p>
                    <button onClick={() => router.back()} className="px-8 py-3.5 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-full font-semibold tracking-wide hover:bg-primary-800 dark:hover:bg-accent-400 transition-all">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-accent-600 transition-colors eyebrow text-[10px]">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to listings</span>
                </button>

                <div className="bg-card rounded-2xl overflow-hidden mb-8 border border-border relative group">
                    {property.images && property.images.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[50vh] sm:h-[60vh] min-h-[300px] sm:min-h-[400px]">
                            <div className="md:col-span-3 h-full relative overflow-hidden bg-muted">
                                <img
                                    src={getImageUrl(property.images[0].image_url)}
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                            {property.images.length > 1 && (
                                <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                                    {property.images.slice(1, 3).map((img, idx) => (
                                        <div key={idx} className="h-full relative overflow-hidden bg-muted">
                                            <img
                                                src={getImageUrl(img.image_url)}
                                                alt={`Gallery ${idx + 1}`}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'; }}
                                            />
                                            {idx === 1 && property.images.length > 3 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                                    <span className="text-white font-display text-xl">+{property.images.length - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-[50vh] sm:h-[60vh] min-h-[300px] sm:min-h-[400px] bg-muted flex items-center justify-center">
                            <div className="text-[8rem] sm:text-[12rem] font-display text-muted-foreground/40 opacity-50">🏠</div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-border relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px]" />
                            <div className="relative z-raised">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                    <div className="flex-1">
                                        <span className="eyebrow text-[9px] text-accent-600 mb-3 inline-block">{property.listing_type}</span>
                                        <h1 className="text-3xl sm:text-5xl font-display text-foreground mb-3 leading-[1.05]">{property.title}</h1>
                                        <p className="text-muted-foreground flex items-center gap-2 font-light">
                                            <MapPin className="w-4 h-4 text-accent-600" />
                                            {property.address}, {property.city}
                                        </p>
                                    </div>
                                </div>
                                <div className="engrave-top pt-6 stats-value text-5xl text-foreground">
                                    ₹{(property.price / 100000).toFixed(2)}<span className="text-2xl text-muted-foreground ml-1">L</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border">
                            <h2 className="text-2xl font-display mb-8 text-foreground">
                                Property Features
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                                {property.bedrooms && (
                                    <div className="bg-muted/50 p-5 sm:p-6 rounded-2xl text-center border border-border hover:border-accent-400/50 transition-colors">
                                        <Bed className="w-7 h-7 mx-auto mb-3 text-accent-600" />
                                        <p className="stats-value text-3xl text-foreground mb-1">{property.bedrooms}</p>
                                        <p className="eyebrow text-[8px] text-muted-foreground">Bedrooms</p>
                                    </div>
                                )}
                                {property.bathrooms && (
                                    <div className="bg-muted/50 p-6 rounded-2xl text-center border border-border hover:border-accent-400/50 transition-colors">
                                        <Bath className="w-7 h-7 mx-auto mb-3 text-accent-600" />
                                        <p className="stats-value text-3xl text-foreground mb-1">{property.bathrooms}</p>
                                        <p className="eyebrow text-[8px] text-muted-foreground">Bathrooms</p>
                                    </div>
                                )}
                                {property.area && (
                                    <div className="bg-muted/50 p-6 rounded-2xl text-center border border-border hover:border-accent-400/50 transition-colors">
                                        <Maximize2 className="w-7 h-7 mx-auto mb-3 text-accent-600" />
                                        <p className="stats-value text-3xl text-foreground mb-1">{property.area}</p>
                                        <p className="eyebrow text-[8px] text-muted-foreground">Sq. Ft.</p>
                                    </div>
                                )}
                                <div className="bg-muted/50 p-6 rounded-2xl text-center border border-border hover:border-accent-400/50 transition-colors flex flex-col justify-center">
                                    <p className="font-display text-xl text-foreground capitalize mb-1 line-clamp-1">{property.type || 'N/A'}</p>
                                    <p className="eyebrow text-[8px] text-muted-foreground">Property Type</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 engrave-top">
                                {property.floor !== null && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Floor</span><span className="text-sm font-semibold text-foreground">{property.floor}{property.total_floors ? ` of ${property.total_floors}` : ''}</span></div>}
                                {property.age !== null && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Age</span><span className="text-sm font-semibold text-foreground">{property.age} years</span></div>}
                                {property.furnished !== null && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Furnished</span><span className="text-sm font-semibold text-foreground">{property.furnished ? 'Yes' : 'No'}</span></div>}
                                {property.parking !== null && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Parking</span><span className="text-sm font-semibold text-foreground">{property.parking ? 'Available' : 'No'}</span></div>}
                                {property.balcony !== null && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Balcony</span><span className="text-sm font-semibold text-foreground">{property.balcony ? 'Yes' : 'No'}</span></div>}
                                {property.deposit && <div className="flex justify-between items-center bg-muted/50 px-5 py-4 rounded-xl border border-border"><span className="eyebrow text-[9px] text-muted-foreground">Deposit</span><span className="text-sm font-semibold text-foreground">₹{(property.deposit / 100000).toFixed(2)}L</span></div>}
                            </div>

                            {(() => {
                                const amenityLabels: [keyof Property, string][] = [
                                    ["gym", "Gym"],
                                    ["swimming_pool", "Swimming Pool"],
                                    ["lift", "Lift"],
                                    ["security", "Security"],
                                    ["power_backup", "Power Backup"],
                                    ["club_house", "Club House"],
                                    ["garden", "Garden"],
                                    ["children_play_area", "Children Play Area"],
                                    ["intercom", "Intercom"],
                                    ["visitor_parking", "Visitor Parking"],
                                    ["mini_theatre", "Mini Theatre"],
                                    ["library_reading_room", "Library/Reading Room"],
                                    ["community_hall", "Community Hall"],
                                    ["pet_park", "Pet Park/Grooming"],
                                    ["ev_charging", "EV Charging"],
                                    ["rainwater_harvesting", "Rainwater Harvesting"],
                                    ["solar_panels", "Solar Panels"],
                                    ["maintenance_staff", "24/7 Maintenance"],
                                    ["cctv_surveillance", "CCTV Surveillance"],
                                    ["fire_safety", "Fire Safety System"],
                                    ["badminton_squash_court", "Badminton/Squash Court"],
                                    ["sauna_steam_room", "Sauna/Steam Room"],
                                    ["indoor_games_room", "Indoor Games Room"],
                                    ["yoga_meditation_room", "Yoga/Meditation Room"],
                                    ["jogging_track", "Jogging/Walking Track"],
                                    ["outdoor_fitness_area", "Outdoor Fitness Area"],
                                ];
                                const active = amenityLabels.filter(([key]) => (property as any)[key]);
                                if (active.length === 0) return null;
                                return (
                                    <div className="pt-8 mt-8 engrave-top">
                                        <h3 className="eyebrow text-[9px] text-muted-foreground mb-4">Amenities</h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {active.map(([key, label]) => (
                                                <span key={key as string} className="px-4 py-2 bg-accent-500/[0.08] text-accent-700 dark:text-accent-400 border border-accent-500/20 rounded-full text-xs font-medium tracking-wide">{label}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Property Videos (F22) */}
                        {property.videos && property.videos.length > 0 && (
                            <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border">
                                <h2 className="text-2xl font-display mb-6 text-foreground">Video Tour</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {property.videos.map((video) => (
                                        <video
                                            key={video.id}
                                            src={getImageUrl(video.video_url)}
                                            controls
                                            className="w-full rounded-2xl bg-black aspect-video"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {property.description && (
                            <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border">
                                <h2 className="text-2xl font-display mb-6 text-foreground">Description</h2>
                                <p className="text-foreground/70 leading-loose font-light text-[0.95rem]">{property.description}</p>
                            </div>
                        )}

                        <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border">
                            <h2 className="text-2xl font-display mb-6 text-foreground">Location</h2>
                            <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                                <div className="flex items-start gap-4">
                                    <div className="bg-accent-500/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-accent-600" />
                                    </div>
                                    <div>
                                        <p className="font-display text-lg text-foreground mb-1">{property.address}</p>
                                        <p className="text-sm text-muted-foreground font-light">{property.city}, {property.state} - {property.pincode}</p>
                                        {(property as any).latitude && (property as any).longitude && (
                                            <a href={`https://www.google.com/maps?q=${(property as any).latitude},${(property as any).longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-full text-xs font-semibold tracking-wide hover:bg-primary-800 dark:hover:bg-accent-400 transition-colors">
                                                <MapPin className="w-3 h-3" />
                                                View on Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border lg:sticky lg:top-24">
                            <h3 className="text-2xl font-display mb-2 text-foreground">Contact the owner</h3>
                            <p className="text-sm font-light text-muted-foreground mb-7">Reach out to discuss details or schedule a visit.</p>
                            <div className="space-y-3">
                                <button onClick={handleCallOwner} className="w-full bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 py-4 rounded-full font-semibold tracking-wide hover:bg-primary-800 dark:hover:bg-accent-400 transition-all flex items-center justify-center gap-3">
                                    <Phone className="w-5 h-5" />
                                    Call Now
                                </button>
                                <button onClick={() => setShowContactModal(true)} className="w-full bg-muted/50 text-foreground py-4 rounded-full font-semibold tracking-wide border border-border hover:border-accent-400/60 hover:text-accent-700 dark:hover:text-accent-400 transition-all flex items-center justify-center gap-3">
                                    <Mail className="w-5 h-5" />
                                    Send Message
                                </button>
                                <button onClick={() => setIsPaymentOpen(true)} className="w-full bg-sage-500/10 text-sage-700 dark:text-sage-400 py-4 rounded-full font-semibold tracking-wide border border-sage-500/25 hover:border-sage-500/50 transition-all">
                                    Book / Pay Token Deposit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showContactModal && (
                    <div className="fixed inset-0 bg-[#211b14]/50 backdrop-blur-md z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowContactModal(false)}>
                        <div className="bg-card rounded-2xl p-6 sm:p-8 lg:p-10 max-w-lg w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-7">
                                <h3 className="text-2xl sm:text-3xl font-display text-foreground">Send a message</h3>
                                <button onClick={() => setShowContactModal(false)} className="p-2 bg-muted hover:bg-accent-500/10 rounded-full transition-colors touch-manipulation shrink-0"><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block eyebrow text-[9px] text-muted-foreground mb-2">Your Name *</label>
                                    <input type="text" value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block eyebrow text-[9px] text-muted-foreground mb-2">Your Email *</label>
                                    <input type="email" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block eyebrow text-[9px] text-muted-foreground mb-2">Your Phone</label>
                                    <input type="tel" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground" placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label className="block eyebrow text-[9px] text-muted-foreground mb-2">Message *</label>
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all font-medium text-foreground placeholder:text-muted-foreground resize-none" placeholder="I am interested in this property..." />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button onClick={() => setShowContactModal(false)} className="w-full sm:flex-1 px-6 py-3.5 bg-muted/50 border border-border text-foreground rounded-full text-sm font-semibold tracking-wide hover:border-accent-400/60 transition-colors touch-manipulation">Cancel</button>
                                    <button onClick={handleSendMessage} disabled={sending} className="w-full sm:flex-1 px-6 py-3.5 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-full text-sm font-semibold tracking-wide hover:bg-primary-800 dark:hover:bg-accent-400 transition-all disabled:opacity-50 touch-manipulation">{sending ? "Sending…" : "Send Message"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {property && (
                    <PaymentModal
                        isOpen={isPaymentOpen}
                        onClose={() => setIsPaymentOpen(false)}
                        amount={5000} // Flat 5000 deposit
                        paymentType="token_advance"
                        referenceId={property.id}
                        onSuccess={(txId) => showToast(`Property reserved! Token reference: ${txId}`, "success")}
                    />
                )}
            </div>
        </div>
    );
}
