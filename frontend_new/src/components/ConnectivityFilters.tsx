'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ConnectivityFiltersProps {
  onFilterChange: (filters: string[]) => void;
  selectedFilters: string[];
}

export default function ConnectivityFilters({ onFilterChange, selectedFilters }: ConnectivityFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['transport']);

  const filterCategories = {
    transport: {
      title: '🚆 Transport Connectivity',
      filters: [
        { id: 'metro', label: '🚇 Metro Nearby', description: 'Metro Connected Projects' },
        { id: 'bus', label: '🚌 Bus Nearby', description: 'Bus Connected Projects' },
        { id: 'railway', label: '🚂 Railway Station Nearby', description: 'Railway Station Connected Projects' },
        { id: 'airport', label: '✈️ Airport Access', description: 'Airport Connected Projects' },
        { id: 'highway', label: '🛣️ Highway Access', description: 'Highway / Main Road Connected Projects' }
      ]
    },
    education: {
      title: '🏫 Education & Healthcare',
      filters: [
        { id: 'schools', label: '🏫 Schools Nearby', description: 'Schools Connected Projects' },
        { id: 'colleges', label: '🎓 Colleges Nearby', description: 'Colleges & Universities Connected Projects' },
        { id: 'hospitals', label: '🏥 Hospitals Nearby', description: 'Hospitals Connected Projects' }
      ]
    },
    business: {
      title: '💼 Work & Business',
      filters: [
        { id: 'it_hubs', label: '💻 IT Hubs Nearby', description: 'Major IT Hubs Connected Projects' },
        { id: 'business_district', label: '🏢 Business District', description: 'Business District Connected Projects' },
        { id: 'commercial_hub', label: '🏬 Commercial Hub', description: 'Commercial Hub Connected Projects' }
      ]
    },
    lifestyle: {
      title: '🛍️ Lifestyle & Convenience',
      filters: [
        { id: 'malls', label: '🛍️ Malls Nearby', description: 'Mall & Shopping Center Connected Projects' },
        { id: 'entertainment', label: '🎭 Entertainment Zone', description: 'Entertainment Zone Connected Projects' },
        { id: 'restaurants', label: '🍽️ Restaurants Hub', description: 'Restaurants & Lifestyle Hub Connected Projects' }
      ]
    },
    environment: {
      title: '🌳 Environment & Leisure',
      filters: [
        { id: 'parks', label: '🌳 Parks Nearby', description: 'Parks & Green Spaces Connected Projects' },
        { id: 'sports', label: '⚽ Sports Facilities', description: 'Recreation & Sports Facility Connected Projects' },
        { id: 'weekend_getaway', label: '🏖️ Weekend Getaway', description: 'Weekend Getaway Connectivity' }
      ]
    },
    safety: {
      title: '🚓 Safety & Essentials',
      filters: [
        { id: 'emergency', label: '🚨 Emergency Services', description: 'Emergency Services Connected Projects' },
        { id: 'government', label: '🏛️ Government Offices', description: 'Government Office Connected Projects' }
      ]
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleFilterToggle = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId];
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connectivity Filters</h3>
        {selectedFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All ({selectedFilters.length})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(filterCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
            <button
              onClick={() => toggleSection(categoryKey)}
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
            >
              <span className="font-medium text-gray-900">{category.title}</span>
              {expandedSections.includes(categoryKey) ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.includes(categoryKey) && (
              <div className="mt-2 space-y-2 pl-2">
                {category.filters.map((filter) => (
                  <label
                    key={filter.id}
                    className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => handleFilterToggle(filter.id)}
                      className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {filter.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {filter.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Selected Filters:</div>
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filterId) => {
              const filter = Object.values(filterCategories)
                .flatMap(cat => cat.filters)
                .find(f => f.id === filterId);
              
              return filter ? (
                <span
                  key={filterId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {filter.label}
                  <button
                    onClick={() => handleFilterToggle(filterId)}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}