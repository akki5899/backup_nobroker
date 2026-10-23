"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Map, X, SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import AnimatedSection from "@/components/AnimatedSection";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import { Property } from "@/types";
import { propertyAPI } from "@/utils/api_client";
import PropertySkeleton from "@/components/PropertySkeleton";
import SearchBar from "@/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyListingPageProps {
  type: "Buy" | "Rent" | "Commercial" | "Plot";
  title: string;
}

// Quick filter label -> extra params merged into the backend /properties search.
// metro/IT hubs reuse the connectivity near_* columns; the rest map to dedicated flags.
const QUICK_FILTER_PARAMS: Record<string, Record<string, string>> = {
  "Under 30m to Metro": { connectivity: "metro" },
  "Near IT Parks": { connectivity: "it_hubs" },
  "Luxury Collection": { is_luxury: "true" },
  "Newly Built": { newly_built: "true" },
  "Gated Community": { gated_community: "true" },
};

const QUICK_FILTERS = Object.keys(QUICK_FILTER_PARAMS);

const DEFAULT_FILTERS: FilterState = {
  listing_type: 'rent',
  type: '',
  min_price: '',
  max_price: '',
  bedrooms: '',
  furnished: '',
  amenities: [],
  connectivity: [],
  bathrooms: '',
  min_area: '',
  parking: '',
  is_luxury: false,
  gated_community: false,
};

function PropertyListingContent({ type, title }: PropertyListingPageProps) {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');

  // Build initial filters from URL search params (from SearchBar) or fall back to prop-based defaults
  const buildInitialFilters = useCallback((): FilterState => {
    const urlListingType = searchParams.get("listing_type") as FilterState["listing_type"] | null;
    const urlPropertyType = searchParams.get("property_type") as FilterState["type"] | null;
    const urlCity = searchParams.get("city");
    const urlQ = searchParams.get("q");
    const urlBedrooms = searchParams.get("bedrooms");
    // Connectivity keys, e.g. ?connectivity=metro,malls
    const urlConnectivity = searchParams.get("connectivity");

    return {
      ...DEFAULT_FILTERS,
      listing_type: urlListingType || (type === "Buy" ? "sale" : type === "Plot" ? "sale" : "rent"),
      type: urlPropertyType || (type === "Plot" ? "plot" : ""),
      city: urlCity || "",
      q: urlQ || "",
      bedrooms: urlBedrooms || "",
      connectivity: urlConnectivity
        ? urlConnectivity.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
    };
  }, [searchParams, type]);

  const [filters, setFilters] = useState<FilterState>(buildInitialFilters);

  // Re-initialize filters when URL params change (e.g., new search from SearchBar)
  useEffect(() => {
    setFilters(buildInitialFilters());
    setPage(1);
  }, [searchParams, buildInitialFilters]);

  const applyFiltersToProperties = useCallback((propertiesToFilter: Property[]) => {
    return propertiesToFilter.filter((property) => {
      // Location/City filter
      if (filters.city && property.city) {
        const filterCity = filters.city.toLowerCase().trim();
        const propertyCity = property.city.toLowerCase().trim();
        if (!propertyCity.includes(filterCity) && !filterCity.includes(propertyCity)) {
          return false;
        }
      }

      // Price range
      if (filters.min_price && property.price < parseFloat(filters.min_price)) return false;
      if (filters.max_price && property.price > parseFloat(filters.max_price)) return false;

      // Listing type
      if (filters.listing_type && property.listing_type !== filters.listing_type) return false;

      // Property type
      if (filters.type && property.type !== filters.type) return false;

      // Bedrooms
      if (filters.bedrooms && property.bedrooms !== parseInt(filters.bedrooms)) return false;

      // Furnished
      if (filters.furnished !== '' && property.furnished !== filters.furnished) return false;

      // Amenities, connectivity, area/bathrooms/parking, luxury/gated and quick
      // filters are all applied server-side in loadProperties. They are NOT
      // re-checked here: the API response exposes amenities as individual
      // boolean columns (not an `amenities` array), so a client-side array
      // check would wrongly drop every result.

      return true;
    });
  }, [filters]);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const searchFilters: any = {
        listing_type: filters.listing_type,
        page,
        limit,
      };

      if (filters.type) searchFilters.property_type = filters.type;
      if (filters.city) searchFilters.city = filters.city;
      if (filters.q) searchFilters.q = filters.q;
      if (filters.min_price) searchFilters.min_price = parseFloat(filters.min_price);
      if (filters.max_price) searchFilters.max_price = parseFloat(filters.max_price);
      if (filters.bedrooms) searchFilters.bedrooms = parseInt(filters.bedrooms);
      if (filters.bathrooms) searchFilters.bathrooms = parseInt(filters.bathrooms);
      if (filters.min_area) searchFilters.min_area = parseFloat(filters.min_area);
      if (filters.age) searchFilters.age = parseInt(filters.age);
      if (filters.total_floors) searchFilters.total_floors = parseInt(filters.total_floors);
      if (filters.furnished !== '' && filters.furnished !== undefined) searchFilters.furnished = filters.furnished;
      if (filters.parking) searchFilters.parking = true;
      if (filters.is_luxury) searchFilters.is_luxury = true;
      if (filters.gated_community) searchFilters.gated_community = true;
      if (filters.amenities && filters.amenities.length > 0) {
        searchFilters.amenities = filters.amenities;
      }

      // Collect connectivity keys from the sidebar filters and (optionally) the
      // selected quick filter, so both apply together server-side.
      const connectivityKeys = new Set<string>(filters.connectivity || []);

      if (selectedQuickFilter) {
        const params = QUICK_FILTER_PARAMS[selectedQuickFilter] || {};
        for (const [key, value] of Object.entries(params)) {
          if (key === "connectivity") {
            connectivityKeys.add(value);
          } else {
            searchFilters[key] = value;
          }
        }
      }

      if (connectivityKeys.size > 0) {
        searchFilters.connectivity = Array.from(connectivityKeys).join(",");
      }

      const response = await propertyAPI.search(searchFilters);
      const data = response.data;
      const allProperties = Array.isArray(data) ? data : (data as any).items || [];
      setProperties(allProperties);

      // Apply client-side filters
      const filtered = applyFiltersToProperties(allProperties);
      setFilteredProperties(filtered);
      setError("");
    } catch (err) {
      console.error("Failed to fetch properties", err);
      setError("Failed to load properties. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, selectedQuickFilter, applyFiltersToProperties]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);


  // Sort properties based on selected sort option
  const sortedFilteredProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    switch (sortBy) {
      case 'price_asc': return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc': return sorted.sort((a, b) => b.price - a.price);
      case 'oldest': return sorted.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'newest': default: return sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  }, [filteredProperties, sortBy]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      listing_type: type === "Buy" ? "sale" : type === "Plot" ? "sale" : "rent",
      type: type === "Plot" ? "plot" : "",
    });
    setSelectedQuickFilter(null);
    setPage(1);
  };

  return (
    <div className="pt-8 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <p className="eyebrow text-emerald-600 mb-3 font-semibold">The Collection</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground mb-4 truncate" title={filters.city ? `${title} in ${filters.city}` : title}>
            {filters.city ? `${title} in ${filters.city.charAt(0).toUpperCase() + filters.city.slice(1)}` : title}
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 engrave-top pt-4">
            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="stats-value text-foreground text-base font-bold">{sortedFilteredProperties.length}</span> {sortedFilteredProperties.length === 1 ? "home" : "homes"} found
              </p>
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold flex items-center gap-2 transition-all shrink-0 shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{showFilters ? "Hide" : "Show"} Filters</span>
                <span className="xs:hidden">{showFilters ? "Hide" : "Filters"}</span>
              </button>
            </div>
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="eyebrow text-[9px] text-slate-500 dark:text-slate-450 hidden md:inline shrink-0 font-semibold">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium hover:border-emerald-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mb-8 sm:mb-10 mt-4 sm:mt-6">
          <div className="w-full">
            <SearchBar />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setSelectedQuickFilter(selectedQuickFilter === filter ? null : filter);
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${selectedQuickFilter === filter
                ? "bg-emerald-600 dark:bg-emerald-500 text-white border-transparent shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* Filters Sidebar */}
          <div
            className={`${showFilters ? "block" : "hidden"
              } lg:block w-full lg:w-[300px] xl:w-[340px] flex-shrink-0`}
          >
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
              <AdvancedFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                loading={loading}
              />
            </div>
          </div>

          {/* Properties Grid */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-700 dark:text-red-400 font-medium text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                  <Map className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-display text-foreground mb-3">
                  No homes match just yet
                </h3>
                <p className="text-slate-550 dark:text-slate-400 font-light mb-8 max-w-sm mx-auto leading-relaxed">
                  We couldn&rsquo;t find anything matching your exact criteria. Try widening your filters a little.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold tracking-wide transition-all shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Properties Grid */}
                <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8">
                  {sortedFilteredProperties.map((property, index) => (
                    <div key={property.id} className="h-full">
                       <PropertyCard property={property} index={index} />
                    </div>
                  ))}
                </AnimatedSection>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-3 mt-14">
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full font-semibold tracking-wide text-xs text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                    >
                      Previous
                    </button>
                  )}
                  <div className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold tracking-wide text-xs shadow-sm">
                    Page {page}
                  </div>
                  {properties.length === limit && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full font-semibold tracking-wide text-xs text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyListingPage(props: PropertyListingPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PropertyListingContent {...props} />
    </Suspense>
  );
}
