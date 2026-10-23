"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Building2, ChevronDown, Check, AlertCircle, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_LOCATIONS } from "@/data/cities";

const propertyTypes = ["Buy", "Rent"];

// Values (lowercased) must match the backend PropertyType enum so the filter
// actually matches data. See backend/app/models/property.py.
const categoryOptions = [
    { value: "All Types", label: "All Types" },
    { value: "Apartment", label: "Apartment" },
    { value: "Villa", label: "Villa" },
    { value: "House", label: "House" },
    { value: "Studio", label: "Studio" },
    { value: "Plot", label: "Plot" },
];

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Determine initial active type
    const initialListingType = searchParams.get("listing_type");
    const initialPropertyType = searchParams.get("property_type");

    let defaultActiveType = "Buy";
    if (initialListingType === "rent") defaultActiveType = "Rent";

    // Determine initial category
    let defaultCategory = "All Types";
    if (initialPropertyType) {
        const option = categoryOptions.find(c => c.value.toLowerCase() === initialPropertyType.toLowerCase());
        if (option) defaultCategory = option.label;
    }

    const [activeType, setActiveType] = useState(defaultActiveType);
    const [location, setLocation] = useState(searchParams.get("city") || "");
    const [category, setCategory] = useState(defaultCategory);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<typeof ALL_LOCATIONS>([]);
    const [locationError, setLocationError] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const locationDropdownRef = useRef<HTMLDivElement>(null);

    // Sync input when URL changes via back navigation or other events
    useEffect(() => {
        setLocation(searchParams.get("city") || "");
    }, [searchParams]);

    // Handle location input change with autocomplete
    const handleLocationChange = (value: string) => {
        setLocation(value);
        setLocationError("");

        if (value.trim().length > 0) {
            // Filter locations based on input - show all matches
            const filtered = ALL_LOCATIONS.filter(loc =>
                loc.displayName.toLowerCase().includes(value.toLowerCase()) ||
                loc.name.toLowerCase().includes(value.toLowerCase()) ||
                loc.city.toLowerCase().includes(value.toLowerCase())
            );

            setLocationSuggestions(filtered);
            setIsLocationDropdownOpen(filtered.length > 0);
        } else {
            setLocationSuggestions([]);
            setIsLocationDropdownOpen(false);
        }
    };

    const handleLocationSelect = (locationData: typeof ALL_LOCATIONS[0]) => {
        setLocation(locationData.name);
        setIsLocationDropdownOpen(false);
        setLocationError("");
    };

    const handleNearMeSearch = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Use reverse geocoding to find nearest city
                // For now, we'll set a generic "Near Me" location and redirect to map view
                setLocation("Near Me");
                setGettingLocation(false);

                // Redirect to map view with GPS coordinates
                const params = new URLSearchParams();
                params.set("lat", latitude.toString());
                params.set("lng", longitude.toString());
                params.set("radius", "5"); // Default 5km radius

                if (activeType === "Buy") {
                    params.set("listing_type", "sale");
                } else if (activeType === "Rent") {
                    params.set("listing_type", "rent");
                }

                if (category !== "All Types") {
                    params.set("property_type", category.toLowerCase());
                }

                router.push(`/map-view?${params.toString()}`);
            },
            (error) => {
                setGettingLocation(false);
                let errorMessage = "Unable to get your location";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please enable location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out";
                        break;
                }

                setLocationError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
                setIsLocationDropdownOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsDropdownOpen(false);
                setIsLocationDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleSearch = () => {
        // Validate location is entered
        if (!location.trim()) {
            setLocationError("Please enter a location to search properties");
            return;
        }

        const params = new URLSearchParams();

        // Map activeType to backend listing_type
        if (activeType === "Buy") {
            params.set("listing_type", "sale");
        } else if (activeType === "Rent") {
            params.set("listing_type", "rent");
        }

        // Map category to backend property_type
        if (category !== "All Types") {
            params.set("property_type", category.toLowerCase());
        }

        // Add location as city filter
        params.set("city", location.trim());

        const queryString = params.toString();
        router.push(`/properties${queryString ? `?${queryString}` : ""}`);
    };

    const handleCategorySelect = (value: string) => {
        setCategory(value);
        setIsDropdownOpen(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/60 max-w-5xl mx-auto relative z-raised">
            {/* Property Type Tabs */}
            <div className="flex mb-4 px-1">
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200/20">
                    {propertyTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${activeType === type
                                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Fields */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
                {/* Location Input with Autocomplete */}
                <div className="flex-[2] flex gap-2" ref={locationDropdownRef}>
                    <div className="relative flex-1">
                        <div className={`flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 border px-5 py-4 rounded-2xl transition-all duration-300 ${
                            locationError
                                ? "border-red-500 ring-4 ring-red-500/10"
                                : isLocationDropdownOpen
                                ? "border-emerald-500 ring-4 ring-emerald-500/10"
                                : "border-slate-200 dark:border-slate-800"
                        } focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 h-full`}>
                            <MapPin className={`w-5 h-5 shrink-0 ${locationError ? "text-red-500" : "text-emerald-500"}`} />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => handleLocationChange(e.target.value)}
                                onFocus={() => {
                                    if (location.trim() && locationSuggestions.length > 0) {
                                        setIsLocationDropdownOpen(true);
                                    }
                                }}
                                placeholder="Search locality or city…"
                                className="bg-transparent flex-1 outline-none text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            {locationError && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        </div>

                        {/* Location Autocomplete Dropdown */}
                        <AnimatePresence>
                            {isLocationDropdownOpen && locationSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-dropdown"
                                >
                                    <div className="max-h-[165px] overflow-y-auto py-1.5 custom-scrollbar">
                                        {locationSuggestions.map((loc, index) => (
                                            <button
                                                key={`${loc.city}-${loc.name}-${index}`}
                                                onClick={() => handleLocationSelect(loc)}
                                                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors duration-150 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 touch-manipulation"
                                            >
                                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate w-full">
                                                        {loc.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 truncate w-full">
                                                        {loc.city}, {loc.state}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Separate Near Me button outside the input field */}
                    <button
                        onClick={handleNearMeSearch}
                        disabled={gettingLocation}
                        type="button"
                        className="flex items-center gap-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-450 text-xs font-semibold rounded-2xl transition-all duration-200 shrink-0 h-[54px] md:h-auto"
                        title="Use my current location"
                    >
                        <Navigation className={`w-4 h-4 ${gettingLocation ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Near Me</span>
                    </button>
                </div>

                {/* Location Error Message */}
                {locationError && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 mt-2 flex items-center gap-2 text-red-500 text-xs font-semibold"
                    >
                        <AlertCircle className="w-3 h-3" />
                        {locationError}
                    </motion.div>
                )}

                {/* Custom Property Type Dropdown */}
                <div className="flex-1 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full h-full flex items-center justify-between gap-3 bg-slate-55 bg-slate-50 dark:bg-slate-800/30 border px-5 py-4 rounded-2xl transition-all duration-300 ${isDropdownOpen
                            ? "border-emerald-500 ring-4 ring-emerald-500/10"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {category}
                            </span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* Dropdown Menu - Opens Upward */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-dropdown"
                            >
                                <div className="max-h-[300px] overflow-y-auto py-1.5 custom-scrollbar">
                                    {categoryOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleCategorySelect(option.value)}
                                            className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-colors duration-150 text-left touch-manipulation ${category === option.value
                                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                                                }`}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {category === option.value && (
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search Button */}
                <motion.button
                    onClick={handleSearch}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-8 py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-emerald-500/50"
                >
                    <Search className="w-5 h-5" />
                    <span className="text-sm">Search</span>
                </motion.button>
            </div>
        </div>
    );
}

