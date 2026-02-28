"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useScope } from "@/hooks/use-scope";

export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const scope = useScope();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deposits, setDeposits] = useState<{ id: string; reference: string; designation: string | null }[]>([]);
  const [formData, setFormData] = useState({ designation: "", idDepo: "", volume: "" });
  const [reference, setReference] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, depRes] = await Promise.all([
          fetch(`/api/locations/${resolvedParams.id}`),
          fetch(`/api/deposits?idOrg=${scope.orgId}&idEtb=${scope.etbId}&limit=100`),
        ]);
        if (!locRes.ok) throw new Error("Non trouvé");
        const locData = await locRes.json();
        const depData = await depRes.json();
        setReference(locData.location.reference);
        setFormData({
          designation: locData.location.designation || "",
          idDepo: locData.location.idDepo,
          volume: locData.location.volume || "",
        });
        setDeposits(depData.deposits || []);
      } catch { toast.error("Erreur"); router.push("/locations"); }
      finally { setIsLoading(false); }
    };
    if (scope.orgId && scope.etbId) fetchData();
  }, [resolvedParams.id, router, scope.orgId, scope.etbId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/locations/${resolvedParams.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Emplacement mis à jour");
      router.push("/locations");
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Erreur"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="space-y-6 max-w-md mx-auto"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/locations"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{formData.designation || "Emplacement"}</h1>
          <Badge variant="outline" className="font-mono">{reference}</Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dépôt *</Label>
              <Select value={formData.idDepo} onValueChange={(v) => setFormData({ ...formData, idDepo: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {deposits.map((d) => (<SelectItem key={d.id} value={d.id}>{d.designation || d.reference}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Désignation</Label><Input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} /></div>
            <div className="space-y-2"><Label>Volume / Capacité</Label><Input value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild><Link href="/locations">Annuler</Link></Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}</Button>
        </div>
      </form>
    </div>
  );
}
