import { useState, useCallback, useRef } from 'react';
import { propertyAPI } from '@/utils/api_client';
import { Property } from '@/types';

export interface MapFilters {
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: string;
  furnished?: boolean;
  parking?: boolean;
  balcony?: boolean;
  gym?: boolean;
  swimmingPool?: boolean;
  city?: string;
}

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const applyFilters = useCallback(async (newFilters: MapFilters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);
    setFilters(newFilters);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await propertyAPI.search(newFilters);
        setProperties(response.data || []);
      } catch (error) {
        console.error('Filter search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  const updateFilter = useCallback((filterKey: keyof MapFilters, value: any) => {
    setFilters((prev) => {
      const updated = { ...prev, [filterKey]: value };
      applyFilters(updated);
      return updated;
    });
  }, [applyFilters]);

  return {
    filters,
    properties,
    isLoading,
    applyFilters,
    updateFilter,
    resetFilters: () => {
      setFilters({});
      setProperties([]);
    }
  };
}

