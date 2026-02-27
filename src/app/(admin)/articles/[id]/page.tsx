"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaLibrary } from "@/components/media/media-library";
import { S3_HOST } from "@/lib/config";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  FolderOpen,
  X,
  Loader2,
  Upload,
  ChevronDown,
  ChevronUp,
  Package,
  Palette,
  Layers,
  ExternalLink,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useScope } from "@/hooks/use-scope";

type Category = {
  id: string;
  designation: string | null;
  reference: string;
  children?: Category[];
};

type Tag = {
  id: string;
  name: string;
  nameFr: string | null;
};

type Tax = {
  id: string;
  designation: string | null;
  value: number;
};

type VariantType = "COLOR" | "SIZE" | "NUMBER" | "TEXT";

interface VariantData {
  id: string;
  type: VariantType;
  value: string;
  designation: string;
  image?: string | null;
  idSubArticle?: string;
  children?: VariantData[];
}

type PricingData = {
  id: string;
  purchasePrice: number;
  fees: number;
  profitType: "PERCENT" | "VALUE";
  profitMargin: number;
  salePrice: number;
  effectDate: string;
  idTax?: string | null;
  createdAt?: string;
};

type DiscountData = {
  id: string;
  reference: string;
  value: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
};

// Recursive category tree component
function CategoryTree({
  categories,
  selectedCategories,
  onToggle,
  level = 0,
}: {
  categories: Category[];
  selectedCategories: string[];
  onToggle: (id: string) => void;
  level?: number;
}) {
  return (
    <>
      {categories.map((category) => (
        <div key={category.id}>
          <label
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => onToggle(category.id)}
            />
            <span className="text-sm truncate">
              {category.designation || category.reference}
            </span>
          </label>
          {category.children && category.children.length > 0 && (
            <CategoryTree
              categories={category.children}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}

// Color picker component
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const presetColors = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
    "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#000000",
    "#FFFFFF", "#7C3AED", "#06B6D4", "#84CC16", "#F43F5E",
  ];

  return (
    <div className="space-y-2 p-2 bg-muted/50 rounded-md">
      <div className="flex gap-1 flex-wrap">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 transition-all ${
              value === color
                ? "border-primary scale-110"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}

// Variant item component for edit mode - single level only
function VariantEditItem({
  variant,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  hasChildren,
  subArticleId,
  isDeleting,
}: {
  variant: VariantData;
  onChange: (variant: VariantData) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  hasChildren?: boolean;
  subArticleId?: string;
  isDeleting?: boolean;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const router = useRouter();

  const getVariantTypeIcon = (type: VariantType) => {
    switch (type) {
      case "COLOR":
        return <Palette className="w-4 h-4" />;
      case "SIZE":
        return <Package className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const handleColorChange = (hex: string) => {
    const updated = { ...variant, value: hex };
    onChange(updated);
  };

  return (
    <div className={`p-3 bg-muted/30 rounded-lg space-y-3 ${isDeleting ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort buttons */}
        <div className="flex flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp || isDeleting}
            className="h-5 w-5"
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown || isDeleting}
            className="h-5 w-5"
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>

        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />

        <Select
          value={variant.type}
          onValueChange={(val: VariantType) => onChange({ ...variant, type: val })}
          disabled={isDeleting}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COLOR">Couleur</SelectItem>
            <SelectItem value="SIZE">Taille</SelectItem>
            <SelectItem value="NUMBER">Numéro</SelectItem>
            <SelectItem value="TEXT">Texte</SelectItem>
          </SelectContent>
        </Select>

        <span className="shrink-0">{getVariantTypeIcon(variant.type)}</span>

        {variant.type === "COLOR" && (
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-8 h-8 rounded border-2 border-muted-foreground/20 hover:border-primary transition-colors shrink-0"
            style={{ backgroundColor: variant.value || "#ccc" }}
            disabled={isDeleting}
          />
        )}

        <Input
          value={variant.value}
          onChange={(e) => onChange({ ...variant, value: e.target.value })}
          placeholder="Valeur"
          className="h-8 flex-1 min-w-[80px]"
          disabled={isDeleting}
        />

        <Input
          value={variant.designation}
          onChange={(e) => onChange({ ...variant, designation: e.target.value })}
          placeholder="Affichage"
          className="h-8 flex-1 min-w-[80px]"
          disabled={isDeleting}
        />

        {/* Link to sub-article if has children */}
        {hasChildren && subArticleId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/articles/${subArticleId}`)}
            className="h-8 shrink-0"
          >
            <Layers className="w-3 h-3 mr-1" />
            Sous-variants
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive shrink-0"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Color picker */}
      {variant.type === "COLOR" && showColorPicker && !isDeleting && (
        <ColorPicker
          value={variant.value || "#000000"}
          onChange={handleColorChange}
        />
      )}

      {/* Children indicator */}
      {hasChildren && (
        <p className="text-xs text-muted-foreground">
          Cette variante a des sous-variantes. Cliquez sur &quot;Sous-variants&quot; pour les gérer.
        </p>
      )}
    </div>
  );
}

// Variants section for edit page - single level only
function VariantsSection({
  variants,
  onChange,
  onRefresh,
}: {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  onRefresh: () => void;
}) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const updateVariant = (index: number, variant: VariantData) => {
    const newVariants = [...variants];
    newVariants[index] = variant;
    onChange(newVariants);
  };

  const moveVariant = (index: number, direction: "up" | "down") => {
    const newVariants = [...variants];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= variants.length) return;
    [newVariants[index], newVariants[targetIndex]] = [
      newVariants[targetIndex],
      newVariants[index],
    ];
    onChange(newVariants);
  };

  const addVariant = () => {
    const newVariant: VariantData = {
      id: `new-${nanoid()}`,
      type: "COLOR",
      value: "",
      designation: "",
      children: [],
    };
    onChange([...variants, newVariant]);
  };

  const deleteVariant = async (index: number) => {
    const variant = variants[index];

    // If it's a new variant (not saved yet), just remove from list
    if (variant.id.startsWith("new-")) {
      onChange(variants.filter((_, i) => i !== index));
      return;
    }

    // Check if variant has children
    if (variant.children && variant.children.length > 0) {
      toast.error("Cette variante a des sous-variantes. Supprimez d'abord les sous-variantes.");
      return;
    }

    // Confirm deletion
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la variante "${variant.designation}" ?\n\nLe sous-article associé sera également supprimé.`)) {
      return;
    }

    // Mark as deleting
    setDeletingIds((prev) => new Set(prev).add(variant.id));

    try {
      const response = await fetch(`/api/variants/${variant.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("movements") || data.error?.includes("orders")) {
          throw new Error("Cette variante ne peut pas être supprimée car elle est utilisée dans des commandes ou mouvements.");
        }
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Variante supprimée");
      onRefresh(); // Refresh to get updated list
    } catch (error: unknown) {
      console.error("Error deleting variant:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(variant.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {variants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune variante pour cet article</p>
          <p className="text-sm">Les variantes permettent de créer des déclinaisons (couleur, taille...)</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <VariantEditItem
              key={variant.id}
              variant={variant}
              onChange={(v) => updateVariant(index, v)}
              onDelete={() => deleteVariant(index)}
              onMoveUp={() => moveVariant(index, "up")}
              onMoveDown={() => moveVariant(index, "down")}
              canMoveUp={index > 0}
              canMoveDown={index < variants.length - 1}
              hasChildren={variant.children && variant.children.length > 0}
              subArticleId={variant.idSubArticle}
              isDeleting={deletingIds.has(variant.id)}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une variante
      </Button>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>• Les variantes créent automatiquement des sous-articles.</p>
        <p>• Pour gérer les sous-variantes, cliquez sur &quot;Sous-variants&quot;.</p>
        <p>• Une variante utilisée dans des commandes ne peut pas être supprimée.</p>
      </div>
    </div>
  );
}

// Lot Management Section
function LotManagementSection() {
  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium text-amber-700 dark:text-amber-400">
              Fonctionnalité non disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              La gestion des lots n&apos;est pas prise en charge dans Studio.
              Pour gérer les lots de cet article, veuillez utiliser la plateforme SAWI.
            </p>
            <a
              href="https://sawi.mahd.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Accéder à SAWI
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-muted-foreground">
              Utilisez les mêmes identifiants pour vous connecter.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-medium mb-3">Qu&apos;est-ce que la gestion des lots ?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          La gestion des lots permet de suivre les articles par numéro de lot, date de péremption,
          et numéro de série. Cette fonctionnalité est particulièrement utile pour :
        </p>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Le suivi des produits périssables
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            La traçabilité des produits
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            La gestion des garanties
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Le contrôle qualité
          </li>
        </ul>
      </Card>
    </div>
  );
}

// Helper to generate slug from text (supports Arabic)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // Keep alphanumeric + Arabic
    .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const scope = useScope();

  // Form state
  const [designation, setDesignation] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [media, setMedia] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublish, setIsPublish] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  // Pricing state
  const [pricings, setPricings] = useState<PricingData[]>([]);
  const [activePricing, setActivePricing] = useState<PricingData | null>(null);
  const [salePrice, setSalePrice] = useState(0);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [fees, setFees] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [profitType, setProfitType] = useState<"PERCENT" | "VALUE">("VALUE");
  const [taxId, setTaxId] = useState<string>("");

  // Discount state
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<DiscountData | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");

  // Variants state
  const [variants, setVariants] = useState<VariantData[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState("general");

  // Get tax rate from selected tax
  const getTaxRate = useCallback(() => {
    const selectedTax = taxes.find((t) => t.id === taxId);
    return selectedTax?.value || 0;
  }, [taxes, taxId]);

  // Calculate sale price with tax
  const calculateSalePrice = useCallback(
    (
      purchase: number,
      feesVal: number,
      margin: number,
      type: "PERCENT" | "VALUE",
      taxRate: number
    ) => {
      const cost = purchase + feesVal;
      let basePrice: number;
      if (type === "PERCENT") {
        basePrice = cost * (1 + margin / 100);
      } else {
        basePrice = cost + margin;
      }
      return basePrice * (1 + taxRate / 100);
    },
    []
  );

  // Fetch article data
  const fetchArticle = useCallback(async () => {
    if (!articleId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`);
      if (!response.ok) {
        throw new Error("Article non trouvé");
      }

      const data = await response.json();

      // Set form values
      setDesignation(data.article.designation || "");
      setSlug(data.article.slug || "");
      setShortDescription(data.article.shortDescription || "");
      setMedia(data.article.media || "");
      setIsPublish(data.article.isPublish || false);
      setSelectedCategories(data.categoryIds || []);
      setSelectedTags(data.tagIds || []);

      // Pricing
      setPricings(data.pricings || []);
      setActivePricing(data.activePricing || null);
      if (data.activePricing) {
        setSalePrice(data.activePricing.salePrice || 0);
        setPurchasePrice(data.activePricing.purchasePrice || 0);
        setFees(data.activePricing.fees || 0);
        setProfitMargin(data.activePricing.profitMargin || 0);
        setProfitType(data.activePricing.profitType || "VALUE");
        setTaxId(data.activePricing.idTax || "");
      }

      // Discount
      setDiscounts(data.discounts || []);
      setActiveDiscount(data.activeDiscount || null);
      if (data.activeDiscount) {
        setDiscountPercent(data.activeDiscount.value || 0);
        setDiscountStartDate(
          data.activeDiscount.startDate
            ? new Date(data.activeDiscount.startDate).toISOString().split("T")[0]
            : ""
        );
        setDiscountEndDate(
          data.activeDiscount.endDate
            ? new Date(data.activeDiscount.endDate).toISOString().split("T")[0]
            : ""
        );
      }

      // Variants
      setVariants(data.variants || []);

      // Fetch categories, tags, taxes
      const [categoriesRes, tagsRes, taxesRes] = await Promise.all([
        fetch(`/api/categories?orgId=${data.article.idOrg}&etbId=${data.article.idEtb}`),
        fetch("/api/tags"),
        fetch(`/api/taxes?idOrg=${data.article.idOrg}&idEtb=${data.article.idEtb}`),
      ]);

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData.categories || []);
      }

      if (tagsRes.ok) {
        const tagData = await tagsRes.json();
        setTags(tagData.tags || []);
      }

      if (taxesRes.ok) {
        const taxData = await taxesRes.json();
        const taxesList = taxData.taxes || [];
        setTaxes(taxesList);
        if (!taxId && taxesList.length > 0 && !data.pricing?.idTax) {
          setTaxId(taxesList[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Erreur lors du chargement de l'article");
      router.push("/articles");
    } finally {
      setIsLoading(false);
    }
  }, [articleId, router, taxId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Handle media selection
  const handleMediaSelect = (keys: string[]) => {
    if (keys.length > 0) setMedia(keys[0]);
    setMediaLibraryOpen(false);
  };

  // Handle media upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image requis");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", scope.orgId || "temp");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const uploadedFile = data.files?.[0] || data.file;
      setMedia(uploadedFile?.key || "");
      toast.success("Image téléchargée");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur de téléchargement");
    }
  };

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle tag
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Save article
  const handleSave = async () => {
    if (!designation.trim()) {
      toast.error("La désignation est requise");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation,
          slug: slug || slugify(designation),
          shortDescription,
          media,
          categoryIds: selectedCategories,
          tagIds: selectedTags,
          isPublish,
          // Pricing fields
          salePrice,
          purchasePrice,
          fees,
          profitMargin,
          profitType,
          taxId,
          // Discount fields
          discountPercent,
          discountStartDate,
          discountEndDate,
          // Variants
          variants,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("Article mis à jour avec succès");
    } catch (error: unknown) {
      console.error("Error saving article:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Modifier l&apos;article</h1>
            <p className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
              {designation || "Sans titre"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !designation.trim()}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="general" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Général</span>
            <span className="sm:hidden">Général</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Prix</span>
            <span className="sm:hidden">Prix</span>
          </TabsTrigger>
          <TabsTrigger value="discount" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Remise</span>
            <span className="sm:hidden">Remise</span>
          </TabsTrigger>
          <TabsTrigger value="variants" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Variantes</span>
            <span className="sm:hidden">Variantes</span>
            {variants.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {variants.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lots" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Lots</span>
            <span className="sm:hidden">Lots</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-0">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Designation & Slug */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-xs">
                      Désignation <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="designation"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        if (!slug) setSlug(slugify(e.target.value));
                      }}
                      placeholder="Nom de l'article"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-xs">
                      Slug <span className="text-muted-foreground">(URL)</span>
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-de-l-article"
                      className="text-sm font-mono"
                    />
                  </div>
                </div>
              </Card>

              {/* Short description */}
              <Card className="p-4">
                <div className="space-y-2">
                  <Label htmlFor="shortDescription" className="text-xs">
                    Description courte
                  </Label>
                  <Textarea
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Description courte de l'article..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </Card>

              {/* Categories */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Label className="text-xs">Catégories</Label>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune catégorie disponible
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto -mx-2">
                      <CategoryTree
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onToggle={toggleCategory}
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Tags */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Tags</Label>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Important pour une meilleure visibilité sur SoldX
                    </p>
                  </div>
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun tag disponible
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs transition-colors ${
                            selectedTags.includes(tag.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {tag.nameFr || tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Media */}
              <Card className="p-4">
                <Label className="text-xs mb-2 block">Image</Label>
                {media ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={`${S3_HOST}/${media}`}
                      alt="Article"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setMediaLibraryOpen(true)}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Bibliothèque
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setMedia("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/20">
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <Button
                        className="mx-auto"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMediaLibraryOpen(true)}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Bibliothèque
                      </Button>
                      <label className="mx-auto">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-1" />
                            Télécharger
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )}
              </Card>

              {/* Publish status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Publié</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible publiquement
                    </p>
                  </div>
                  <Switch checked={isPublish} onCheckedChange={setIsPublish} />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-0">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Prix</h2>
                  <p className="text-sm text-muted-foreground">
                    Gérez les prix de votre article
                  </p>
                </div>
                {activePricing && (
                  <Badge variant="default" className="bg-green-600">
                    Prix actif
                  </Badge>
                )}
              </div>

              {/* Active Pricing Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Prix de vente</Label>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {showAdvancedPricing ? "Simple" : "Avancé"}
                    {showAdvancedPricing ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Simple pricing */}
                {!showAdvancedPricing && (
                  <div className="relative">
                    <Input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pr-8"
                      step="0.01"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      TND
                    </span>
                  </div>
                )}

                {/* Advanced pricing */}
                {showAdvancedPricing && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Prix d&apos;achat
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={purchasePrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPurchasePrice(val);
                              setSalePrice(
                                calculateSalePrice(
                                  val,
                                  fees,
                                  profitMargin,
                                  profitType,
                                  getTaxRate()
                                )
                              );
                            }}
                            placeholder="0.00"
                            className="pr-8"
                            step="0.01"
                            min="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            TND
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Frais
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={fees}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setFees(val);
                              setSalePrice(
                                calculateSalePrice(
                                  purchasePrice,
                                  val,
                                  profitMargin,
                                  profitType,
                                  getTaxRate()
                                )
                              );
                            }}
                            placeholder="0.00"
                            className="pr-8"
                            step="0.01"
                            min="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            TND
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Type de marge
                        </Label>
                        <Select
                          value={profitType}
                          onValueChange={(val: "PERCENT" | "VALUE") => {
                            setProfitType(val);
                            setSalePrice(
                              calculateSalePrice(
                                purchasePrice,
                                fees,
                                profitMargin,
                                val,
                                getTaxRate()
                              )
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">Pourcentage %</SelectItem>
                            <SelectItem value="VALUE">Valeur fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Marge {profitType === "PERCENT" ? "(%)" : "(TND)"}
                        </Label>
                        <Input
                          type="number"
                          value={profitMargin}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setProfitMargin(val);
                            setSalePrice(
                              calculateSalePrice(
                                purchasePrice,
                                fees,
                                val,
                                profitType,
                                getTaxRate()
                              )
                            );
                          }}
                          placeholder="0"
                          step={profitType === "PERCENT" ? "1" : "0.01"}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Taxe <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={taxId}
                        onValueChange={(val) => {
                          setTaxId(val);
                          const tax = taxes.find((t) => t.id === val);
                          const taxRate = tax?.value || 0;
                          setSalePrice(
                            calculateSalePrice(
                              purchasePrice,
                              fees,
                              profitMargin,
                              profitType,
                              taxRate
                            )
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une taxe" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxes.map((tax) => (
                            <SelectItem key={tax.id} value={tax.id}>
                              {tax.designation || tax.id} ({tax.value}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Prix de vente calculé
                        </Label>
                        <span className="text-lg font-semibold">
                          {salePrice.toFixed(2)} TND
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing History */}
              {pricings.length > 1 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Historique des prix</h3>
                  <div className="space-y-2">
                    {pricings.slice(1).map((pricing) => (
                      <div
                        key={pricing.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <div>
                          <span className="font-medium">{pricing.salePrice.toFixed(2)} TND</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(pricing.effectDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Ancien
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Discount Tab */}
        <TabsContent value="discount" className="mt-0">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Remise</h2>
                  <p className="text-sm text-muted-foreground">
                    Gérez les remises de votre article
                  </p>
                </div>
                {activeDiscount && (
                  <Badge variant="default" className="bg-green-600">
                    Remise active
                  </Badge>
                )}
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-500">
                Requis pour afficher l&apos;article sur SoldX
              </p>

              {/* Active Discount Form */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Pourcentage (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="pr-8"
                        step="1"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Date de début
                    </Label>
                    <Input
                      type="date"
                      value={discountStartDate}
                      onChange={(e) => setDiscountStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Date de fin
                    </Label>
                    <Input
                      type="date"
                      value={discountEndDate}
                      onChange={(e) => setDiscountEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Discount History */}
              {discounts.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Historique des remises</h3>
                  <div className="space-y-2">
                    {discounts.map((discount) => (
                      <div
                        key={discount.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <div>
                          <span className="font-medium">{discount.value}%</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(discount.startDate).toLocaleDateString("fr-FR")} - {new Date(discount.endDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        {activeDiscount?.id === discount.id ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {new Date(discount.endDate) < new Date() ? "Expirée" : "Planifiée"}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="mt-0">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Variantes</h2>
                  <p className="text-sm text-muted-foreground">
                    Gérez les déclinaisons de votre article
                  </p>
                </div>
                {variants.length > 0 && (
                  <Badge variant="secondary">{variants.length} variante(s)</Badge>
                )}
              </div>
              <VariantsSection
                variants={variants}
                onChange={setVariants}
                onRefresh={fetchArticle}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Lot Management Tab */}
        <TabsContent value="lots" className="mt-0">
          <Card className="p-4">
            <LotManagementSection />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky footer on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 lg:hidden">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !designation.trim()}
            className="flex-1"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        orgId={scope.orgId || ""}
        onSelect={handleMediaSelect}
        multiple={false}
        fileType="images"
        title="Sélectionner une image"
      />
    </div>
  );
}
