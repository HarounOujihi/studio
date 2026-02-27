"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

type ProviderData = {
  id: string;
  reference: string;
  nature: "INDIVIDUAL" | "COMPANY";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  tel: string | null;
  taxIdNumber: string | null;
  personalIdType: string | null;
  personalId: string | null;
  customsCode: string | null;
  note: string | null;
  address: {
    street: string | null;
    street2: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
  } | null;
};

export default function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState<ProviderData | null>(null);

  const [formData, setFormData] = useState({
    nature: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    tel: "",
    taxIdNumber: "",
    personalIdType: "",
    personalId: "",
    customsCode: "",
    note: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await fetch(`/api/providers/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Fournisseur non trouvé");
        }
        const data = await response.json();
        setProvider(data.provider);
        setFormData({
          nature: data.provider.nature,
          firstName: data.provider.firstName || "",
          lastName: data.provider.lastName || "",
          companyName: data.provider.companyName || "",
          email: data.provider.email || "",
          tel: data.provider.tel || "",
          taxIdNumber: data.provider.taxIdNumber || "",
          personalIdType: data.provider.personalIdType || "",
          personalId: data.provider.personalId || "",
          customsCode: data.provider.customsCode || "",
          note: data.provider.note || "",
          street: data.provider.address?.street || "",
          street2: data.provider.address?.street2 || "",
          city: data.provider.address?.city || "",
          state: data.provider.address?.state || "",
          zipCode: data.provider.address?.zipCode || "",
          country: data.provider.address?.country || "",
        });
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Erreur lors du chargement");
        router.push("/providers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvider();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on nature
    if (formData.nature === "INDIVIDUAL" && !formData.firstName && !formData.lastName) {
      toast.error("Le nom et prénom sont requis pour un particulier");
      return;
    }

    if (formData.nature === "COMPANY" && !formData.companyName) {
      toast.error("La raison sociale est requise pour une entreprise");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/providers/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("Fournisseur mis à jour avec succès");
      router.push("/providers");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    if (formData.nature === "COMPANY") {
      return formData.companyName || "Entreprise";
    }
    return `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Fournisseur";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/providers">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{getDisplayName()}</h1>
              {provider?.reference && (
                <Badge variant="outline" className="font-mono">
                  {provider.reference}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Modifier les informations du fournisseur
            </p>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {formData.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            {formData.email}
          </div>
        )}
        {formData.tel && (
          <div className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {formData.tel}
          </div>
        )}
        {formData.city && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {[formData.city, formData.country].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nature Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type de fournisseur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.nature === "INDIVIDUAL" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData({ ...formData, nature: "INDIVIDUAL" })}
              >
                <User className="w-4 h-4 mr-2" />
                Particulier
              </Button>
              <Button
                type="button"
                variant={formData.nature === "COMPANY" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData({ ...formData, nature: "COMPANY" })}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Entreprise
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Identity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {formData.nature === "COMPANY" ? "Informations de l'entreprise" : "Informations personnelles"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.nature === "COMPANY" ? (
              <div className="space-y-2">
                <Label htmlFor="companyName">Raison sociale *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Nom de l'entreprise"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nom"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tel">Téléphone</Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Adresse</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Rue, numéro..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street2">Complément d'adresse</Label>
              <Input
                id="street2"
                value={formData.street2}
                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                placeholder="Appartement, étage..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Code postal</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">État / Région</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="État / Région"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Tunisie"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxIdNumber">Numéro fiscal</Label>
                <Input
                  id="taxIdNumber"
                  value={formData.taxIdNumber}
                  onChange={(e) => setFormData({ ...formData, taxIdNumber: e.target.value })}
                  placeholder="Matricule fiscal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customsCode">Code douanier</Label>
                <Input
                  id="customsCode"
                  value={formData.customsCode}
                  onChange={(e) => setFormData({ ...formData, customsCode: e.target.value })}
                  placeholder="Code en douane"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personalIdType">Type d'identité</Label>
                <Select
                  value={formData.personalIdType}
                  onValueChange={(value) => setFormData({ ...formData, personalIdType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIN">Carte d'identité</SelectItem>
                    <SelectItem value="PASSPORT">Passeport</SelectItem>
                    <SelectItem value="RESIDENCE">Carte de séjour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalId">Numéro d'identité</Label>
                <Input
                  id="personalId"
                  value={formData.personalId}
                  onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                  placeholder="Numéro"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/providers">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
