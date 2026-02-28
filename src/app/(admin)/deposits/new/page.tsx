"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useScope } from "@/hooks/use-scope";

export default function NewDepositPage() {
  const router = useRouter();
  const scope = useScope();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    designation: "",
    type: "WAREHOUSE",
    isDefault: false,
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.orgId || !scope.etbId) { toast.error("Sélectionnez une organisation"); return; }
    setIsSaving(true);
    try {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrg: scope.orgId, idEtb: scope.etbId, ...formData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      toast.success("Dépôt créé");
      router.push("/deposits");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/deposits"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold">Nouveau dépôt</h1>
          <p className="text-sm text-muted-foreground">Créez un nouveau dépôt ou magasin</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Désignation</Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="Nom du dépôt" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WAREHOUSE">Entrepôt</SelectItem>
                    <SelectItem value="STORE">Magasin</SelectItem>
                    <SelectItem value="SHOWROOM">Showroom</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="isDefault" checked={formData.isDefault} onCheckedChange={(c) => setFormData({ ...formData, isDefault: !!c })} />
                <Label htmlFor="isDefault">Dépôt par défaut</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Adresse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="Rue, numéro" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ville</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Ville" /></div>
              <div className="space-y-2"><Label>Code postal</Label><Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="Code postal" /></div>
            </div>
            <div className="space-y-2"><Label>Pays</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Pays" /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild><Link href="/deposits">Annuler</Link></Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}</Button>
        </div>
      </form>
    </div>
  );
}
