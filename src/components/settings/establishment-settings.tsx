"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X, FolderOpen, MapPin, Save } from "lucide-react";
import { S3_HOST } from "@/lib/config";
import { LeafletMap } from "@/components/map/leaflet-map";
import { currentEtbIdAtom } from "@/lib/store/auth-oidc";
import { MediaLibrary } from "@/components/media/media-library";

interface Establishment {
  id: string;
  designation: string | null;
  slogan: string | null;
  logo: string | null;
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
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Form state
  const [designation, setDesignation] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logo, setLogo] = useState("");
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

  const handleLibrarySelect = (keys: string[]) => {
    if (keys.length > 0) setLogo(keys[0]);
    setLibraryOpen(false);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
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
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setLibraryOpen(true)}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
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
                    className="h-7 w-7"
                    asChild
                  >
                    <span>
                      <Upload className="h-3.5 w-3.5" />
                    </span>
                  </Button>
                </label>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setLogo("")}
                >
                  <X className="h-3.5 w-3.5" />
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
                      onClick={() => setLibraryOpen(true)}
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address" className="text-xs">
              Rue
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSaving}
              placeholder="123 Avenue Habib Bourguiba"
            />
          </div>
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

        <div className="space-y-1.5">
          <Label className="text-xs">Carte</Label>
          <LeafletMap
            lat={latitude}
            lng={longitude}
            onLocationSelect={handleLocationSelect}
            className="h-64 w-full rounded-md border"
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
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        orgId={establishment?.organization.id || ""}
        onSelect={handleLibrarySelect}
        multiple={false}
        fileType="images"
        title="Sélectionner un logo"
      />
    </form>
  );
}
