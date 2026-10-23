// Property Type-Specific Filter Configurations
// Each property category (Buy/Rent/Commercial/Plots) has unique filter options

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'range' | 'checkbox' | 'multiselect' | 'toggle';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface PropertyTypeFilters {
  type: 'buy' | 'rent' | 'commercial' | 'plots';
  label: string;
  filters: FilterOption[];
}

export const BUY_FILTERS: FilterOption[] = [
  {
    id: 'budget',
    label: 'Budget',
    type: 'range',
    min: 0,
    max: 100000000,
    step: 100000,
    unit: '₹'
  },
  {
    id: 'bhk_type',
    label: 'BHK Type',
    type: 'multiselect',
    options: [
      { value: '1', label: '1 BHK' },
      { value: '2', label: '2 BHK' },
      { value: '3', label: '3 BHK' },
      { value: '4', label: '4 BHK' },
      { value: '5', label: '5+ BHK' }
    ]
  },
  {
    id: 'property_type',
    label: 'Property Type',
    type: 'multiselect',
    options: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'villa', label: 'Villa' },
      { value: 'independent_house', label: 'Independent House' },
      { value: 'builder_floor', label: 'Builder Floor' }
    ]
  },
  {
    id: 'possession_status',
    label: 'Possession Status',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'ready_to_move', label: 'Ready to Move' },
      { value: 'under_construction', label: 'Under Construction' }
    ]
  },
  {
    id: 'new_launch',
    label: 'New Launch',
    type: 'checkbox',
    options: [
      { value: 'true', label: 'Show New Launch Properties Only' }
    ]
  },
  {
    id: 'age_of_property',
    label: 'Age of Property',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: '0-1', label: 'Less than 1 year' },
      { value: '1-5', label: '1-5 years' },
      { value: '5-10', label: '5-10 years' },
      { value: '10+', label: '10+ years' }
    ]
  }
];

export const RENT_FILTERS: FilterOption[] = [
  {
    id: 'monthly_rent',
    label: 'Monthly Rent',
    type: 'range',
    min: 0,
    max: 200000,
    step: 1000,
    unit: '₹'
  },
  {
    id: 'bhk_type',
    label: 'BHK Type',
    type: 'multiselect',
    options: [
      { value: '1', label: '1 BHK' },
      { value: '2', label: '2 BHK' },
      { value: '3', label: '3 BHK' },
      { value: '4', label: '4 BHK' },
      { value: '5', label: '5+ BHK' }
    ]
  },
  {
    id: 'furnishing_type',
    label: 'Furnishing Type',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'furnished', label: 'Fully Furnished' },
      { value: 'semi_furnished', label: 'Semi Furnished' },
      { value: 'unfurnished', label: 'Unfurnished' }
    ]
  },
  {
    id: 'preferred_tenant',
    label: 'Preferred Tenant',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'family', label: 'Family' },
      { value: 'bachelor_male', label: 'Bachelor Male' },
      { value: 'bachelor_female', label: 'Bachelor Female' },
      { value: 'company', label: 'Company' }
    ]
  },
  {
    id: 'available_from',
    label: 'Available From',
    type: 'select',
    options: [
      { value: 'any', label: 'Any Time' },
      { value: 'immediate', label: 'Immediate' },
      { value: 'within_15_days', label: 'Within 15 Days' },
      { value: 'within_30_days', label: 'Within 30 Days' },
      { value: 'after_30_days', label: 'After 30 Days' }
    ]
  },
  {
    id: 'property_type',
    label: 'Property Type',
    type: 'multiselect',
    options: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'villa', label: 'Villa' },
      { value: 'independent_house', label: 'Independent House' },
      { value: 'builder_floor', label: 'Builder Floor' }
    ]
  }
];

export const COMMERCIAL_FILTERS: FilterOption[] = [
  {
    id: 'property_type',
    label: 'Property Type',
    type: 'select',
    options: [
      { value: 'office', label: 'Office Space' },
      { value: 'retail', label: 'Retail Shop' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'showroom', label: 'Showroom' },
      { value: 'industrial', label: 'Industrial Space' }
    ]
  },
  {
    id: 'super_builtup_area',
    label: 'Super Built-up Area',
    type: 'range',
    min: 0,
    max: 100000,
    step: 100,
    unit: 'sq.ft'
  },
  {
    id: 'parking',
    label: 'Parking Spaces',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4+', label: '4+' }
    ]
  },
  {
    id: 'lease_type',
    label: 'Lease Type',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'rent', label: 'For Rent' },
      { value: 'sale', label: 'For Sale' },
      { value: 'lease', label: 'For Lease' }
    ]
  },
  {
    id: 'furnishing_type',
    label: 'Furnishing',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'furnished', label: 'Furnished' },
      { value: 'unfurnished', label: 'Unfurnished' },
      { value: 'shell', label: 'Shell (Bare)' }
    ]
  },
  {
    id: 'floor_preference',
    label: 'Floor Preference',
    type: 'select',
    options: [
      { value: 'any', label: 'Any Floor' },
      { value: 'ground', label: 'Ground Floor' },
      { value: 'lower', label: 'Lower Floors (1-5)' },
      { value: 'middle', label: 'Middle Floors (6-15)' },
      { value: 'upper', label: 'Upper Floors (15+)' }
    ]
  }
];

export const PLOTS_FILTERS: FilterOption[] = [
  {
    id: 'plot_size',
    label: 'Plot Size',
    type: 'range',
    min: 0,
    max: 10000,
    step: 50,
    unit: 'sq.yards'
  },
  {
    id: 'facing',
    label: 'Facing',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'north', label: 'North' },
      { value: 'south', label: 'South' },
      { value: 'east', label: 'East' },
      { value: 'west', label: 'West' },
      { value: 'north_east', label: 'North-East' },
      { value: 'north_west', label: 'North-West' },
      { value: 'south_east', label: 'South-East' },
      { value: 'south_west', label: 'South-West' }
    ]
  },
  {
    id: 'gated_community',
    label: 'Gated Community',
    type: 'checkbox',
    options: [
      { value: 'true', label: 'Gated Community Only' }
    ]
  },
  {
    id: 'land_type',
    label: 'Land Type',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'agricultural', label: 'Agricultural' },
      { value: 'non_agricultural', label: 'Non-Agricultural' },
      { value: 'industrial', label: 'Industrial' }
    ]
  },
  {
    id: 'plot_type',
    label: 'Plot Type',
    type: 'select',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'residential', label: 'Residential Plot' },
      { value: 'commercial', label: 'Commercial Plot' },
      { value: 'industrial', label: 'Industrial Plot' },
      { value: 'mixed', label: 'Mixed Use' }
    ]
  },
  {
    id: 'boundary_wall',
    label: 'Boundary Wall',
    type: 'checkbox',
    options: [
      { value: 'true', label: 'Boundary Wall Constructed' }
    ]
  },
  {
    id: 'corner_plot',
    label: 'Corner Plot',
    type: 'checkbox',
    options: [
      { value: 'true', label: 'Corner Plot Only' }
    ]
  }
];

export const PROPERTY_TYPE_FILTERS_MAP: Record<string, PropertyTypeFilters> = {
  buy: {
    type: 'buy',
    label: 'Buy Property Filters',
    filters: BUY_FILTERS
  },
  rent: {
    type: 'rent',
    label: 'Rent Property Filters',
    filters: RENT_FILTERS
  },
  commercial: {
    type: 'commercial',
    label: 'Commercial Property Filters',
    filters: COMMERCIAL_FILTERS
  },
  plots: {
    type: 'plots',
    label: 'Plots & Land Filters',
    filters: PLOTS_FILTERS
  }
};
