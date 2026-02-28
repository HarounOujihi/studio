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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [designation, setDesignation] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/units/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Non trouvé");
        const data = await res.json();
        setReference(data.unit.reference);
        setDesignation(data.unit.designation || "");
      } catch { toast.error("Erreur"); router.push("/units"); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation) { toast.error("La désignation est requise"); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/units/${resolvedParams.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designation }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Unité mise à jour");
      router.push("/units");
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Erreur"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="space-y-6 max-w-md mx-auto"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/units"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{designation || "Unité"}</h1>
          <Badge variant="outline" className="font-mono">{reference}</Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="designation">Désignation *</Label><Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} /></div>
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
