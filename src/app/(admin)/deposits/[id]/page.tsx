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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ designation: "", type: "WAREHOUSE", isDefault: false, street: "", street2: "", city: "", state: "", zipCode: "", country: "" });
  const [reference, setReference] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/deposits/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Non trouvé");
        const data = await res.json();
        setReference(data.deposit.reference);
        setFormData({
          designation: data.deposit.designation || "",
          type: data.deposit.type,
          isDefault: data.deposit.isDefault || false,
          street: data.deposit.address?.street || "",
          street2: data.deposit.address?.street2 || "",
          city: data.deposit.address?.city || "",
          state: data.deposit.address?.state || "",
          zipCode: data.deposit.address?.zipCode || "",
          country: data.deposit.address?.country || "",
        });
      } catch { toast.error("Erreur"); router.push("/deposits"); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/deposits/${resolvedParams.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Dépôt mis à jour");
      router.push("/deposits");
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Erreur"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="space-y-6 max-w-2xl mx-auto"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/deposits"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{formData.designation || "Dépôt"}</h1>
          <Badge variant="outline" className="font-mono">{reference}</Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Désignation</Label><Input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
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
            <div className="space-y-2"><Label>Adresse</Label><Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ville</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>Code postal</Label><Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Pays</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
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
