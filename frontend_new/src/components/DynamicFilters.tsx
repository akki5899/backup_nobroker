'use client';

import { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { PROPERTY_TYPE_FILTERS_MAP, FilterOption } from '@/data/propertyFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DynamicFilterState {
  listing_type: 'rent' | 'buy' | 'sale' | '';
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'plot' | '';
  [key: string]: any; // Allow dynamic filter fields
}

interface DynamicFiltersProps {
  propertyCategory: 'buy' | 'rent' | 'commercial' | 'plots';
  filters: DynamicFilterState;
  onFilterChange: (filters: DynamicFilterState) => void;
  onReset: () => void;
  loading?: boolean;
}

export default function DynamicFilters({
  propertyCategory,
  filters,
  onFilterChange,
  onReset,
  loading = false,
}: DynamicFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get filters for current property category
  const categoryFilters = PROPERTY_TYPE_FILTERS_MAP[propertyCategory];

  if (!categoryFilters) {
    return null;
  }

  const handleFilterChange = (filterId: string, value: any) => {
    onFilterChange({
      ...filters,
      [filterId]: value,
    });
  };

  const handleMultiSelectToggle = (filterId: string, value: string) => {
    const currentValues = filters[filterId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];

    handleFilterChange(filterId, newValues);
  };

  const handleCheckboxToggle = (filterId: string, value: string) => {
    const isChecked = filters[filterId] === value;
    handleFilterChange(filterId, isChecked ? '' : value);
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'listing_type' || key === 'type' || key === 'city' || key === 'q') return false;
    const value = filters[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== null && value !== undefined;
  }).length;

  const renderFilter = (filter: FilterOption) => {
    switch (filter.type) {
      case 'range':
        return (
          <div key={filter.id} className="space-y-3">
            <label className="block text-sm font-bold text-foreground/80">
              {filter.label}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder={`Min ${filter.unit || ''}`}
                value={filters[`${filter.id}_min`] || ''}
                onChange={(e) => handleFilterChange(`${filter.id}_min`, e.target.value)}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
              />
              <span className="flex items-center text-slate-400 font-bold">to</span>
              <input
                type="number"
                placeholder={`Max ${filter.unit || ''}`}
                value={filters[`${filter.id}_max`] || ''}
                onChange={(e) => handleFilterChange(`${filter.id}_max`, e.target.value)}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="space-y-3">
            <label className="block text-sm font-bold text-foreground/80">
              {filter.label}
            </label>
            <Select
              value={filters[filter.id] || 'any'}
              onValueChange={(v) => handleFilterChange(filter.id, v)}
            >
              <SelectTrigger className="w-full h-11 rounded-xl bg-card text-sm font-bold">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-semibold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.id} className="space-y-3">
            <label className="block text-sm font-bold text-foreground/80">
              {filter.label}
            </label>
            <div className="flex flex-wrap gap-2">
              {filter.options?.map((opt) => {
                const isSelected = (filters[filter.id] || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMultiSelectToggle(filter.id, opt.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-accent-600 text-white shadow-md'
                        : 'bg-muted text-foreground/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={filter.id} className="space-y-2">
            {filter.options?.map((opt) => {
              const isChecked = filters[filter.id] === opt.value;
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxToggle(filter.id, opt.value)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-foreground/80 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case 'toggle':
        return (
          <div key={filter.id} className="space-y-3">
            <label className="block text-sm font-bold text-foreground/80">
              {filter.label}
            </label>
            <div className="flex gap-2">
              {filter.options?.map((opt) => {
                const isSelected = filters[filter.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFilterChange(filter.id, opt.value)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-accent-600 text-white shadow-md'
                        : 'bg-muted text-foreground/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-5 h-5 text-accent-500" />
          <span className="font-black text-foreground">
            {categoryFilters.label}
          </span>
          {activeFilterCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-accent-600 text-white text-xs font-black">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="border-t border-border p-6 space-y-6">
          {categoryFilters.filters.map((filter) => renderFilter(filter))}

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted text-foreground/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
