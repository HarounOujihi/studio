"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Building2, Store, Loader2, DollarSign } from "lucide-react";
import {
  generateOrganizationReference,
  generateEstablishmentReference,
  slugify,
} from "@/lib/utils/slugify";

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [establishmentName, setEstablishmentName] = useState("");
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
          organizationName,
          establishmentName: establishmentName || undefined,
          idCurrency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const data = await response.json();
      toast.success("Organization created successfully!");

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

  const orgSlug = organizationName ? slugify(organizationName) : "";
  const etbSlug =
    establishmentName || organizationName
      ? slugify(establishmentName || organizationName)
      : "";
  const orgRef = organizationName
    ? generateOrganizationReference(organizationName)
    : "";
  const etbRef =
    establishmentName || organizationName
      ? generateEstablishmentReference(establishmentName || organizationName)
      : "";

  const isValid =
    organizationName.trim() !== "" && idCurrency !== "" && !isLoading;

  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: `${c.designation} (${c.symbol})`,
    description: c.reference,
  }));

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>Welcome to Sawi Studio</DialogTitle>
              <DialogDescription>
                Set up your organization to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label
              htmlFor="organizationName"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Organization Name *
            </Label>
            <Input
              id="organizationName"
              placeholder="e.g., My Company"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Establishment Name */}
          <div className="space-y-2">
            <Label
              htmlFor="establishmentName"
              className="flex items-center gap-2"
            >
              <Store className="h-4 w-4" />
              Establishment Name
            </Label>
            <Input
              id="establishmentName"
              placeholder="e.g., Main Store (optional)"
              value={establishmentName}
              onChange={(e) => setEstablishmentName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the organization name
            </p>
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

          {/* Preview */}
          {(orgSlug || etbSlug || idCurrency) && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium">Preview:</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Organization Ref:
                  </span>
                  <span className="font-mono">{orgRef || "..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Establishment Ref:
                  </span>
                  <span className="font-mono">{etbRef || "..."}</span>
                </div>
                {idCurrency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Currency:
                    </span>
                    <span className="font-mono">
                      {
                        currencies.find((c) => c.id === idCurrency)
                          ?.designation || "..."
                      }{" "}
                      (
                      {currencies.find((c) => c.id === idCurrency)?.symbol ||
                        "..."}
                      )
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                A default deposit and unit will be created automatically
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!isValid}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Create Organization
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
