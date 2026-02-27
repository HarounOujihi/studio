"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Loader2,
} from "lucide-react";
import { useScope } from "@/hooks/use-scope";

export default function NewCustomerPage() {
  const router = useRouter();
  const scope = useScope();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nature: "INDIVIDUAL",
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
    // Address
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scope.orgId || !scope.etbId) {
      toast.error("Veuillez sélectionner une organisation et un établissement");
      return;
    }

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
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idOrg: scope.orgId,
          idEtb: scope.etbId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success("Client créé avec succès");
      router.push("/customers");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Nouveau client</h1>
          <p className="text-sm text-muted-foreground">
            Créez un nouveau client ou prospect
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nature Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type de client</CardTitle>
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
            <Link href="/customers">Annuler</Link>
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
