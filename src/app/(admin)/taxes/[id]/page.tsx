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

export default function EditTaxPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ designation: "", value: "", taxType: "TVA" });
  const [reference, setReference] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/taxes/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Non trouvé");
        const data = await res.json();
        setReference(data.tax.reference);
        setFormData({
          designation: data.tax.designation || "",
          value: data.tax.value != null ? String(data.tax.value) : "",
          taxType: data.tax.taxType || "TVA",
        });
      } catch { toast.error("Erreur"); router.push("/taxes"); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.designation) { toast.error("La désignation est requise"); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/taxes/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation: formData.designation,
          value: formData.value ? parseFloat(formData.value) : null,
          taxType: formData.taxType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Taxe mise à jour");
      router.push("/taxes");
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Erreur"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="space-y-6 max-w-md mx-auto"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/taxes"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{formData.designation || "Taxe"}</h1>
          <Badge variant="outline" className="font-mono">{reference}</Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Désignation *</Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
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
                <Label>Valeur (%)</Label>
                <Input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
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
