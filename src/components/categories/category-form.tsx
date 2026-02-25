"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import type { CategoryTreeNode } from "./category-tree";

type GlobalCategory = {
  id: string;
  name: string;
  nameFr: string | null;
  slug: string;
  iconName: string | null;
};

// Helper to render Lucide icon by name
function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return <HelpCircle className={className} />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <HelpCircle className={className} />;

  return <Icon className={className} />;
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryTreeNode | null;
  parentId: string | null;
  parentCategory: CategoryTreeNode | null;
  etbId: string;
  orgId: string;
  onSuccess: () => void;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  parentId,
  parentCategory,
  etbId,
  orgId,
  onSuccess,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [formData, setFormData] = useState({
    designation: "",
    slug: "",
    globalCategoryId: "",
    description: "",
    shortDescription: "",
    logo: null as string | null,
    image: null as string | null,
  });

  const isEditing = !!category;

  // Fetch global categories on mount
  useEffect(() => {
    const fetchGlobalCategories = async () => {
      try {
        const response = await fetch("/api/global-categories");
        const data = await response.json();
        setGlobalCategories(data.globalCategories || []);
      } catch (error) {
        console.error("Erreur lors du chargement des catégories globales:", error);
      }
    };
    fetchGlobalCategories();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (category) {
      setFormData({
        designation: category.designation || "",
        slug: category.slug || "",
        globalCategoryId: category.globalCategoryId || "",
        description: "",
        shortDescription: "",
        logo: category.logo || null,
        image: category.image || null,
      });
    } else {
      setFormData({
        designation: "",
        slug: "",
        globalCategoryId: "",
        description: "",
        shortDescription: "",
        logo: null,
        image: null,
      });
    }
  }, [category, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from designation
    if (field === "designation") {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designation.trim()) {
      alert("Le nom est requis");
      return;
    }

    if (!formData.globalCategoryId) {
      alert("Veuillez sélectionner une catégorie globale");
      return;
    }

    setLoading(true);
    try {
      const url = category
        ? `/api/categories/${category.id}?etbId=${etbId}`
        : `/api/categories?etbId=${etbId}`;

      const body = {
        designation: formData.designation || null,
        slug: formData.slug || null,
        globalCategoryId: formData.globalCategoryId,
        description: formData.description || null,
        shortDescription: formData.shortDescription || null,
        logo: formData.logo,
        image: formData.image,
        ...(parentId && { idParent: parentId }),
      };

      const response = await fetch(url, {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="
          h-[85vh] rounded-t-xl
          sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-full sm:max-w-md lg:max-w-lg
          sm:rounded-none sm:border-t-0 sm:border-l
          sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right
          overflow-y-auto
        "
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing
              ? "Modifier la catégorie"
              : parentId
              ? "Ajouter une sous-catégorie"
              : "Ajouter une catégorie"}
          </SheetTitle>
          <SheetDescription>
            {parentId && parentCategory && (
              <span className="text-muted-foreground">
                Sous: {parentCategory.designation || parentCategory.reference}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 p-2">
          {/* Images - Mobile: stacked, Desktop: side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Logo"
              value={formData.logo}
              onChange={(key) => setFormData((prev) => ({ ...prev, logo: key }))}
              orgId={orgId}
              aspectRatio="square"
            />
            <ImageUpload
              label="Image de couverture"
              value={formData.image}
              onChange={(key) => setFormData((prev) => ({ ...prev, image: key }))}
              orgId={orgId}
              aspectRatio="landscape"
            />
          </div>

          {/* Global Category - Required */}
          <div className="space-y-2">
            <Label htmlFor="globalCategoryId">
              Catégorie globale <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.globalCategoryId}
              onValueChange={(value) => handleChange("globalCategoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie globale" />
              </SelectTrigger>
              <SelectContent>
                {globalCategories.map((gc) => (
                  <SelectItem key={gc.id} value={gc.id}>
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={gc.iconName} className="h-4 w-4" />
                      <span>{gc.nameFr || gc.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name and Slug - Mobile: stacked, Desktop: side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="Nom de la catégorie"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="slug-categorie"
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleChange("shortDescription", e.target.value)}
              placeholder="Brève description"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description complète</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Description détaillée"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-background py-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryTreeNode | null;
  etbId: string;
  onSuccess: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  category,
  etbId,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!category) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${category.id}?etbId=${etbId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la catégorie</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer &quot;{category?.designation || category?.reference}
            &quot; ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
