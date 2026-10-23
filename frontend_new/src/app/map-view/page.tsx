"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  List,
  Map as MapIcon,
  X,
  Search,
  SlidersHorizontal,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
} from "lucide-react";
import { Property } from "@/types";
import { propertyAPI } from "@/utils/api_client";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { analytics } from "@/utils/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MapComponent = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_FILTERS: FilterState = {
  listing_type: "rent",
  type: "",
  min_price: "",
  max_price: "",
  bedrooms: "",
  furnished: "",
  amenities: [],
};

function MapViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCircle, setSearchCircle] = useState<{ center: [number, number]; radius: number } | null>(null);
  const [radius, setRadius] = useState("15");
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    listing_type: (searchParams.get("listing_type") as any) || "rent",
  });
  const [filterLoading, setFilterLoading] = useState(false);

  // Filters drawer behaves like an overlay: Escape closes it (backdrop click handled below).
  useModalDismiss(showFilters, () => setShowFilters(false));

  // Map-first on phones/tablets; side-by-side list on desktop.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setShowList(false);
    }
  }, []);

  // Count of non-default filters — drives the badge on the Filters button.
  const activeFilterCount =
    [filters.type, filters.min_price, filters.max_price, filters.bedrooms, filters.city]
      .filter(Boolean).length +
    (filters.furnished !== "" ? 1 : 0) +
    (filters.amenities?.length || 0);

  useEffect(() => {
    loadProperties();
    analytics.pageView("/map-view");
  }, [filters]);

  const applyFiltersToProperties = (propertiesToFilter: Property[]) => {
    return propertiesToFilter.filter((property) => {
      if (filters.city && property.city) {
        const filterCity = filters.city.toLowerCase().trim();
        const propertyCity = property.city.toLowerCase().trim();
        if (!propertyCity.includes(filterCity) && !filterCity.includes(propertyCity)) {
          return false;
        }
      }
      if (filters.min_price && property.price < parseFloat(filters.min_price)) return false;
      if (filters.max_price && property.price > parseFloat(filters.max_price)) return false;
      if (filters.listing_type && property.listing_type !== filters.listing_type) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.bedrooms && property.bedrooms !== parseInt(filters.bedrooms)) return false;
      if (filters.furnished !== "" && property.furnished !== filters.furnished) return false;
      if (filters.amenities.length > 0) {
        const propertyAmenities = property.amenities || [];
        const hasAllAmenities = filters.amenities.every((amenity) =>
          propertyAmenities.some((pa) => pa.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }
      return true;
    });
  };

  const loadProperties = async () => {
    try {
      setFilterLoading(true);
      const searchFilters: any = {};
      if (filters.listing_type) searchFilters.listing_type = filters.listing_type;
      if (filters.type) searchFilters.type = filters.type;
      if (filters.min_price) searchFilters.min_price = parseFloat(filters.min_price);
      if (filters.max_price) searchFilters.max_price = parseFloat(filters.max_price);
      if (filters.bedrooms) searchFilters.bedrooms = parseInt(filters.bedrooms);

      const response = await propertyAPI.search(searchFilters);
      const allProperties = response.data;
      setProperties(allProperties);
      setFilteredProperties(applyFiltersToProperties(allProperties));
    } catch (error) {
      console.error("Failed to load properties:", error);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      setLoading(true);
      analytics.searchPerformed({ query: searchQuery, radius });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const center: [number, number] = [latNum, lonNum];
        const radiusKm = parseFloat(radius) || 15;

        setSearchCircle({ center, radius: radiusKm * 1000 });

        const searchResponse = await propertyAPI.radiusSearch(latNum, lonNum, radiusKm, {
          listing_type: filters.listing_type || undefined,
          type: filters.type || undefined,
          min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
          max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
          bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
        });

        const filtered = applyFiltersToProperties(searchResponse.data);
        setFilteredProperties(filtered);
        analytics.event("radius_search_complete", { results: filtered.length });
      }
    } catch (error) {
      console.error("Search failed:", error);
      analytics.event("search_error", { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleGeofenceSearch = async (coordinates: number[][]) => {
    try {
      setLoading(true);
      const response = await propertyAPI.geofenceSearch(coordinates as any, {
        listing_type: filters.listing_type || undefined,
        type: filters.type || undefined,
        min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
        max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
      });
      setFilteredProperties(applyFiltersToProperties(response.data));
    } catch (error) {
      console.error("Geofence search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => setFilters(newFilters);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchCircle(null);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchCircle(null);
    setSearchQuery("");
    loadProperties();
  };

  const resultCount = filteredProperties.length;

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-foreground">
        {/* ===== Top Bar ===== */}
        <header className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border shadow-sm">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2.5 sm:gap-3">
            {/* Row 1 — brand + actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-primary-900 dark:hover:text-accent-400 hover:bg-muted transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="RightVillaNest home">
                <div className="w-9 h-9 bg-primary-900 dark:bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/20 dark:shadow-accent-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-accent-400 dark:text-primary-900 font-black text-base">R</span>
                </div>
                <div className="hidden md:block leading-none">
                  <h1 className="font-black text-base text-primary-900 dark:text-white tracking-tight">
                    Map Search
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {resultCount} {resultCount === 1 ? "home" : "homes"}
                  </p>
                </div>
              </Link>

              <div className="flex-1" />

              {/* Result count chip (mobile / tablet) */}
              <span className="md:hidden px-3 py-1.5 rounded-full bg-muted text-xs font-black text-foreground/80 shrink-0">
                {resultCount} {resultCount === 1 ? "home" : "homes"}
              </span>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(true)}
                className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold text-foreground/80 transition-colors shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-accent-600 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-900 leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* List / Map toggle */}
              <button
                onClick={() => setShowList((v) => !v)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 text-sm font-bold hover:bg-primary-800 dark:hover:bg-accent-400 transition-colors shrink-0"
              >
                {showList ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
                <span className="hidden sm:inline">{showList ? "Map" : "List"}</span>
              </button>
            </div>

            {/* Row 2 — search */}
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search a city or locality…"
                  aria-label="Search location"
                  className="w-full pl-10 pr-3 py-2.5 bg-muted border border-border rounded-xl outline-none text-sm font-bold text-foreground placeholder:text-slate-400 placeholder:font-medium focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 pl-2.5 sm:pl-3 bg-muted border border-border rounded-xl shrink-0">
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-400">Within</span>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger
                    aria-label="Search radius"
                    className="w-[90px] h-9 border-0 bg-transparent text-sm font-bold focus:ring-0 focus:ring-offset-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="15">15 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="30">30 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={handleSearch}
                disabled={!searchQuery}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-black text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Search className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {searchCircle && (
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold text-sm shrink-0"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Results panel — side-by-side on lg, full overlay on mobile */}
          <aside
            className={`${showList ? "flex" : "hidden"} flex-col bg-card
              absolute inset-0 z-[650]
              lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:border-r lg:border-slate-200 lg:dark:border-slate-800`}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-black text-foreground">
                {loading ? "Searching…" : `${resultCount} ${resultCount === 1 ? "home" : "homes"} in view`}
              </p>
              <button
                onClick={() => setShowList(false)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground/80"
              >
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)
              ) : resultCount === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="font-black text-foreground mb-1">No homes here</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Try widening your filters or searching a different area.
                  </p>
                  <button
                    onClick={() => {
                      handleResetFilters();
                      loadProperties();
                    }}
                    className="px-5 py-2.5 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-800 dark:hover:bg-accent-400 transition-colors"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    onMouseEnter={() => setSelectedProperty(property)}
                    className={`rounded-[2rem] transition-all ${
                      selectedProperty?.id === property.id
                        ? "ring-2 ring-accent-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                        : ""
                    }`}
                  >
                    <PropertyCard property={property} index={0} />
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Map */}
          <div className="flex-1 relative min-w-0">
            <MapComponent
              properties={filteredProperties}
              enableGeofence={true}
              onGeofenceSearch={handleGeofenceSearch}
              onPropertySelect={(p) => setSelectedProperty(p)}
              searchCenter={searchCircle?.center}
              searchRadius={searchCircle?.radius}
              selectedPropertyId={selectedProperty?.id || null}
              center={
                selectedProperty?.lat && selectedProperty?.lng
                  ? [selectedProperty.lat, selectedProperty.lng]
                  : searchCircle?.center
              }
            />

            {/* Compact selected-property card */}
            {selectedProperty && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-md z-[600]">
                <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex">
                  {/* Image */}
                  <div className="relative w-28 sm:w-36 shrink-0 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900/40">
                    {selectedProperty.images && selectedProperty.images[0] ? (
                      <img
                        src={selectedProperty.images[0].image_url}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🏡</div>
                    )}
                    <span className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-accent-600 dark:text-accent-400">
                      {selectedProperty.listing_type}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-black text-sm sm:text-base text-foreground line-clamp-1 leading-tight">
                        {selectedProperty.title}
                      </h3>
                      <button
                        onClick={() => setSelectedProperty(null)}
                        aria-label="Close"
                        className="p-1 -mt-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-muted transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5 mb-2">
                      <MapPin className="w-3 h-3 text-accent-500 shrink-0" />
                      <span className="truncate min-w-0">
                        {selectedProperty.city}, {selectedProperty.state || "India"}
                      </span>
                    </p>

                    <p className="font-display font-black text-lg text-accent-600 dark:text-accent-400 mb-2 leading-none">
                      ₹{(selectedProperty.price / 100000).toFixed(2)}
                      <span className="text-xs text-slate-400 ml-0.5">L</span>
                    </p>

                    <div className="flex items-center gap-2.5 mb-3 text-[11px] font-bold text-muted-foreground flex-wrap">
                      {selectedProperty.bedrooms != null && (
                        <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{selectedProperty.bedrooms} BHK</span>
                      )}
                      {selectedProperty.bathrooms != null && (
                        <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{selectedProperty.bathrooms}</span>
                      )}
                      {selectedProperty.area != null && (
                        <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{selectedProperty.area} sqft</span>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/properties/${selectedProperty.id}`)}
                      className="w-full py-2.5 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-800 dark:hover:bg-accent-400 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters drawer */}
          {showFilters && (
            <>
              <div
                className="absolute inset-0 z-[700] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <div
                className="absolute inset-y-0 left-0 z-[710] w-full sm:w-[380px] bg-card shadow-2xl flex flex-col animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
              >
                <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-accent-500" /> Filters
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  <AdvancedFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    loading={filterLoading}
                  />
                </div>
                <div className="shrink-0 p-4 border-t border-border">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full py-3 bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary-800 dark:hover:bg-accent-400 transition-colors"
                  >
                    Show {resultCount} {resultCount === 1 ? "home" : "homes"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function MapViewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-900 dark:border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MapViewContent />
    </Suspense>
  );
}
