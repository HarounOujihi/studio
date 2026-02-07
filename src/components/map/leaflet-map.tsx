"use client";

import { useEffect, useState, useRef } from "react";
import { MapPin } from "lucide-react";

interface LeafletMapProps {
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
}

export function LeafletMap({
  lat = 36.8065,
  lng = 10.1815,
  onLocationSelect,
  className = "",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Dynamically import leaflet only on client side
    const loadLeaflet = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        // Fix for default marker icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        setIsLoaded(true);

        // Initialize map if container is ready
        if (mapRef.current && !mapInstanceRef.current) {
          const map = L.map(mapRef.current).setView([lat, lng], 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          // Add marker
          const marker = L.marker([lat, lng], {
            draggable: onLocationSelect !== undefined,
          }).addTo(map);

          if (onLocationSelect) {
            marker.on("dragend", () => {
              const position = marker.getLatLng();
              onLocationSelect(position.lat, position.lng);
            });
          }

          mapInstanceRef.current = map;
          markerRef.current = marker;
        }
      } catch (error) {
        console.error("Failed to load leaflet:", error);
        setHasError(true);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when lat/lng change
  useEffect(() => {
    if (
      isLoaded &&
      mapInstanceRef.current &&
      markerRef.current
    ) {
      const newLatLng = { lat, lng };
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, 13);
    }
  }, [lat, lng, isLoaded]);

  if (hasError) {
    return (
      <div className={`h-64 rounded-lg border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/10 ${className}`}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Unable to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`h-64 rounded-lg border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/10 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full rounded-lg overflow-hidden" />
      {onLocationSelect && (
        <p className="text-xs text-muted-foreground mt-2">
          Drag the marker to adjust location
        </p>
      )}
    </div>
  );
}
