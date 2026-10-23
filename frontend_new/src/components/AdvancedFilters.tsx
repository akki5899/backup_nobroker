'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterBadge } from '@/components/ui/filter-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterState {
  listing_type: 'rent' | 'sale' | '';
  // Values must match the backend PropertyType enum (backend/app/models/property.py).
  type: 'apartment' | 'house' | 'villa' | 'studio' | 'plot' | 'office' | 'retail' | 'warehouse' | '';
  min_price: string;
  max_price: string;
  bedrooms: string;
  furnished: boolean | '';
  amenities: string[];
  connectivity?: string[];
  pricePresets?: string;
  age?: string;
  total_floors?: string;
  bathrooms?: string;
  min_area?: string;
  parking?: boolean | '';
  is_luxury?: boolean;
  gated_community?: boolean;
  city?: string;
  q?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  loading?: boolean;
}

const AMENITIES = [
    "Gym", "Pool", "Lift", "Security", "Power Backup", "Club House",
    "Garden", "Children Play Area", "Intercom", "Visitor Parking",
    "Mini Theatre", "Library/Reading Room", "Multipurpose/Community Hall",
    "Pet Park/Grooming", "EV Charging Stations", "Rainwater Harvesting",
    "Solar Panels", "24/7 Maintenance Staff", "CCTV Surveillance",
    "Fire Safety System", "Badminton/Squash Court", "Sauna/Steam Room",
    "Indoor Games Room", "Yoga/Meditation Room", "Jogging/Walking Track",
    "Outdoor Fitness Area"
];

// Connectivity options — value is the backend key (?connectivity=<key>), matching
// ALLOWED_CONNECTIVITY in backend/app/api/v1/properties.py.
const CONNECTIVITY_OPTIONS: { value: string; label: string }[] = [
    { value: "metro", label: "Metro" },
    { value: "bus", label: "Bus" },
    { value: "highway", label: "Highway" },
    { value: "schools", label: "Schools" },
    { value: "hospitals", label: "Hospitals" },
    { value: "airport", label: "Airport" },
    { value: "it_hubs", label: "IT Hubs" },
    { value: "malls", label: "Malls" },
];

export default function AdvancedFilters({
  filters,
  onFilterChange,
  onReset,
  loading = false,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handlePricePresetClick = (preset: string) => {
    let min = '';
    let max = '';

    switch (preset) {
      case 'budget':
        min = '0';
        max = '5000000';
        break;
      case 'economy':
        min = '5000000';
        max = '25000000';
        break;
      case 'premium':
        min = '25000000';
        max = '100000000';
        break;
      case 'luxury':
        min = '100000000';
        max = '';
        break;
    }

    onFilterChange({
      ...filters,
      min_price: min,
      max_price: max,
      pricePresets: preset,
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];

    onFilterChange({
      ...filters,
      amenities: newAmenities,
    });
  };

  const handleConnectivityToggle = (key: string) => {
    const current = filters.connectivity || [];
    const newConnectivity = current.includes(key)
      ? current.filter((c) => c !== key)
      : [...current, key];

    onFilterChange({
      ...filters,
      connectivity: newConnectivity,
    });
  };

  // Only count user-applied optional filters (NOT listing_type/type which are auto-set by page)
  const activeFilterCount = [
    filters.min_price,
    filters.max_price,
    filters.bedrooms,
    filters.bathrooms,
    filters.min_area,
    filters.parking ? 'parking' : '',
    filters.furnished !== '' ? String(filters.furnished) : '',
    filters.age,
    filters.total_floors,
    filters.is_luxury ? 'luxury' : '',
    filters.gated_community ? 'gated' : '',
  ].filter(Boolean).length
    + filters.amenities.length
    + (filters.connectivity?.length || 0);

  const hasActiveFilters = activeFilterCount > 0;

  // Shared styles keep every control aligned and on-brand. `chip` is used for
  // every selectable pill so sizing/typography never drifts between sections.
  const chip = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full text-xs font-semibold tracking-wide transition-all touch-manipulation ${active
      ? 'bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 shadow-sm'
      : 'bg-muted/50 border border-border text-muted-foreground hover:border-accent-400/60 hover:text-foreground'
    }`;

  // `tile` is the variant used by the Amenities / Connectivity sections. Tiles are
  // content-sized and laid out in a flex-wrap row, so when one grows its real size
  // on hover (padding + text), the neighbours reflow to make room and settle back
  // on leave — an organic "dynamic spacing" effect instead of an overlap.
  const tile = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide text-center leading-snug transition-all duration-300 ease-out hover:px-6 hover:py-3.5 hover:text-sm hover:shadow-lg hover:shadow-accent-500/10 touch-manipulation ${active
      ? 'bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 shadow-sm'
      : 'bg-muted/50 border border-border text-muted-foreground hover:border-accent-400/60 hover:text-foreground'
    }`;

  const inputClass =
    'w-full h-11 px-4 bg-muted/50 border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all';

  const sectionLabel = 'block eyebrow text-[9px] text-muted-foreground mb-2.5';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      {/* Header with Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1 rounded-xl transition-colors cursor-pointer touch-manipulation"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-display text-xl text-foreground">Refine</h3>
          {hasActiveFilters && (
            <span className="px-2.5 py-0.5 bg-accent-500/15 text-accent-700 dark:text-accent-400 rounded-full text-[10px] font-semibold tracking-wider uppercase">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-300 text-muted-foreground ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 mt-4 pt-5 engrave-top">
          {/* Listing Type */}
          <div>
            <label className={sectionLabel}>Listing Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'rent', label: 'Rent' },
                { value: 'sale', label: 'Buy' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      listing_type: filters.listing_type === option.value ? '' : (option.value as any),
                    })
                  }
                  className={chip(filters.listing_type === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className={sectionLabel}>Property Type</label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  ...filters,
                  type: (v === 'all' ? '' : v) as any,
                })
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 hover:border-accent-400/60">
                <SelectValue placeholder="All Property Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Property Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="plot">Plot</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className={sectionLabel}>Price Range</label>

            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {[
                { value: 'budget', label: 'Budget' },
                { value: 'economy', label: 'Economy' },
                { value: 'premium', label: 'Premium' },
                { value: 'luxury', label: 'Luxury' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePricePresetClick(preset.value)}
                  className={chip(filters.pricePresets === preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.min_price}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    min_price: e.target.value,
                    pricePresets: '',
                  })
                }
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.max_price}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    max_price: e.target.value,
                    pricePresets: '',
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* BHK Type */}
          <div>
            <label className={sectionLabel}>BHK Type</label>
            <div className="grid grid-cols-5 gap-2">
              {['1', '2', '3', '4', '5'].map((bhk) => (
                <button
                  key={bhk}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      bedrooms: filters.bedrooms === bhk ? '' : bhk,
                    })
                  }
                  className={`${chip(filters.bedrooms === bhk)} px-0`}
                >
                  {bhk}{bhk === '5' ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className={sectionLabel}>Bathrooms</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '4'].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      bathrooms: filters.bathrooms === n ? '' : n,
                    })
                  }
                  className={`${chip(filters.bathrooms === n)} px-0`}
                >
                  {n}{n === '4' ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Furnished Type */}
          <div>
            <label className={sectionLabel}>Furnished</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '', label: 'Any' },
                { value: true, label: 'Furnished' },
                { value: false, label: 'Unfurnished' },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      furnished: filters.furnished === option.value ? '' : option.value as boolean | '',
                    })
                  }
                  className={`${chip(filters.furnished === option.value)} px-0`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age, Total Floors, Min Area */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={sectionLabel}>Property Age</label>
              <input
                type="number"
                placeholder="Max yrs"
                value={filters.age}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    age: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={sectionLabel}>Total Floors</label>
              <input
                type="number"
                placeholder="Min floors"
                value={filters.total_floors}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    total_floors: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={sectionLabel}>Min Area (sq.ft)</label>
              <input
                type="number"
                placeholder="Minimum carpet area"
                value={filters.min_area || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    min_area: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Highlights: Parking, Luxury, Gated Community */}
          <div>
            <label className={sectionLabel}>Highlights</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'parking', label: 'Parking', active: Boolean(filters.parking) },
                { key: 'is_luxury', label: 'Luxury', active: Boolean(filters.is_luxury) },
                { key: 'gated_community', label: 'Gated Community', active: Boolean(filters.gated_community) },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      [opt.key]: !opt.active,
                    } as FilterState)
                  }
                  className={chip(opt.active)}
                >
                  {opt.active && <span className="shrink-0">✓</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connectivity — nearby infrastructure (near_* columns) */}
          <div>
            <label className={sectionLabel}>Connectivity</label>
            <div className="flex flex-wrap gap-2.5">
              {CONNECTIVITY_OPTIONS.map((opt) => {
                const selected = (filters.connectivity || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleConnectivityToggle(opt.value)}
                    className={tile(selected)}
                  >
                    {selected && <span className="shrink-0">✓</span>}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className={sectionLabel}>Amenities</label>
            <div className="flex flex-wrap gap-2.5">
              {AMENITIES.map((amenity) => {
                const selected = filters.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={tile(selected)}
                  >
                    {selected && <span className="shrink-0">✓</span>}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-5 engrave-top">
              <p className="eyebrow text-[9px] text-muted-foreground mb-2.5">Applied</p>
              <div className="flex flex-wrap gap-2 max-h-[120px] sm:max-h-[160px] overflow-y-auto custom-scrollbar">
                {filters.min_price && (
                  <FilterBadge
                    variant="pill"
                    label="Min"
                    value={`₹${parseInt(filters.min_price).toLocaleString()}`}
                    onRemove={() => onFilterChange({ ...filters, min_price: '' })}
                  />
                )}
                {filters.max_price && (
                  <FilterBadge
                    variant="pill"
                    label="Max"
                    value={`₹${parseInt(filters.max_price).toLocaleString()}`}
                    onRemove={() => onFilterChange({ ...filters, max_price: '' })}
                  />
                )}
                {filters.bedrooms && (
                  <FilterBadge
                    variant="pill"
                    label="BHK"
                    value={filters.bedrooms}
                    onRemove={() => onFilterChange({ ...filters, bedrooms: '' })}
                  />
                )}
                {filters.bathrooms && (
                  <FilterBadge
                    variant="pill"
                    label="Bath"
                    value={filters.bathrooms}
                    onRemove={() => onFilterChange({ ...filters, bathrooms: '' })}
                  />
                )}
                {filters.min_area && (
                  <FilterBadge
                    variant="pill"
                    label="Area"
                    value={`${filters.min_area}+ sq.ft`}
                    onRemove={() => onFilterChange({ ...filters, min_area: '' })}
                  />
                )}
                {filters.parking && (
                  <FilterBadge
                    variant="pill"
                    label="Highlight"
                    value="Parking"
                    onRemove={() => onFilterChange({ ...filters, parking: '' })}
                  />
                )}
                {filters.is_luxury && (
                  <FilterBadge
                    variant="pill"
                    label="Highlight"
                    value="Luxury"
                    onRemove={() => onFilterChange({ ...filters, is_luxury: false })}
                  />
                )}
                {filters.gated_community && (
                  <FilterBadge
                    variant="pill"
                    label="Highlight"
                    value="Gated"
                    onRemove={() => onFilterChange({ ...filters, gated_community: false })}
                  />
                )}
                {filters.amenities.map((amenity) => (
                  <FilterBadge
                    key={amenity}
                    variant="pill"
                    label="Amenity"
                    value={amenity}
                    onRemove={() => handleAmenityToggle(amenity)}
                  />
                ))}
                {(filters.connectivity || []).map((key) => {
                  const opt = CONNECTIVITY_OPTIONS.find((c) => c.value === key);
                  return (
                    <FilterBadge
                      key={key}
                      variant="pill"
                      label="Near"
                      value={opt?.label || key}
                      onRemove={() => handleConnectivityToggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
