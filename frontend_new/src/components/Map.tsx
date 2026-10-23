'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type MapLibreGL from 'maplibre-gl';
import { Property } from '@/types';
import { Layers, PencilRuler, X, Check } from 'lucide-react';
import { analytics } from '@/utils/analytics';
import {
  Map as MapCN,
  MapMarker,
  MarkerContent,
  MapControls,
  useMap,
  type MapRef,
} from '@/components/ui/mapcn-marker-popup';

interface MapProps {
  /** @deprecated kept for API compatibility; no longer used */
  onAreaSelect?: (area: any) => void;
  /** Center as [latitude, longitude] (Leaflet order, kept for API compatibility) */
  center?: [number, number];
  zoom?: number;
  properties?: Property[];
  /** Called with the drawn polygon ring as [[lng, lat], ...] (closed) */
  onGeofenceSearch?: (coordinates: number[][]) => void;
  /** Search-radius circle centre as [latitude, longitude] */
  searchCenter?: [number, number] | null;
  /** Search-radius circle radius in metres */
  searchRadius?: number;
  /** Show the "Draw Area" geofence control */
  enableGeofence?: boolean;
  selectedPropertyId?: number | null;
  onPropertySelect?: (property: Property) => void;
}

type Basemap = 'default' | 'dark' | 'satellite';

const DEFAULT_CENTER_LAT_LNG: [number, number] = [17.385044, 78.486671]; // Hyderabad
const CLOSE_THRESHOLD_PX = 14; // click within this many px of the first vertex closes the polygon

const VECTOR_BASEMAPS: Record<'default' | 'dark', string> = {
  default: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

const SATELLITE_STYLE: MapLibreGL.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
};

function getCoords(p: Property): [number, number] | null {
  // normalizeProperty (api_client) populates both lat/lng and latitude/longitude.
  const lat = (p as any).lat ?? (p as any).latitude;
  const lng = (p as any).lng ?? (p as any).longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return [lng, lat]; // MapLibre [lng, lat] order
}

/** GeoJSON polygon ring approximating a circle of `radiusMeters` around [lng, lat]. */
function circleRing(
  center: [number, number],
  radiusMeters: number,
  points = 64,
): [number, number][] {
  const [lng, lat] = center;
  const distanceX = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110_540;
  const ring: [number, number][] = [];
  for (let i = 0; i < points; i += 1) {
    const theta = (i / points) * (2 * Math.PI);
    ring.push([lng + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)]);
  }
  ring.push(ring[0]);
  return ring;
}

/**
 * Re-add a source + layers whenever the style (re)loads. Returns the live source
 * so callers can push data. Survives setStyle() basemap/theme switches, which
 * otherwise drop all custom sources/layers.
 */
function useStyleSafeLayer(
  setup: (map: MapLibreGL.Map) => void,
  cleanup: (map: MapLibreGL.Map) => void,
) {
  const { map, isLoaded } = useMap();
  const setupRef = useRef(setup);
  const cleanupRef = useRef(cleanup);
  setupRef.current = setup;
  cleanupRef.current = cleanup;

  useEffect(() => {
    if (!map || !isLoaded) return;
    setupRef.current(map);
    return () => {
      try {
        cleanupRef.current(map);
      } catch {
        // style may already be gone
      }
    };
  }, [map, isLoaded]);
}

/** Translucent search-radius circle. centerLatLng is [lat, lng]. */
function RadiusCircle({
  centerLatLng,
  radiusMeters,
  color = '#f06c08',
}: {
  centerLatLng: [number, number];
  radiusMeters: number;
  color?: string;
}) {
  const { map, isLoaded } = useMap();
  const sourceId = 'radius-circle-source';
  const fillId = 'radius-circle-fill';
  const lineId = 'radius-circle-line';

  const data = useMemo<GeoJSON.Feature<GeoJSON.Polygon>>(() => {
    const [lat, lng] = centerLatLng;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [circleRing([lng, lat], radiusMeters)] },
    };
  }, [centerLatLng, radiusMeters]);

  useStyleSafeLayer(
    (m) => {
      m.addSource(sourceId, { type: 'geojson', data });
      m.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': color, 'fill-opacity': 0.12 },
      });
      m.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': color, 'line-width': 2 },
      });
    },
    (m) => {
      if (m.getLayer(lineId)) m.removeLayer(lineId);
      if (m.getLayer(fillId)) m.removeLayer(fillId);
      if (m.getSource(sourceId)) m.removeSource(sourceId);
    },
  );

  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    src?.setData(data);
  }, [map, isLoaded, data]);

  return null;
}

/** Pulsing user-location dot + accuracy ring. centerLatLng is [lat, lng]. */
function UserLocationCircle({ centerLatLng }: { centerLatLng: [number, number] }) {
  const { map, isLoaded } = useMap();
  const sourceId = 'user-location-source';
  const ringId = 'user-location-ring';
  const dotId = 'user-location-dot';

  const data = useMemo<GeoJSON.Feature<GeoJSON.Point>>(() => {
    const [lat, lng] = centerLatLng;
    return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } };
  }, [centerLatLng]);

  useStyleSafeLayer(
    (m) => {
      m.addSource(sourceId, { type: 'geojson', data });
      m.addLayer({
        id: ringId,
        type: 'circle',
        source: sourceId,
        paint: { 'circle-radius': 14, 'circle-color': '#0d9488', 'circle-opacity': 0.2 },
      });
      m.addLayer({
        id: dotId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#0d9488',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    },
    (m) => {
      if (m.getLayer(dotId)) m.removeLayer(dotId);
      if (m.getLayer(ringId)) m.removeLayer(ringId);
      if (m.getSource(sourceId)) m.removeSource(sourceId);
    },
  );

  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    src?.setData(data);
  }, [map, isLoaded, data]);

  return null;
}

/**
 * Native polygon geofence drawing. While `active`, each map click adds a vertex;
 * clicking near the first vertex (or pressing Finish) closes the ring and calls
 * onComplete with [[lng, lat], ...]. The committed polygon stays rendered until
 * cleared.
 */
function GeofenceDraw({
  active,
  committed,
  finishSignal,
  onCommit,
  onPointsChange,
}: {
  active: boolean;
  committed: [number, number][] | null;
  /** Increment to request closing the current ring (Finish button). */
  finishSignal: number;
  onCommit: (ring: [number, number][]) => void;
  onPointsChange: (count: number) => void;
}) {
  const { map, isLoaded } = useMap();
  const sourceId = 'geofence-source';
  const fillId = 'geofence-fill';
  const lineId = 'geofence-line';
  const vertexId = 'geofence-vertices';

  const [points, setPoints] = useState<[number, number][]>([]);
  const [preview, setPreview] = useState<[number, number] | null>(null);

  const pointsRef = useRef(points);
  pointsRef.current = points;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Reset the in-progress points whenever drawing stops (commit or cancel/clear)
  // and when a fresh session starts. Otherwise old vertices/lines linger and
  // re-render after the committed ring is cleared.
  useEffect(() => {
    setPoints([]);
    setPreview(null);
  }, [active]);

  useEffect(() => {
    onPointsChange(points.length);
  }, [points.length, onPointsChange]);

  // Finish button: close the current ring if it has enough vertices.
  useEffect(() => {
    if (finishSignal === 0) return;
    const current = pointsRef.current;
    if (current.length >= 3) {
      onCommitRef.current([...current, current[0]]);
    }
  }, [finishSignal]);

  // Build the feature collection to render (committed ring, or in-progress path).
  const data = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];

    if (committed && committed.length >= 4) {
      features.push({
        type: 'Feature',
        properties: { kind: 'fill' },
        geometry: { type: 'Polygon', coordinates: [committed] },
      });
    } else if (points.length > 0) {
      const line = preview ? [...points, preview] : points;
      if (line.length >= 2) {
        features.push({
          type: 'Feature',
          properties: { kind: 'line' },
          geometry: { type: 'LineString', coordinates: line },
        });
      }
      for (const pt of points) {
        features.push({ type: 'Feature', properties: { kind: 'vertex' }, geometry: { type: 'Point', coordinates: pt } });
      }
    }

    // also outline a committed polygon
    if (committed && committed.length >= 4) {
      features.push({
        type: 'Feature',
        properties: { kind: 'line' },
        geometry: { type: 'LineString', coordinates: committed },
      });
    }

    return { type: 'FeatureCollection', features };
  }, [committed, points, preview]);

  useStyleSafeLayer(
    (m) => {
      m.addSource(sourceId, { type: 'geojson', data });
      m.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        filter: ['==', ['get', 'kind'], 'fill'],
        paint: { 'fill-color': '#c89f5e', 'fill-opacity': 0.2 },
      });
      m.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'kind'], 'line'],
        paint: { 'line-color': '#9a6d2f', 'line-width': 2.5, 'line-dasharray': [2, 1] },
      });
      m.addLayer({
        id: vertexId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'kind'], 'vertex'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#9a6d2f',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    },
    (m) => {
      if (m.getLayer(vertexId)) m.removeLayer(vertexId);
      if (m.getLayer(lineId)) m.removeLayer(lineId);
      if (m.getLayer(fillId)) m.removeLayer(fillId);
      if (m.getSource(sourceId)) m.removeSource(sourceId);
    },
  );

  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    src?.setData(data);
  }, [map, isLoaded, data]);

  // Click / move handlers while drawing.
  useEffect(() => {
    if (!map || !active) return;

    const canvas = map.getCanvas();
    canvas.style.cursor = 'crosshair';

    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      const current = pointsRef.current;
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Close if clicking near the first vertex with enough points.
      if (current.length >= 3) {
        const first = map.project(current[0]);
        const here = map.project(pt);
        const dist = Math.hypot(first.x - here.x, first.y - here.y);
        if (dist <= CLOSE_THRESHOLD_PX) {
          onCommitRef.current([...current, current[0]]);
          return;
        }
      }
      setPoints((prev) => [...prev, pt]);
    };

    const handleMove = (e: MapLibreGL.MapMouseEvent) => {
      setPreview([e.lngLat.lng, e.lngLat.lat]);
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMove);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMove);
      canvas.style.cursor = '';
      setPreview(null);
    };
  }, [map, active]);

  return null;
}

function PriceMarker({
  property,
  isSelected,
  onSelect,
}: {
  property: Property;
  isSelected: boolean;
  onSelect: (p: Property) => void;
}) {
  const price = (property.price / 100000).toFixed(1);
  return (
    <button
      type="button"
      onClick={() => {
        analytics.mapInteraction('marker_select', { id: property.id });
        onSelect(property);
      }}
      className={`whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold shadow-lg transition-all ${
        isSelected
          ? 'scale-110 border-accent-600 bg-accent-600 text-white shadow-accent-500/40'
          : 'border-primary-500 bg-white text-primary-800 hover:scale-105 hover:border-accent-500'
      }`}
    >
      ₹{price}L
    </button>
  );
}

export default function Map({
  center,
  zoom = 12,
  properties = [],
  onGeofenceSearch,
  searchCenter = null,
  searchRadius = 2000,
  enableGeofence = false,
  selectedPropertyId = null,
  onPropertySelect,
}: MapProps) {
  const [mapObj, setMapObj] = useState<MapRef | null>(null);
  const [basemap, setBasemap] = useState<Basemap>('default');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [committedRing, setCommittedRing] = useState<[number, number][] | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [finishSignal, setFinishSignal] = useState(0);
  const didFitRef = useRef(false);

  const [lat, lng] = center ?? DEFAULT_CENTER_LAT_LNG;

  const visibleProperties = useMemo(
    () => properties.filter((p) => getCoords(p) !== null),
    [properties],
  );

  // Pin theme so the basemap switch is deterministic; popups/markers still adapt
  // to dark mode via CSS tokens.
  const styles = useMemo(() => {
    const style = basemap === 'satellite' ? SATELLITE_STYLE : VECTOR_BASEMAPS[basemap];
    return { light: style, dark: style };
  }, [basemap]);

  const runWhenReady = (map: MapRef, cb: () => void) => {
    if (map.isStyleLoaded()) cb();
    else map.once('load', cb);
  };

  // Fit to all properties once after they first load.
  useEffect(() => {
    if (!mapObj || didFitRef.current || visibleProperties.length === 0) return;
    runWhenReady(mapObj, () => {
      const coords = visibleProperties
        .map(getCoords)
        .filter((c): c is [number, number] => c !== null);
      if (coords.length === 0) return;
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      mapObj.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, maxZoom: 14, duration: 0 },
      );
      didFitRef.current = true;
    });
  }, [mapObj, visibleProperties]);

  // Recenter on selected property.
  useEffect(() => {
    if (!mapObj) return;
    const selected = selectedPropertyId
      ? visibleProperties.find((p) => p.id === selectedPropertyId)
      : null;
    const target = selected ? getCoords(selected) : null;
    if (target) {
      runWhenReady(mapObj, () => mapObj.flyTo({ center: target, zoom: 15, duration: 800 }));
    }
  }, [mapObj, selectedPropertyId, visibleProperties]);

  // Fly to a programmatic search-radius circle when it appears.
  useEffect(() => {
    if (!mapObj || !searchCenter) return;
    const [sLat, sLng] = searchCenter;
    runWhenReady(mapObj, () => mapObj.flyTo({ center: [sLng, sLat], zoom: 13, duration: 800 }));
  }, [mapObj, searchCenter]);

  const cycleBasemap = () => {
    const order: Basemap[] = ['default', 'dark', 'satellite'];
    const next = order[(order.indexOf(basemap) + 1) % order.length];
    setBasemap(next);
    analytics.mapInteraction('map_style_change', { style: next });
  };

  const startDrawing = () => {
    setCommittedRing(null);
    setDrawing(true);
    analytics.mapInteraction('geofence_draw_start');
  };

  const handleCommit = useCallback(
    (ring: [number, number][]) => {
      setCommittedRing(ring);
      setDrawing(false);
      onGeofenceSearch?.(ring);
      analytics.mapInteraction('geofence_draw_complete', { points: ring.length - 1 });
    },
    [onGeofenceSearch],
  );

  const clearDrawing = () => {
    setDrawing(false);
    setCommittedRing(null);
    setDrawCount(0);
  };

  const basemapLabel = basemap === 'default' ? 'Dark' : basemap === 'dark' ? 'Satellite' : 'Map';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-gray-100">
      <MapCN
        ref={setMapObj}
        theme="light"
        center={[lng, lat]}
        zoom={zoom}
        styles={styles}
        className="h-full w-full"
      >
        {visibleProperties.map((property) => {
          const coords = getCoords(property)!;
          return (
            <MapMarker key={property.id} longitude={coords[0]} latitude={coords[1]}>
              <MarkerContent>
                <PriceMarker
                  property={property}
                  isSelected={selectedPropertyId === property.id}
                  onSelect={(p) => onPropertySelect?.(p)}
                />
              </MarkerContent>
            </MapMarker>
          );
        })}

        {searchCenter && searchRadius && (
          <RadiusCircle centerLatLng={searchCenter} radiusMeters={searchRadius} />
        )}

        {userLocation && <UserLocationCircle centerLatLng={userLocation} />}

        {enableGeofence && (
          <GeofenceDraw
            active={drawing}
            committed={committedRing}
            finishSignal={finishSignal}
            onCommit={handleCommit}
            onPointsChange={setDrawCount}
          />
        )}

        <MapControls
          position="top-right"
          showZoom
          showLocate
          showFullscreen
          onLocate={(coords) => {
            setUserLocation([coords.latitude, coords.longitude]);
            analytics.mapInteraction('user_location_accessed');
          }}
        />
      </MapCN>

      {/* Left controls: geofence draw + basemap switch */}
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-2">
        {enableGeofence && !drawing && !committedRing && (
          <button
            onClick={startDrawing}
            className="flex items-center gap-2 rounded-md bg-primary-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-800 dark:bg-accent-500 dark:text-primary-950 dark:hover:bg-accent-400"
            aria-label="Draw a custom search area on the map"
          >
            <PencilRuler className="h-4 w-4" /> Draw Area
          </button>
        )}

        {drawing && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setFinishSignal((n) => n + 1)}
              disabled={drawCount < 3}
              className="flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-40"
              aria-label="Finish drawing area"
            >
              <Check className="h-4 w-4" /> Finish ({drawCount})
            </button>
            <button
              onClick={clearDrawing}
              className="flex items-center gap-2 rounded-md bg-red-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-600"
              aria-label="Cancel drawing"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        )}

        {committedRing && (
          <button
            onClick={clearDrawing}
            className="flex items-center gap-2 rounded-md bg-red-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-600"
            aria-label="Clear drawn area"
          >
            <X className="h-4 w-4" /> Clear Area
          </button>
        )}

        <button
          onClick={cycleBasemap}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Switch basemap (Default / Dark / Satellite)"
          aria-label="Switch basemap"
        >
          <Layers className="h-4 w-4" /> {basemapLabel}
        </button>
      </div>

      {/* Drawing hint */}
      {drawing && (
        <div className="absolute left-1/2 top-2 z-10 max-w-[90%] -translate-x-1/2 rounded-xl bg-primary-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl flex items-center gap-2 sm:text-sm">
          <PencilRuler className="h-4 w-4 shrink-0" />
          <span>Click to add points — click the first point to close the area.</span>
        </div>
      )}
    </div>
  );
}
