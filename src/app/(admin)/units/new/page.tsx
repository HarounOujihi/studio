"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useScope } from "@/hooks/use-scope";

export default function NewUnitPage() {
  const router = useRouter();
  const scope = useScope();
  const [isSaving, setIsSaving] = useState(false);
  const [designation, setDesignation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.orgId || !scope.etbId) { toast.error("Sélectionnez une organisation"); return; }
    if (!designation) { toast.error("La désignation est requise"); return; }
    setIsSaving(true);
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrg: scope.orgId, idEtb: scope.etbId, designation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      toast.success("Unité créée");
      router.push("/units");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/units"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold">Nouvelle unité</h1>
          <p className="text-sm text-muted-foreground">Ex: Kg, Pièce, Mètre, Litre...</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Désignation *</Label>
              <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Kilogramme, Pièce, Mètre..." />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild><Link href="/units">Annuler</Link></Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}</Button>
        </div>
      </form>
    </div>
  );
}
