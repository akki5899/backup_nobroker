'use client';

import { Property } from '@/types';
import { X, Heart, Phone, MessageSquare, Calendar, Share2, MapPin, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PropertyDetailPanelProps {
  property: Property | null;
  onClose: () => void;
  onFavorite?: (propertyId: number) => void;
  onContact?: (propertyId: number) => void;
  isFavorited?: boolean;
}

export default function PropertyDetailPanel({
  property,
  onClose,
  onFavorite,
  onContact,
  isFavorited = false
}: PropertyDetailPanelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [agentDetails, setAgentDetails] = useState<any>(null);

  useEffect(() => {
    if (!property) return;
    setCurrentImageIndex(0);
  }, [property]);

  if (!property) return null;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (property.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (property.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const images = property.images || [];
  const currentImage = images[currentImageIndex]?.image_url || '/placeholder-property.jpg';

  return (
    <div className="w-full md:w-96 bg-card shadow-2xl flex flex-col h-full overflow-hidden z-raised border-l border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-transparent dark:from-slate-800 dark:to-transparent">
        <h2 className="font-black text-lg truncate text-foreground">
          {property.title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image Gallery */}
        <div className="relative bg-muted aspect-video w-full">
          <img
            src={currentImage}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                ‹
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Key Info */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-2xl font-black text-foreground">
              ₹{property.price.toLocaleString()}
            </h3>
            <span className="text-sm font-bold text-muted-foreground">
              {property.listing_type === 'rent' ? '/month' : 'total'}
            </span>
          </div>

          {property.area && (
            <p className="text-sm text-foreground/80 mb-2">
              ₹{(property.price / property.area).toFixed(0)} per sqft
            </p>
          )}

          <div className="flex gap-2 mb-3 flex-wrap">
            {((property as any).property_type || property.type) && (
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-accent-300 text-xs font-bold rounded-full capitalize">
                {(property as any).property_type ? (property as any).property_type.replace(/_/g, ' ') : property.type}
              </span>
            )}
            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-full capitalize">
              {property.listing_type}
            </span>
            {property.furnished && (
              <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-xs font-bold rounded-full">
                Furnished
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-foreground">{property.address}</p>
              <p className="text-xs">{property.city}, {property.state} {property.pincode}</p>
            </div>
          </div>
        </div>

        {/* Property Features */}
        {(property.bedrooms || property.bathrooms || property.area) && (
          <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-200 dark:border-slate-700">
            {property.bedrooms !== null && (
              <div className="text-center">
                <p className="text-lg font-black text-foreground">{property.bedrooms}</p>
                <p className="text-xs text-muted-foreground font-bold">BHK</p>
              </div>
            )}
            {property.bathrooms !== null && (
              <div className="text-center">
                <p className="text-lg font-black text-foreground">{property.bathrooms}</p>
                <p className="text-xs text-muted-foreground font-bold">Baths</p>
              </div>
            )}
            {property.area && (
              <div className="text-center">
                <p className="text-lg font-black text-foreground">{property.area}</p>
                <p className="text-xs text-muted-foreground font-bold">sqft</p>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {(property.parking || property.balcony || property.gym || property.swimming_pool) && (
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h4 className="font-black text-sm mb-3 text-foreground">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {property.parking && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-foreground/80 text-xs font-bold rounded-full">
                  🅿️ Parking
                </span>
              )}
              {property.balcony && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-foreground/80 text-xs font-bold rounded-full">
                  🪟 Balcony
                </span>
              )}
              {property.gym && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-foreground/80 text-xs font-bold rounded-full">
                  💪 Gym
                </span>
              )}
              {property.swimming_pool && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-foreground/80 text-xs font-bold rounded-full">
                  🏊 Pool
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h4 className="font-black text-sm mb-2 text-foreground">About</h4>
            <p className="text-sm text-foreground/80 line-clamp-3">
              {property.description}
            </p>
          </div>
        )}

        {/* Views Counter */}
        <div className="p-4 bg-muted border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Views</span>
            <span className="font-bold text-foreground">{property.views || 0}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-4 gap-2 flex border-t border-gray-200 dark:border-slate-700 bg-muted">
        <button
          onClick={() => onFavorite?.(property.id)}
          className={`flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${isFavorited
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
              : 'bg-slate-100 dark:bg-slate-700 text-foreground/80 hover:bg-slate-200'
            }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={() => onContact?.(property.id)}
          className="flex-1 py-3 rounded-xl font-black bg-primary-900 dark:bg-accent-500 text-white dark:text-primary-950 hover:bg-primary-800 dark:hover:bg-accent-400 flex items-center justify-center gap-2 transition-all"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Contact</span>
        </button>

        <button className="flex-1 py-3 rounded-xl font-black bg-slate-100 dark:bg-slate-700 text-foreground/80 hover:bg-slate-200 flex items-center justify-center gap-2 transition-all">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}

