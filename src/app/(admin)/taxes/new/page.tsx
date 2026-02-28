"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useScope } from "@/hooks/use-scope";

export default function NewTaxPage() {
  const router = useRouter();
  const scope = useScope();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ designation: "", value: "", taxType: "TVA" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.orgId || !scope.etbId) { toast.error("Sélectionnez une organisation"); return; }
    if (!formData.designation) { toast.error("La désignation est requise"); return; }
    setIsSaving(true);
    try {
      const response = await fetch("/api/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idOrg: scope.orgId,
          idEtb: scope.etbId,
          designation: formData.designation,
          value: formData.value ? parseFloat(formData.value) : null,
          taxType: formData.taxType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      toast.success("Taxe créée");
      router.push("/taxes");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/taxes"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold">Nouvelle taxe</h1>
          <p className="text-sm text-muted-foreground">Ex: TVA 19%, TVA 7%...</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Désignation *</Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="TVA 19%" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxType">Type</Label>
                <Select value={formData.taxType} onValueChange={(v) => setFormData({ ...formData, taxType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TVA">TVA</SelectItem>
                    <SelectItem value="TTC">TTC</SelectItem>
                    <SelectItem value="HT">HT</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valeur (%)</Label>
                <Input id="value" type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="19" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild><Link href="/taxes">Annuler</Link></Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}</Button>
        </div>
      </form>
    </div>
  );
}
