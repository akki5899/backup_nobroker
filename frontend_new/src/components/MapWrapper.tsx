'use client';

import dynamic from 'next/dynamic';
import { Property } from '@/types';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm font-bold">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  onAreaSelect?: (area: any) => void;
  center?: [number, number];
  zoom?: number;
  properties?: Property[];
  onGeofenceSearch?: (coordinates: number[][]) => void;
  searchCenter?: [number, number] | null;
  searchRadius?: number;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <Map {...props} />;
}
