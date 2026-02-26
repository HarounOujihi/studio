"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X, FolderOpen, MapPin, Save, Search, MapPinned, Locate } from "lucide-react";
import { S3_HOST } from "@/lib/config";
import { LeafletMap } from "@/components/map/leaflet-map";
import { currentEtbIdAtom } from "@/lib/store/auth-oidc";
import { MediaLibrary } from "@/components/media/media-library";
import { cn } from "@/lib/utils";

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface Establishment {
  id: string;
  designation: string | null;
  slogan: string | null;
  logo: string | null;
  cover: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  organization: { id: string; name: string };
}

export function EstablishmentSettings({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [etbId] = useAtom(currentEtbIdAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment | null>(
    null,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoLibraryOpen, setLogoLibraryOpen] = useState(false);
  const [coverLibraryOpen, setCoverLibraryOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Address autocomplete state
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Address autocomplete search
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tn,fr&addressdetails=1`
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Address search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddressChange = (value: string) => {
    setAddress(value);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;

    // Build street address
    const streetParts: string[] = [];
    if (addr.house_number) streetParts.push(addr.house_number);
    if (addr.road) streetParts.push(addr.road);

    setAddress(streetParts.join(" ") || "");
    setCity(addr.city || addr.town || addr.village || "");
    setZipCode(addr.postcode || "");
    setCountry(addr.country || "");

    // Update map
    setLatitude(parseFloat(suggestion.lat));
    setLongitude(parseFloat(suggestion.lon));

    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form state
  const [designation, setDesignation] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(36.8065);
  const [longitude, setLongitude] = useState(10.1815);

  const fetchEstablishment = useCallback(async (etbId: string) => {
    if (!etbId) {
      toast.error("Aucun établissement sélectionné");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/establishment?etbId=${etbId}`);
      if (!response.ok) throw new Error("Failed to fetch establishment");

      const data = await response.json();
      const est = data.establishment;

      setEstablishment(est);
      setDesignation(est.designation || "");
      setSlogan(est.slogan || "");
      setLogo(est.logo || "");
      setCover(est.cover || "");
      setPhone(est.phone || "");
      setEmail(est.email || "");
      setWebsite(est.website || "");
      setAddress(est.address || "");
      setCity(est.city || "");
      setZipCode(est.zipCode || "");
      setCountry(est.country || "");
      if (est.latitude && est.longitude) {
        setLatitude(est.latitude);
        setLongitude(est.longitude);
      }
    } catch (error) {
      console.error("Error fetching establishment:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (etbId) {
      setIsLoading(true);
      fetchEstablishment(etbId);
    } else {
      setIsLoading(false);
    }
  }, [etbId, fetchEstablishment]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image requis");
      return;
    }

    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", establishment?.organization.id || "temp");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const uploadedFile = data.files?.[0] || data.file;
      setLogo(uploadedFile?.key || "");
      toast.success("Logo téléchargé");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur de téléchargement");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoLibrarySelect = (keys: string[]) => {
    if (keys.length > 0) setLogo(keys[0]);
    setLogoLibraryOpen(false);
  };

  const handleCoverLibrarySelect = (keys: string[]) => {
    if (keys.length > 0) setCover(keys[0]);
    setCoverLibraryOpen(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image requis");
      return;
    }

    setCoverUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", establishment?.organization.id || "temp");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const uploadedFile = data.files?.[0] || data.file;
      setCover(uploadedFile?.key || "");
      toast.success("Image de couverture téléchargée");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur de téléchargement");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        setLatitude(lat);
        setLongitude(lng);

        // Show accuracy info
        const accuracyMeters = Math.round(accuracy);
        if (accuracyMeters > 100) {
          toast.info(`Position mise à jour (précision: ~${accuracyMeters}m). Déplacez le marqueur si nécessaire.`);
        } else {
          toast.success("Position mise à jour");
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "Impossible d'obtenir votre position";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Permission de localisation refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Position indisponible. Essayez de déplacer le marqueur manuellement.";
        } else if (error.code === error.TIMEOUT) {
          message = "Délai d'attente dépassé. Réessayez ou déplacez le marqueur manuellement.";
        }
        toast.error(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleGeocode = async () => {
    // Build search query from address fields
    const query = [address, city, zipCode, country].filter(Boolean).join(", ");
    if (!query) {
      toast.error("Veuillez saisir une adresse");
      return;
    }

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const results = await response.json();

      if (results.length === 0) {
        toast.error("Adresse non trouvée");
        return;
      }

      const { lat, lon } = results[0];
      setLatitude(parseFloat(lat));
      setLongitude(parseFloat(lon));
      toast.success("Adresse localisée");
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!etbId) {
      toast.error("Aucun établissement sélectionné");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/establishment?etbId=${etbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation,
          slogan,
          logo,
          cover,
          phone,
          email,
          website,
          address,
          city,
          zipCode,
          country,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Modifications enregistrées");
      onComplete?.();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const logoUrl = logo ? `${S3_HOST}/${logo}` : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo + Infos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Logo */}
        <div className="space-y-1.5">
          <Label className="text-xs">Logo</Label>
          {logoUrl ? (
            <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted/30">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 lg:bg-black/50  opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-14"
                  onClick={() => setLogoLibraryOpen(true)}
                >
                  <FolderOpen className="size-10" />
                </Button>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-14"
                    asChild
                  >
                    <span>
                      <Upload className="size-10" />
                    </span>
                  </Button>
                </label>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="size-14"
                  onClick={() => setLogo("")}
                >
                  <X className="size-10" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/20">
              {logoUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => setLogoLibraryOpen(true)}
                    >
                      <FolderOpen className="size-8 lg:size-6" />
                    </Button>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button type="button" variant="ghost" size="lg" asChild>
                        <span>
                          <Upload className="size-8 lg:size-6" />
                        </span>
                      </Button>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Désignation, Slogan, Téléphone */}
        <div className="md:col-span-3 grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="designation" className="text-xs">
              Nom
            </Label>
            <Input
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              disabled={isSaving}
              placeholder="Ma Boutique"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slogan" className="text-xs">
              Slogan
            </Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              disabled={isSaving}
              placeholder="Votre slogan"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSaving}
              placeholder="+216 71 123 456"
            />
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-1.5">
        <Label className="text-xs">Image de couverture</Label>
        {cover ? (
          <div className="relative aspect-[3/1] rounded-lg border overflow-hidden bg-muted/30">
            <img
              src={`${S3_HOST}/${cover}`}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-10"
                onClick={() => setCoverLibraryOpen(true)}
              >
                <FolderOpen className="size-5" />
              </Button>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-10"
                  asChild
                >
                  <span>
                    <Upload className="size-5" />
                  </span>
                </Button>
              </label>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="size-10"
                onClick={() => setCover("")}
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-[3/1] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/20">
            {coverUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverLibraryOpen(true)}
                >
                  <FolderOpen className="size-5 mr-1" />
                  Bibliothèque
                </Button>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <span>
                      <Upload className="size-5 mr-1" />
                      Télécharger
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
            placeholder="contact@exemple.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs">
            Site web
          </Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={isSaving}
            placeholder="https://exemple.com"
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Adresse
        </div>

        {/* Street with autocomplete */}
        <div className="space-y-1.5 relative" ref={suggestionsRef}>
          <Label htmlFor="address" className="text-xs">
            Rue
          </Label>
          <div className="relative">
            <Input
              id="address"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={isSaving}
              placeholder="Commencez à taper pour rechercher..."
              className="pr-8"
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion) => {
                const addr = suggestion.address;
                const streetParts: string[] = [];
                if (addr.house_number) streetParts.push(addr.house_number);
                if (addr.road) streetParts.push(addr.road);
                const cityPart = addr.city || addr.town || addr.village || "";

                return (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2",
                    )}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <MapPinned className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {streetParts.join(" ") || suggestion.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[addr.postcode, cityPart, addr.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs">
              Ville
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isSaving}
              placeholder="Tunis"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zipCode" className="text-xs">
              Code postal
            </Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              disabled={isSaving}
              placeholder="1001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs">
              Pays
            </Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isSaving}
              placeholder="Tunisie"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Position de la boutique</Label>
          <p className="text-xs text-muted-foreground">
            Définissez l&apos;emplacement exact de votre boutique. Vous pouvez rechercher une adresse, utiliser votre position actuelle, ou déplacer le marqueur sur la carte.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isLocating || isSaving}
              className="h-8 text-xs"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Locate className="h-3.5 w-3.5" />
              )}
              <span className="ml-1">Ma position</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeocode}
              disabled={isGeocoding || isSaving}
              className="h-8 text-xs"
            >
              {isGeocoding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span className="ml-1">Chercher l&apos;adresse</span>
            </Button>
          </div>
          <LeafletMap
            lat={latitude}
            lng={longitude}
            onLocationSelect={handleLocationSelect}
            className="h-72 lg:h-96 w-full rounded-md border"
          />
        </div>
      </div>

      {/* Save */}
      <div className="sticky bottom-0 flex justify-end pt-4 pb-2 border-t">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      <MediaLibrary
        open={logoLibraryOpen}
        onOpenChange={setLogoLibraryOpen}
        orgId={establishment?.organization.id || ""}
        onSelect={handleLogoLibrarySelect}
        multiple={false}
        fileType="images"
        title="Sélectionner un logo"
      />
      <MediaLibrary
        open={coverLibraryOpen}
        onOpenChange={setCoverLibraryOpen}
        orgId={establishment?.organization.id || ""}
        onSelect={handleCoverLibrarySelect}
        multiple={false}
        fileType="images"
        title="Sélectionner une image de couverture"
      />
    </form>
  );
}
