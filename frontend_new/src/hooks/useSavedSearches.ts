import { useState, useEffect } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  coordinates?: number[][];
  filters?: Record<string, any>;
  center?: [number, number];
  zoom?: number;
  createdAt: number;
  properties?: any[];
}

const STORAGE_KEY = 'saved_map_searches';

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  }, [searches]);

  const saveSearch = (search: Omit<SavedSearch, 'id' | 'createdAt'>) => {
    const newSearch: SavedSearch = {
      ...search,
      id: `search_${Date.now()}`,
      createdAt: Date.now()
    };
    setSearches([newSearch, ...searches]);
    return newSearch;
  };

  const updateSearch = (id: string, updates: Partial<SavedSearch>) => {
    setSearches(searches.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSearch = (id: string) => {
    setSearches(searches.filter(s => s.id !== id));
  };

  const loadSearch = (id: string) => {
    return searches.find(s => s.id === id);
  };

  return {
    searches,
    saveSearch,
    updateSearch,
    deleteSearch,
    loadSearch
  };
}

