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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet types are loaded dynamically
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet types are loaded dynamically
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet types are loaded dynamically
  const leafletRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Load Leaflet CSS and library only on client side
  useEffect(() => {
    setIsClient(true);

    const loadLeaflet = async () => {
      try {
        // Add Leaflet CSS via link tag to avoid SSR issues
        const linkId = "leaflet-css";
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Dynamically import Leaflet library
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;

        // Fix default icon issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Leaflet internal property
        const leafletAny = L as any;
        if (typeof window !== "undefined" && leafletAny.Icon?.Default) {
          delete leafletAny.Icon.Default.prototype._getIconUrl;
          leafletAny.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });
        }

        leafletRef.current = L;
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load Leaflet:", error);
        setHasError(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is loaded and element is ready
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || isInitializedRef.current) return;

    const initializeMap = () => {
      if (!mapRef.current || !leafletRef.current) return;

      try {
        const L = leafletRef.current;
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add marker
        const marker = L.marker([lat, lng], {
          draggable: !!onLocationSelect,
          autoPan: true,
        }).addTo(map);

        if (onLocationSelect) {
          marker.on("dragend", () => {
            const position = marker.getLatLng();
            onLocationSelect(position.lat, position.lng);
          });
        }

        // Force map to recalculate size
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setHasError(true);
      }
    };

    // Ensure container has dimensions
    const container = mapRef.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      // Wait for next frame if container isn't ready
      requestAnimationFrame(() => initializeMap());
    } else {
      initializeMap();
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isInitialized, lat, lng, onLocationSelect]);

  // Update map view when lat/lng change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && leafletRef.current) {
      const newLatLng = [lat, lng] as [number, number];
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, 13);
    }
  }, [lat, lng]);

  // Don't render anything during SSR
  if (!isClient) {
    return (
      <div className={`h-64 rounded-lg border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/10 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`h-64 rounded-lg border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/10 ${className}`}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Unable to load map</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`h-64 rounded-lg border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/10 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full min-h-[320px] rounded-lg overflow-hidden z-0" />
      {onLocationSelect && (
        <p className="text-xs text-muted-foreground mt-2">
          Drag the marker to adjust location
        </p>
      )}
    </div>
  );
}
