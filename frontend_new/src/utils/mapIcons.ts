import L from 'leaflet';

const iconConfigs = {
  apartment: {
    color: '#3b82f6',
    icon: '🏢',
    label: 'Apartment'
  },
  house: {
    color: '#ef4444',
    icon: '🏠',
    label: 'House'
  },
  villa: {
    color: '#8b5cf6',
    icon: '🏰',
    label: 'Villa'
  },
  studio: {
    color: '#f59e0b',
    icon: '📦',
    label: 'Studio'
  },
  builder_floor: {
    color: '#10b981',
    icon: '🏗️',
    label: 'Builder Floor'
  },
  office: {
    color: '#06b6d4',
    icon: '💼',
    label: 'Office'
  },
  retail: {
    color: '#ec4899',
    icon: '🛍️',
    label: 'Retail'
  },
  land: {
    color: '#84cc16',
    icon: '🌾',
    label: 'Land'
  },
  pg: {
    color: '#f97316',
    icon: '🏘️',
    label: 'PG'
  }
};

export function getPropertyIcon(propertyType: string, isSelected: boolean = false) {
  const config = iconConfigs[propertyType as keyof typeof iconConfigs] || iconConfigs.apartment;
  const size = isSelected ? 48 : 40;
  const zIndex = isSelected ? 1000 : 1;

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${config.color}cc, ${config.color});
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s;
        z-index: ${zIndex};
        ${isSelected ? `
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        ` : ''}
      ">
        ${config.icon}
      </div>
    `,
    iconSize: [size, size],
    className: `property-marker property-type-${propertyType} ${isSelected ? 'selected' : ''}`
  });
}

export function getClusterIcon(count: number) {
  const size =
    count > 100 ? 45 :
    count > 50 ? 40 :
    count > 20 ? 35 :
    30;

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: ${size > 40 ? '14px' : '12px'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid white;
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    className: 'cluster-icon'
  });
}

export const iconLegend = [
  { type: 'apartment', label: 'Apartments' },
  { type: 'house', label: 'Houses' },
  { type: 'villa', label: 'Villas' },
  { type: 'studio', label: 'Studios' },
  { type: 'builder_floor', label: 'Builder Floors' },
  { type: 'office', label: 'Offices' },
  { type: 'retail', label: 'Retail' },
  { type: 'land', label: 'Land' },
  { type: 'pg', label: 'PG' }
];

