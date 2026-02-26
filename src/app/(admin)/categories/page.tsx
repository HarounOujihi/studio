"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { Plus, FolderOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentEtbIdAtom, currentOrgIdAtom } from "@/lib/store/auth-oidc";
import { CategoryTree, CategoryTreeNode } from "@/components/categories/category-tree";
import { CategoryForm, DeleteConfirmDialog } from "@/components/categories/category-form";
import { toast } from "sonner";

export default function CategoriesPage() {
  const etbId = useAtomValue(currentEtbIdAtom);
  const orgId = useAtomValue(currentOrgIdAtom);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryTreeNode | null>(null);

  // Find parent category by id
  const findCategoryById = useCallback(
    (id: string, nodes: CategoryTreeNode[]): CategoryTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findCategoryById(id, node.children);
        if (found) return found;
      }
      return null;
    },
    []
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!etbId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/categories?etbId=${etbId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement des catégories");
      }

      setCategories(data.categories || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  }, [etbId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle add root category
  const handleAddCategory = () => {
    setEditingCategory(null);
    setParentId(null);
    setFormOpen(true);
  };

  // Handle add subcategory
  const handleAddChild = (pId: string) => {
    setEditingCategory(null);
    setParentId(pId);
    setFormOpen(true);
  };

  // Handle edit
  const handleEdit = (category: CategoryTreeNode) => {
    setEditingCategory(category);
    setParentId(null);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = (category: CategoryTreeNode) => {
    setDeletingCategory(category);
    setDeleteOpen(true);
  };

  // Handle reorder
  const handleReorder = async (
    updates: Array<{ id: string; sortIndex: number; idParent: string | null }>
  ) => {
    if (!etbId) return;

    try {
      const response = await fetch(`/api/categories?etbId=${etbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la réorganisation");
      }
      
      // Refresh to get updated order
      fetchCategories();
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Erreur lors de la réorganisation des catégories");
    }
  };

  // Get parent category for form
  const parentCategory = parentId ? findCategoryById(parentId, categories) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold">Catégories</h1>
            <p className="text-sm text-muted-foreground">
              Glisser pour réorganiser
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchCategories}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={handleAddCategory} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Ajouter une catégorie</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchCategories} className="mt-4">
              Réessayer
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">Aucune catégorie</h2>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Créez votre première catégorie pour organiser vos produits. Chaque catégorie doit être liée à une catégorie globale.
            </p>
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une catégorie
            </Button>
          </div>
        ) : (
          <CategoryTree
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onReorder={handleReorder}
          />
        )}
      </main>

      {/* Form Sheet */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        parentId={parentId}
        parentCategory={parentCategory}
        etbId={etbId || ""}
        orgId={orgId || ""}
        onSuccess={fetchCategories}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={deletingCategory}
        etbId={etbId || ""}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
