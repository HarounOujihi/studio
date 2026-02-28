"use client";

import { useState, useEffect } from "react";
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

export default function NewLocationPage() {
  const router = useRouter();
  const scope = useScope();
  const [isSaving, setIsSaving] = useState(false);
  const [deposits, setDeposits] = useState<{ id: string; reference: string; designation: string | null }[]>([]);
  const [formData, setFormData] = useState({ designation: "", idDepo: "", volume: "" });

  useEffect(() => {
    if (scope.orgId && scope.etbId) {
      fetch(`/api/deposits?idOrg=${scope.orgId}&idEtb=${scope.etbId}&limit=100`)
        .then((r) => r.json())
        .then((d) => setDeposits(d.deposits || []))
        .catch(() => {});
    }
  }, [scope.orgId, scope.etbId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.orgId || !scope.etbId) { toast.error("Sélectionnez une organisation"); return; }
    if (!formData.idDepo) { toast.error("Sélectionnez un dépôt"); return; }
    setIsSaving(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrg: scope.orgId, idEtb: scope.etbId, ...formData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      toast.success("Emplacement créé");
      router.push("/locations");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/locations"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold">Nouvel emplacement</h1>
          <p className="text-sm text-muted-foreground">Créez un emplacement dans un dépôt</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idDepo">Dépôt *</Label>
              <Select value={formData.idDepo} onValueChange={(v) => setFormData({ ...formData, idDepo: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un dépôt" /></SelectTrigger>
                <SelectContent>
                  {deposits.map((d) => (<SelectItem key={d.id} value={d.id}>{d.designation || d.reference}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Désignation</Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="Nom de l'emplacement" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume / Capacité</Label>
              <Input id="volume" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} placeholder="Ex: 100m², 50palettes" />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild><Link href="/locations">Annuler</Link></Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}</Button>
        </div>
      </form>
    </div>
  );
}
