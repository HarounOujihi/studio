"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  Upload,
  X,
  Phone,
  Mail,
  Globe,
  Quote,
  MapPin,
  Save,
} from "lucide-react";
import { getCdnUrl } from "@/lib/config";
import { LeafletMap } from "@/components/map/leaflet-map";
import { currentEtbIdAtom } from "@/lib/store/auth-oidc";

interface Address {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

interface Establishment {
  id: string;
  designation: string | null;
  slogan: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address?: Address | null;
  organization: {
    id: string;
    name: string;
  };
}

interface EstablishmentSettingsProps {
  onComplete?: () => void;
}

export function EstablishmentSettings({
  onComplete,
}: EstablishmentSettingsProps) {
  const [etbId] = useAtom(currentEtbIdAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment | null>(
    null,
  );
  const [logoUploading, setLogoUploading] = useState(false);

  // Form state
  const [designation, setDesignation] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Address state
  const [street, setStreet] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [mapLat, setMapLat] = useState(36.8065); // Default to Tunis
  const [mapLng, setMapLng] = useState(10.1815);

  const fetchEstablishment = useCallback(
    async (etbId: string) => {
      if (!etbId) {
        toast.error("No establishment selected");
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

        // Get address from address relation
        if (est.address) {
          const addr = est.address;
          setStreet(addr.street || "");
          setStreet2(addr.street2 || "");
          setCity(addr.city || "");
          setState(addr.state || "");
          setZipCode(addr.zipCode || "");
          setCountry(addr.country || "");
          if (addr.lat && addr.lng) {
            setMapLat(parseFloat(addr.lat));
            setMapLng(parseFloat(addr.lng));
          }
        }
      } catch (error) {
        console.error("Error fetching establishment:", error);
        toast.error("Failed to load establishment data");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogo("");
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!etbId) {
      toast.error("No establishment selected");
      return;
    }

    setIsSaving(true);

    try {
      const address: Address = {
        street: street || undefined,
        street2: street2 || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || undefined,
        lat: mapLat,
        lng: mapLng,
      };

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
          address: street || city || state || country ? address : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update establishment");

      toast.success("Establishment updated successfully!");
      onComplete?.();
    } catch (error) {
      console.error("Error updating establishment:", error);
      toast.error("Failed to update establishment");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Update your establishment&apos;s basic details
          </p>
        </div>

        {/* Logo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Logo</Label>
            {logo ? (
              <div className="relative aspect-square max-w-[200px] rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-muted/30">
                <img
                  src={getCdnUrl(logo) || ""}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isSaving}
                  className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur rounded-lg shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative aspect-square max-w-[200px] rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center hover:border-primary/50 transition-colors bg-muted/20">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isSaving || logoUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {logoUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center px-2">
                      Upload Logo
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="designation" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Establishment Name
              </Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={isSaving}
                placeholder="e.g., My Store"
              />
            </div>

            {/* Slogan */}
            <div className="space-y-2">
              <Label htmlFor="slogan" className="flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Slogan
              </Label>
              <Input
                id="slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                disabled={isSaving}
                placeholder="e.g., Your tagline here"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            How customers can reach you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSaving}
              placeholder="+1234567890"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              placeholder="contact@example.com"
            />
          </div>

          {/* Website */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isSaving}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </h3>
          <p className="text-sm text-muted-foreground">
            Your business location
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              disabled={isSaving}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street2">Street Address Line 2 (Optional)</Label>
            <Input
              id="street2"
              value={street2}
              onChange={(e) => setStreet2(e.target.value)}
              disabled={isSaving}
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isSaving}
              placeholder="Tunis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={isSaving}
              placeholder="Tunis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Postal Code</Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              disabled={isSaving}
              placeholder="1001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isSaving}
              placeholder="Tunisia"
            />
          </div>
        </div>

        {/* Leaflet Map */}
        <LeafletMap
          lat={mapLat}
          lng={mapLng}
          onLocationSelect={handleLocationSelect}
          className="h-80 w-full"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
