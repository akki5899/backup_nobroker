"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { propertyAPI } from "@/utils/api_client";
import { Property } from "@/types";
import { Search } from "lucide-react";

// Dynamically import Map component to avoid SSR issues with MapLibre GL
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
});

export default function GeofenceSearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Load all properties initially so the map has markers to draw around.
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await propertyAPI.search({ limit: 100 });
        const data = response.data;
        setProperties(Array.isArray(data) ? data : (data as any).items || []);
      } catch (error) {
        console.error("Failed to load properties", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Polygon drawn on the map -> geofence search. coordinates are [[lng, lat], ...].
  const handleGeofenceSearch = async (coordinates: number[][]) => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await propertyAPI.geofenceSearch(coordinates as Array<[number, number]>);
      const data = response.data;
      setProperties(Array.isArray(data) ? data : (data as any).items || []);
    } catch (error) {
      console.error("Geofence search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col md:flex-row">
      {/* Sidebar / Results */}
      <div className="w-full md:w-96 bg-card border-r border-border flex flex-col h-full z-raised shadow-xl">
        <div className="p-6 border-b border-border">
          <p className="eyebrow text-accent-600 mb-3">Discover</p>
          <h1 className="font-display text-2xl text-foreground mb-2">
            Map Search
          </h1>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Use <span className="font-semibold text-accent-600">Draw Area</span> on the map to outline a
            region and find properties inside it.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground font-light animate-pulse">
              {searched ? "Searching area..." : "Loading properties..."}
            </div>
          ) : properties.length > 0 ? (
            properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedId(property.id)}
                className={`bg-card p-4 rounded-2xl border transition-colors duration-500 cursor-pointer ${
                  selectedId === property.id
                    ? "border-accent-500"
                    : "border-border hover:border-accent-400/50"
                }`}
              >
                <h3 className="font-display text-base text-foreground line-clamp-1">{property.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 font-light">{property.city}</p>
                <p className="font-semibold text-accent-600">₹{property.price.toLocaleString()}</p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-accent-600">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-1">
                {searched ? "Nothing in this area" : "No properties found"}
              </h3>
              <p className="text-sm text-muted-foreground font-light">
                {searched ? "Try drawing a different region on the map." : "Adjust your search to see results."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          properties={properties}
          enableGeofence
          onGeofenceSearch={handleGeofenceSearch}
          selectedPropertyId={selectedId}
          onPropertySelect={(p) => setSelectedId(p.id)}
        />
      </div>
    </div>
  );
}
