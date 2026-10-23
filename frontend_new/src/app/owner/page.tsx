"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { userAPI, propertyAPI } from "@/utils/api_client";
import { Property } from "@/types";
import PropertyCard from "@/components/PropertyCard";
import Link from "next/link";
import { Plus, Home } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function OwnerDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        const response = await userAPI.getMyProperties();
        setProperties(response.data);
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProperties();
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 sm:py-16 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-10"
        >
          <div>
            <p className="eyebrow text-accent-600 mb-3">Dashboard</p>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground">
              My Properties
            </h1>
          </div>
          <Link
            href="/post-property"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-primary-950 px-6 py-3.5 rounded-full font-semibold tracking-wide text-sm transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
            Post New Property
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <ScrollReveal variant="scale">
            <div className="text-center py-20 px-6 bg-card rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center text-accent-600 mx-auto mb-6">
                <Home className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl text-foreground mb-2">
                No properties listed yet
              </h3>
              <p className="text-muted-foreground font-light mb-7 max-w-md mx-auto">
                Start listing your properties to reach potential buyers and tenants.
              </p>
              <Link
                href="/post-property"
                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-primary-950 px-6 py-3.5 rounded-full font-semibold tracking-wide text-sm transition-all"
              >
                <Plus className="w-5 h-5" />
                Post your first property
              </Link>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
