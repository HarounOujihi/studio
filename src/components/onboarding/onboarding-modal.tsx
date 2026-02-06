/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { getCdnUrl } from "@/lib/config";
import { Building2, Loader2, DollarSign, Quote, Upload, X } from "lucide-react";
import Image from "next/image";

interface Currency {
  id: string;
  reference: string;
  designation: string;
  symbol: string;
  decimals: number | null;
}

interface OnboardingModalProps {
  open: boolean;
  onComplete?: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [idCurrency, setIdCurrency] = useState("");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  // Fetch currencies on mount
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await fetch("/api/currencies");
        const data = await response.json();
        const currencyList = data.currencies || [];
        setCurrencies(currencyList);

        // Pre-select TND if it exists
        const tndCurrency = currencyList.find(
          (c: Currency) => c.reference === "TND",
        );
        if (tndCurrency) {
          setIdCurrency(tndCurrency.id);
        } else if (currencyList.length > 0) {
          // Fallback to first currency if TND doesn't exist
          setIdCurrency(currencyList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
        toast.error("Failed to load currencies");
      } finally {
        setCurrenciesLoading(false);
      }
    }
    fetchCurrencies();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", "temp"); // Will be moved to actual org after creation

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      // Handle both single file and multiple files response formats
      const uploadedFile = data.files?.[0] || data.file;
      setLogoPath(uploadedFile?.key || "");
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPath("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/create-organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopName,
          slogan,
          logo: logoPath || undefined,
          idCurrency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const data = await response.json();
      toast.success("Organization created successfully!", data);

      // Call onComplete callback
      onComplete?.();

      // Reload the page to refresh the organizations
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create organization",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: `${c.designation} (${c.symbol})`,
    description: c.reference,
  }));

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div>
            <DialogTitle>Welcome to Sawi Studio</DialogTitle>
            <DialogDescription>
              Set up your shop to get started
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Left column - Logo/Branding preview */}
            <div className="space-y-4">
              <Label className="hidden lg:block">Logo</Label>
              {logoPath ? (
                <div className="relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-muted/30">
                  <img
                    src={getCdnUrl(logoPath) || ""}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isLoading}
                    className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur rounded-lg shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center hover:border-primary/50 transition-colors bg-muted/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isLoading || logoUploading}
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
                      <p className="text-xs text-muted-foreground/60 text-center px-2">
                        Max 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right column - Form fields */}
            <div className="sm:col-span-2 space-y-5">
              {/* Shop Name */}
              <div className="space-y-2">
                <Label htmlFor="shopName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Shop Name *
                </Label>
                <Input
                  id="shopName"
                  placeholder="e.g., My Shop"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
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
                  placeholder="e.g., Your tagline here"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Currency *
                </Label>
                <Combobox
                  options={currencyOptions}
                  value={idCurrency}
                  onChange={setIdCurrency}
                  placeholder="Select a currency"
                  searchPlaceholder="Search currencies..."
                  emptyText="No currencies found."
                  disabled={isLoading || currenciesLoading}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                shopName.trim() === "" || idCurrency === "" || isLoading
              }
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Shop
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
