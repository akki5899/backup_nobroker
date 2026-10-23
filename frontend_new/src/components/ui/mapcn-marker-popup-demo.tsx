"use client";

import { Map, MapMarker, MarkerContent, MarkerLabel, MarkerPopup } from "@/components/ui/mapcn-marker-popup";
import { Clock, ExternalLink, Navigation, Star } from "lucide-react";

const places = [
  {
    id: 1,
    name: "The Metropolitan Museum of Art",
    label: "Museum",
    category: "Museum",
    rating: 4.8,
    reviews: 12453,
    reviewLabel: "12,453",
    hours: "10:00 AM - 5:00 PM",
    image: "https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=300&h=200&fit=crop",
    lng: -73.9632,
    lat: 40.7794,
  },
  {
    id: 2,
    name: "Brooklyn Bridge",
    label: "Landmark",
    category: "Landmark",
    rating: 4.9,
    reviews: 8234,
    reviewLabel: "8,234",
    hours: "Open 24 hours",
    image: "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=300&h=200&fit=crop",
    lng: -73.9969,
    lat: 40.7061,
  },
  {
    id: 3,
    name: "Grand Central Terminal",
    label: "Transit",
    category: "Transit",
    rating: 4.7,
    reviews: 5621,
    reviewLabel: "5,621",
    hours: "5:15 AM - 2:00 AM",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&h=200&fit=crop",
    lng: -73.9772,
    lat: 40.7527,
  },
];

export default function MarkerPopupDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-8">
      <div className="h-[500px] w-full max-w-4xl overflow-hidden rounded-lg border bg-background shadow-sm">
        <Map center={[-73.98, 40.74]} zoom={11}>
          {places.map((place) => (
            <MapMarker key={place.id} longitude={place.lng} latitude={place.lat}>
              <MarkerContent>
                <div data-mapcn-rich-marker={place.name} className="size-5 cursor-pointer rounded-full border-2 border-white bg-rose-500 shadow-lg transition-transform hover:scale-110" />
                <MarkerLabel position="bottom">{place.label}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="w-62 p-0">
                <div className="relative h-32 overflow-hidden rounded-t-md">
                  <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <p className="text-muted-foreground pb-0.5 text-[11px] font-medium tracking-wide uppercase">
                      {place.category}
                    </p>
                    <h3 className="text-foreground leading-tight font-semibold">{place.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{place.rating}</span>
                      <span className="text-muted-foreground">({place.reviewLabel})</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Clock className="size-3.5" />
                    <span>{place.hours}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                      <Navigation className="size-3.5" />
                      Directions
                    </button>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      <ExternalLink className="size-3.5" />
                    </button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>
      </div>
    </div>
  );
}

export { MarkerPopupDemo };
