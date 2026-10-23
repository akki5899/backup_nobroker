// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { propertyAPI, authAPI } from "@/utils/api_client";
import { useToast } from "@/components/Toast";
import {
    Home,
    Building2,
    LandPlot,
    Store,
    Upload,
    MapPin,
    IndianRupee,
    Maximize2,
    BedDouble,
    Bath,
    Car,
    Check
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Google Maps URL parser utility
const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
    try {
        // Pattern 1: @lat,lng format
        const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (atMatch) {
            return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }
        // Pattern 2: ?q=lat,lng format
        const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }
        return null;
    } catch {
        return null;
    }
};

// Reverse geocoding (mock - in production use Google Geocoding API)
const getLocationFromCoordinates = async (lat: number, lng: number) => {
    // This is a mock function. In production, you'd call Google's Reverse Geocoding API
    // or your backend endpoint to get city, state, pincode from coordinates
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();

        const address = data.address || {};
        return {
            city: address.city || address.town || address.village || "",
            state: address.state || "",
            pincode: address.postcode || "",
        };
    } catch (error) {
        console.error("Failed to get location from coordinates", error);
        return { city: "", state: "", pincode: "" };
    }
};

const propertyTypes = [
    { id: "apartment", label: "Apartment", icon: Building2 },
    { id: "villa", label: "Villa", icon: Home },
    { id: "house", label: "House", icon: Home },
    { id: "builder_floor", label: "Builder Floor", icon: Building2 },
];

const listingTypes = [
    { id: "sale", label: "Sell" },  // FIXED: Changed from "sell" to "sale"
    { id: "rent", label: "Rent/Lease" },
];

export default function PostPropertyPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [propertyId, setPropertyId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        propertyType: "apartment",
        listingType: "sale",  // FIXED: Changed from "sell" to "sale"
        title: "",
        description: "",
        locality: "",
        city: "",  // FIXED: Removed hardcoded "Bangalore"
        state: "",  // FIXED: Removed hardcoded "Karnataka"
        pincode: "",  // FIXED: Removed hardcoded "560001"
        latitude: "",
        longitude: "",
        price: "",
        area: "",
        age: "",
        bhk: "2",
        bathrooms: "2",
        parking: "1",
        isLuxury: false,
        gatedCommunity: false,
        amenities: [] as string[],
        connectivity: [] as string[],
        photos: [] as File[],
        videos: [] as File[],
    });
    const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

    const loadPropertyData = useCallback(async (id: string) => {
        try {
            const response = await propertyAPI.getById(id);
            const property = response.data;

            const loadedAmenities: string[] = [];
            if (property.gym) loadedAmenities.push("Gym");
            if (property.swimming_pool) loadedAmenities.push("Pool");
            if (property.lift) loadedAmenities.push("Lift");
            if (property.security) loadedAmenities.push("Security");
            if (property.power_backup) loadedAmenities.push("Power Backup");
            if (property.club_house) loadedAmenities.push("Club House");
            if (property.garden) loadedAmenities.push("Garden");
            if (property.children_play_area) loadedAmenities.push("Children Play Area");
            if (property.intercom) loadedAmenities.push("Intercom");
            if (property.visitor_parking) loadedAmenities.push("Visitor Parking");

            const loadedConnectivity: string[] = [];
            if (property.near_metro) loadedConnectivity.push("Metro");
            if (property.near_bus) loadedConnectivity.push("Bus");
            if (property.near_highway) loadedConnectivity.push("Highway");
            if (property.near_schools) loadedConnectivity.push("Schools");
            if (property.near_hospitals) loadedConnectivity.push("Hospitals");
            if (property.near_airport) loadedConnectivity.push("Airport");
            if (property.near_it_hubs) loadedConnectivity.push("IT Hubs");
            if (property.near_malls) loadedConnectivity.push("Malls");

            setFormData({
                propertyType: property.property_type,
                listingType: property.listing_type,
                title: property.title || "",
                description: property.description || "",
                locality: property.address || "",
                city: property.city || "",
                state: property.state || "",
                pincode: property.pincode || "",
                latitude: property.latitude?.toString() || "",
                longitude: property.longitude?.toString() || "",
                price: property.price?.toString() || "",
                area: property.area?.toString() || "",
                age: property.age?.toString() || "",
                bhk: property.bedrooms?.toString() || "2",
                bathrooms: property.bathrooms?.toString() || "2",
                parking: property.parking ? "1" : "0",
                isLuxury: Boolean(property.is_luxury),
                gatedCommunity: Boolean(property.gated_community),
                amenities: loadedAmenities,
                connectivity: loadedConnectivity,
                photos: [],
                videos: [],
            });
            setExistingPhotos(property.images || []);
        } catch (error) {
            console.error("Failed to load property:", error);
            showToast("Failed to load property data", "error");
        }
    }, [showToast]);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem("token");
        const userDataStr = localStorage.getItem("user");
        if (!token || !userDataStr) {
            showToast("Please login to post a property", "info");
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userDataStr);
            const isPrivilegedRole = user?.user_type && ['owner', 'agent', 'builder'].includes(user.user_type.toLowerCase());

            if (!isPrivilegedRole) {
                showToast("Only Owners, Agents, and Builders can post properties.", "error");
                router.push("/");
                return;
            }
        } catch (e) {
            console.error("Failed to parse user data", e);
        }

        // Check if editing existing property
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (id) {
            setEditMode(true);
            setPropertyId(id);
            loadPropertyData(id);
        }
    }, [router, showToast, loadPropertyData]);


    const amenityOptions = [
        "Gym", "Pool", "Lift", "Security", "Power Backup", "Club House",
        "Garden", "Children Play Area", "Intercom", "Visitor Parking",
        // Extended amenities (F23)
        "Mini Theatre", "Library/Reading Room", "Multipurpose/Community Hall",
        "Pet Park/Grooming", "EV Charging Stations", "Rainwater Harvesting",
        "Solar Panels", "24/7 Maintenance Staff", "CCTV Surveillance",
        "Fire Safety System", "Badminton/Squash Court", "Sauna/Steam Room",
        "Indoor Games Room", "Yoga/Meditation Room", "Jogging/Walking Track",
        "Outdoor Fitness Area"
    ];

    // Map UI amenity labels -> backend boolean field names.
    const amenityFieldMap: Record<string, string> = {
        "Gym": "gym",
        "Pool": "swimming_pool",
        "Lift": "lift",
        "Security": "security",
        "Power Backup": "power_backup",
        "Club House": "club_house",
        "Garden": "garden",
        "Children Play Area": "children_play_area",
        "Intercom": "intercom",
        "Visitor Parking": "visitor_parking",
        "Mini Theatre": "mini_theatre",
        "Library/Reading Room": "library_reading_room",
        "Multipurpose/Community Hall": "community_hall",
        "Pet Park/Grooming": "pet_park",
        "EV Charging Stations": "ev_charging",
        "Rainwater Harvesting": "rainwater_harvesting",
        "Solar Panels": "solar_panels",
        "24/7 Maintenance Staff": "maintenance_staff",
        "CCTV Surveillance": "cctv_surveillance",
        "Fire Safety System": "fire_safety",
        "Badminton/Squash Court": "badminton_squash_court",
        "Sauna/Steam Room": "sauna_steam_room",
        "Indoor Games Room": "indoor_games_room",
        "Yoga/Meditation Room": "yoga_meditation_room",
        "Jogging/Walking Track": "jogging_track",
        "Outdoor Fitness Area": "outdoor_fitness_area",
    };

    const toggleAmenity = (amenity: string) => {
        setFormData((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((a) => a !== amenity)
                : [...prev.amenities, amenity],
        }));
    };

    // Connectivity — maps homepage "Connectivity Matters" tiles to near_* boolean fields.
    const connectivityOptions = [
        "Metro", "Bus", "Highway", "Schools", "Hospitals", "Airport", "IT Hubs", "Malls",
    ];
    const connectivityFieldMap: Record<string, string> = {
        "Metro": "near_metro",
        "Bus": "near_bus",
        "Highway": "near_highway",
        "Schools": "near_schools",
        "Hospitals": "near_hospitals",
        "Airport": "near_airport",
        "IT Hubs": "near_it_hubs",
        "Malls": "near_malls",
    };

    const toggleConnectivity = (item: string) => {
        setFormData((prev) => ({
            ...prev,
            connectivity: prev.connectivity.includes(item)
                ? prev.connectivity.filter((a) => a !== item)
                : [...prev.connectivity, item],
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData((prev) => ({
                ...prev,
                photos: [...prev.photos, ...Array.from(e.target.files || [])],
            }));
        }
    };

    const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
    const ALLOWED_VIDEO_MIME = ["video/mp4", "video/quicktime"];

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const incoming = Array.from(e.target.files);
        const accepted: File[] = [];
        for (const file of incoming) {
            if (!ALLOWED_VIDEO_MIME.includes(file.type)) {
                showToast(`${file.name}: only MP4 and MOV videos are allowed`, "error");
                continue;
            }
            if (file.size > MAX_VIDEO_BYTES) {
                showToast(`${file.name}: exceeds the 100MB limit`, "error");
                continue;
            }
            accepted.push(file);
        }
        if (accepted.length) {
            setFormData((prev) => ({ ...prev, videos: [...prev.videos, ...accepted] }));
            setVideoPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
        }
        // Reset input so the same file can be re-selected if removed.
        e.target.value = "";
    };

    const removeVideo = (index: number) => {
        setFormData((prev) => {
            const next = [...prev.videos];
            next.splice(index, 1);
            return { ...prev, videos: next };
        });
        setVideoPreviews((prev) => {
            const next = [...prev];
            URL.revokeObjectURL(next[index]);
            next.splice(index, 1);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Session expired. Please login again.", "error");
                router.push("/login");
                return;
            }

            // Validate required fields before hitting the API (address is mandatory on the backend).
            const missing: string[] = [];
            if (!formData.locality.trim()) missing.push("Locality / Address");
            if (!formData.city.trim()) missing.push("City");
            if (!formData.state.trim()) missing.push("State");
            if (!formData.pincode.trim()) missing.push("Pincode");
            if (!formData.price || Number(formData.price) <= 0) missing.push("Price");
            if (missing.length > 0) {
                const msg = `Please fill in: ${missing.join(", ")}`;
                setError(msg);
                showToast(msg, "error");
                setIsLoading(false);
                return;
            }

            // Build amenity booleans from the selected labels.
            const amenityFlags: Record<string, boolean> = {};
            Object.values(amenityFieldMap).forEach((field) => {
                amenityFlags[field] = false;
            });
            formData.amenities.forEach((label) => {
                const field = amenityFieldMap[label];
                if (field) amenityFlags[field] = true;
            });

            // Build connectivity (near_*) booleans from the selected labels.
            const connectivityFlags: Record<string, boolean> = {};
            Object.values(connectivityFieldMap).forEach((field) => {
                connectivityFlags[field] = false;
            });
            formData.connectivity.forEach((label) => {
                const field = connectivityFieldMap[label];
                if (field) connectivityFlags[field] = true;
            });

            const propertyData = {
                title: formData.title,
                description: formData.description,
                property_type: formData.propertyType,
                listing_type: formData.listingType,
                price: Number(formData.price),
                area: Number(formData.area),
                age: formData.age !== "" ? Number(formData.age) : null,
                bedrooms: Number(formData.bhk),
                bathrooms: Number(formData.bathrooms),
                address: formData.locality,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                furnished: false,
                parking: Number(formData.parking) > 0,
                balcony: false,
                is_luxury: formData.isLuxury,
                gated_community: formData.gatedCommunity,
                ...amenityFlags,
                ...connectivityFlags,
            };

            let responsePropertyId;
            if (editMode && propertyId) {
                // Update existing property
                await propertyAPI.update(propertyId, propertyData);
                responsePropertyId = propertyId;
                showToast("Property updated successfully!", "success");

                // Upload new images if any
                if (formData.photos.length > 0) {
                    const imageFormData = new FormData();
                    formData.photos.forEach((photo) => {
                        imageFormData.append("files", photo);
                    });
                    await propertyAPI.uploadImages(responsePropertyId.toString(), imageFormData);
                }

                // Upload new videos if any (F22)
                if (formData.videos.length > 0) {
                    const videoFormData = new FormData();
                    formData.videos.forEach((video) => {
                        videoFormData.append("files", video);
                    });
                    await propertyAPI.uploadVideos(
                        responsePropertyId.toString(),
                        videoFormData,
                        (p) => setVideoProgress(p)
                    );
                }

                router.push("/my-listings");
            } else {
                // Create new property
                const response = await propertyAPI.create(propertyData);
                responsePropertyId = response.data.id;

                // Upload new images if any
                if (formData.photos.length > 0) {
                    const imageFormData = new FormData();
                    formData.photos.forEach((photo) => {
                        imageFormData.append("files", photo);
                    });
                    await propertyAPI.uploadImages(responsePropertyId.toString(), imageFormData);
                }

                // Upload videos if any (F22), with progress indicator
                if (formData.videos.length > 0) {
                    const videoFormData = new FormData();
                    formData.videos.forEach((video) => {
                        videoFormData.append("files", video);
                    });
                    await propertyAPI.uploadVideos(
                        responsePropertyId.toString(),
                        videoFormData,
                        (p) => setVideoProgress(p)
                    );
                }

                // Clear the form so a page reload won't show stale data, then
                // redirect to the confirmation page with a reference ID.
                const referenceId = `RVN-${String(responsePropertyId).padStart(6, "0")}`;
                setFormData({
                    propertyType: "apartment",
                    listingType: "sale",
                    title: "",
                    description: "",
                    locality: "",
                    city: "",
                    state: "",
                    pincode: "",
                    latitude: "",
                    longitude: "",
                    price: "",
                    area: "",
                    age: "",
                    bhk: "2",
                    bathrooms: "2",
                    parking: "1",
                    isLuxury: false,
                    gatedCommunity: false,
                    amenities: [],
                    connectivity: [],
                    photos: [],
                    videos: [],
                });
                setVideoPreviews([]);
                setVideoProgress(0);
                setStep(1);
                router.push(
                    `/post-property/success?ref=${encodeURIComponent(referenceId)}&id=${responsePropertyId}`
                );
            }
        } catch (err: any) {
            console.error("Failed to save property", err);
            const errorMessage = err.response?.data?.detail || "Failed to save property. Please try again.";
            setError(errorMessage);
            showToast(errorMessage, "error");

            if (err.response?.status === 401) {
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-8 sm:py-10 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <p className="eyebrow text-accent-600 mb-3">List Your Property</p>
                    <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">
                        {editMode ? "Edit Your Property" : "Post Your Property Free"}
                    </h1>
                    <p className="text-muted-foreground font-light">
                        {editMode ? "Update your property details" : "Reach millions of verified buyers directly"}
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${s <= step
                                    ? "bg-accent-500 text-primary-950"
                                    : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {s < step ? <Check className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-16 h-1 mx-2 rounded-full ${s < step ? "bg-accent-500" : "bg-muted"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center font-semibold">
                        {error}
                    </div>
                )}

                {/* Form Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-2xl p-6 sm:p-10 border border-border shadow-sm"
                >
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-4">
                                        Property Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {propertyTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({ ...formData, propertyType: type.id })
                                                }
                                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.propertyType === type.id
                                                    ? "border-accent-500 bg-accent-500/10"
                                                    : "border-border hover:border-accent-400/50"
                                                    }`}
                                            >
                                                <type.icon
                                                    className={`w-8 h-8 ${formData.propertyType === type.id
                                                        ? "text-accent-600"
                                                        : "text-muted-foreground"
                                                        }`}
                                                />
                                                <span className="text-xs font-semibold text-foreground/80">
                                                    {type.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-4">
                                        Listing Type
                                    </label>
                                    <div className="flex gap-4">
                                        {listingTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({ ...formData, listingType: type.id })
                                                }
                                                className={`flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-all ${formData.listingType === type.id
                                                    ? "border-accent-500 bg-accent-500 text-primary-950"
                                                    : "border-border text-foreground/80 hover:border-accent-400/50"
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                        Property Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        placeholder="e.g., Spacious 3 BHK with Garden View"
                                        className="w-full bg-muted/50 border border-border rounded-xl px-5 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-colors shadow-sm"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            Locality
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={formData.locality}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, locality: e.target.value })
                                                }
                                                placeholder="e.g., Whitefield"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            Price
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, price: e.target.value })
                                                }
                                                placeholder="e.g., 7500000"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-12 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            Area (sqft)
                                        </label>
                                        <div className="relative">
                                            <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="number"
                                                value={formData.area}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, area: e.target.value })
                                                }
                                                className="w-full bg-muted/50 border border-border rounded-xl px-10 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            BHK
                                        </label>
                                        <div className="relative">
                                            <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-raised" />
                                            <Select
                                                value={formData.bhk}
                                                onValueChange={(v) =>
                                                    setFormData({ ...formData, bhk: v })
                                                }
                                            >
                                                <SelectTrigger className="w-full h-12 sm:h-14 pl-10 rounded-xl bg-muted/50 border-border text-sm font-medium">
                                                    <SelectValue placeholder="BHK" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <SelectItem key={n} value={String(n)} className="font-semibold">
                                                            {n} BHK
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            Bathrooms
                                        </label>
                                        <div className="relative">
                                            <Bath className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-raised" />
                                            <Select
                                                value={formData.bathrooms}
                                                onValueChange={(v) =>
                                                    setFormData({ ...formData, bathrooms: v })
                                                }
                                            >
                                                <SelectTrigger className="w-full h-12 sm:h-14 pl-10 rounded-xl bg-muted/50 border-border text-sm font-medium">
                                                    <SelectValue placeholder="Bathrooms" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4].map((n) => (
                                                        <SelectItem key={n} value={String(n)} className="font-semibold">
                                                            {n} Bathroom{n > 1 ? 's' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                            Parking
                                        </label>
                                        <div className="relative">
                                            <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-raised" />
                                            <Select
                                                value={formData.parking}
                                                onValueChange={(v) =>
                                                    setFormData({ ...formData, parking: v })
                                                }
                                            >
                                                <SelectTrigger className="w-full h-12 sm:h-14 pl-10 rounded-xl bg-muted/50 border-border text-sm font-medium">
                                                    <SelectValue placeholder="Parking" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[0, 1, 2, 3].map((n) => (
                                                        <SelectItem key={n} value={String(n)} className="font-semibold">
                                                            {n === 0 ? 'No Parking' : `${n} Space${n > 1 ? 's' : ''}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-4">
                                        Amenities
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {amenityOptions.map((amenity) => (
                                            <button
                                                key={amenity}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity)}
                                                className={`px-4 py-2.5 rounded-full border text-xs font-semibold tracking-wide transition-all ${formData.amenities.includes(amenity)
                                                    ? "border-accent-500 bg-accent-500 text-primary-950"
                                                    : "border-border text-foreground/80 hover:border-accent-400/50"
                                                    }`}
                                            >
                                                {amenity}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Connectivity — nearby infrastructure */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-1">
                                        Connectivity
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-4 font-light">
                                        Select nearby infrastructure so buyers can find this property via the homepage connectivity filters.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {connectivityOptions.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleConnectivity(item)}
                                                className={`px-4 py-2.5 rounded-full border text-xs font-semibold tracking-wide transition-all ${formData.connectivity.includes(item)
                                                    ? "border-accent-500 bg-accent-500 text-primary-950"
                                                    : "border-border text-foreground/80 hover:border-accent-400/50"
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Collection flags — power the listing "Quick Filters" */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-1">
                                        Property Highlights
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-4 font-light">
                                        These appear as quick filters buyers can use to find your property.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                Property Age (years)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 0 for newly built"
                                                value={formData.age}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, age: e.target.value })
                                                }
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 sm:py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 text-sm font-medium text-foreground transition-all hover:border-accent-400/50"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, isLuxury: !prev.isLuxury }))}
                                                className={`w-full px-4 py-3 sm:py-4 rounded-xl border text-xs font-semibold tracking-wide transition-all ${formData.isLuxury
                                                    ? "border-accent-500 bg-accent-500 text-primary-950"
                                                    : "border-border text-foreground/80 hover:border-accent-400/50"
                                                    }`}
                                            >
                                                Luxury Collection
                                            </button>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, gatedCommunity: !prev.gatedCommunity }))}
                                                className={`w-full px-4 py-3 sm:py-4 rounded-xl border text-xs font-semibold tracking-wide transition-all ${formData.gatedCommunity
                                                    ? "border-accent-500 bg-accent-500 text-primary-950"
                                                    : "border-border text-foreground/80 hover:border-accent-400/50"
                                                    }`}
                                            >
                                                Gated Community
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Fields */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-4">
                                        Location Details
                                    </label>
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                            Google Maps URL or Coordinates
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Paste Google Maps link or 'latitude,longitude'"
                                            onBlur={async (e) => {
                                                const input = e.target.value.trim();
                                                if (!input) return;

                                                const coords = parseGoogleMapsUrl(input);
                                                if (coords) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        latitude: coords.lat.toString(),
                                                        longitude: coords.lng.toString(),
                                                    }));

                                                    // Get location details from coordinates
                                                    const location = await getLocationFromCoordinates(coords.lat, coords.lng);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        city: location.city || prev.city,
                                                        state: location.state || prev.state,
                                                        pincode: location.pincode || prev.pincode,
                                                    }));
                                                }
                                            }}
                                            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, city: e.target.value })
                                                }
                                                placeholder="e.g., Bangalore"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, state: e.target.value })
                                                }
                                                placeholder="e.g., Karnataka"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                Pincode
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.pincode}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, pincode: e.target.value })
                                                }
                                                placeholder="e.g., 560001"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                Latitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.latitude}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, latitude: e.target.value })
                                                }
                                                placeholder="e.g., 12.9716"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/80 mb-2">
                                                Longitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.longitude}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, longitude: e.target.value })
                                                }
                                                placeholder="e.g., 77.5946"
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-muted-foreground font-semibold hover:text-foreground transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-colors shadow-sm"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-4">
                                        Property Photos
                                    </label>

                                    {/* Existing Photos */}
                                    {existingPhotos.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Existing Photos</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {existingPhotos.map((photo) => (
                                                    <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                                        <img
                                                            src={process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') + '/' + photo.image_url.replace(/\\/g, '/')}
                                                            alt="property"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (confirm("Delete this photo?")) {
                                                                    try {
                                                                        await propertyAPI.deleteImage(propertyId!, photo.id);
                                                                        setExistingPhotos(existingPhotos.filter(p => p.id !== photo.id));
                                                                    } catch (e) { console.error("Failed to delete photo", e); }
                                                                }
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-accent-400/60 transition-colors cursor-pointer relative">
                                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="font-semibold text-muted-foreground mb-2">
                                            Drag & drop new photos here
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            or click to browse (max 10 photos)
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    {formData.photos.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {formData.photos.map((photo, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-lg">
                                                    <span className="truncate max-w-[150px]">{photo.name}</span>
                                                    <button type="button" onClick={() => {
                                                        const newPhotos = [...formData.photos];
                                                        newPhotos.splice(index, 1);
                                                        setFormData({ ...formData, photos: newPhotos });
                                                    }} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Property Videos (F22) */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2">
                                        Property Videos
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-4 font-light">
                                        MP4 or MOV, up to 100MB each.
                                    </p>

                                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent-400/60 transition-colors cursor-pointer relative">
                                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                                        <p className="font-semibold text-muted-foreground mb-1">
                                            Upload property videos
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            click to browse (MP4 / MOV, max 100MB)
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="video/mp4,video/quicktime"
                                            onChange={handleVideoChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>

                                    {/* Video previews */}
                                    {videoPreviews.length > 0 && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {videoPreviews.map((src, index) => (
                                                <div key={index} className="relative rounded-xl overflow-hidden bg-muted">
                                                    <video
                                                        src={src}
                                                        controls
                                                        className="w-full h-40 object-cover"
                                                    />
                                                    <div className="flex items-center justify-between px-3 py-2">
                                                        <span className="truncate max-w-[150px] text-xs font-semibold text-foreground/80">
                                                            {formData.videos[index]?.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVideo(index)}
                                                            className="text-red-500 hover:text-red-700 font-bold text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload progress */}
                                    {isLoading && formData.videos.length > 0 && videoProgress > 0 && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                                                <span>Uploading videos…</span>
                                                <span>{videoProgress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-500 transition-all duration-200"
                                                    style={{ width: `${videoProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-3">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        placeholder="Describe your property in detail..."
                                        rows={5}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-5 py-4 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20 transition-all text-sm font-medium text-foreground resize-none"
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="text-muted-foreground font-semibold hover:text-foreground transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Submitting..." : editMode ? "Update Property" : "Submit Property"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    );
}