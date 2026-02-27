"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaLibrary } from "@/components/media/media-library";
import { ArticleVariants, VariantInput } from "@/components/articles/article-variants";
import { S3_HOST } from "@/lib/config";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Plus,
  Image as ImageIcon,
  FolderOpen,
  X,
  Loader2,
  Upload,
  ChevronDown,
  ChevronUp,
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

// Helper to generate slug from text (supports Arabic)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // Keep alphanumeric + Arabic
    .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
}

export default function NewArticlePage() {
  const router = useRouter();
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
  const [salePrice, setSalePrice] = useState(0);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [fees, setFees] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [profitType, setProfitType] = useState<"PERCENT" | "VALUE">("VALUE");
  const [taxId, setTaxId] = useState<string>("");

  // Discount state
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");

  // Variants state
  const [variants, setVariants] = useState<VariantInput[]>([]);

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
      taxRate: number,
    ) => {
      const cost = purchase + feesVal;
      let basePrice: number;
      if (type === "PERCENT") {
        basePrice = cost * (1 + margin / 100);
      } else {
        basePrice = cost + margin;
      }
      // Apply tax to get final price
      return basePrice * (1 + taxRate / 100);
    },
    [],
  );

  // Handle designation change - auto-generate slug
  const handleDesignationChange = (value: string) => {
    setDesignation(value);
    setSlug(slugify(value));
  };

  // Fetch categories and tags
  const fetchData = useCallback(async () => {
    if (!scope.orgId || !scope.etbId) return;

    setIsLoading(true);
    try {
      const [categoriesRes, tagsRes, taxesRes] = await Promise.all([
        fetch(`/api/categories?orgId=${scope.orgId}&etbId=${scope.etbId}`),
        fetch("/api/tags"),
        fetch(`/api/taxes?idOrg=${scope.orgId}&idEtb=${scope.etbId}`),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data.tags || []);
      }

      if (taxesRes.ok) {
        const data = await taxesRes.json();
        const taxesList = data.taxes || [];
        setTaxes(taxesList);
        // Set first tax as default
        if (taxesList.length > 0) {
          setTaxId(taxesList[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [scope.orgId, scope.etbId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        : [...prev, categoryId],
    );
  };

  // Toggle tag
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  // Save article
  const handleSave = async (andContinue: boolean = false) => {
    if (!designation.trim()) {
      toast.error("La désignation est requise");
      return;
    }

    if (!scope.orgId || !scope.etbId) {
      toast.error("Organisation non sélectionnée");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idOrg: scope.orgId,
          idEtb: scope.etbId,
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
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success("Article créé avec succès");

      if (andContinue) {
        // Go to edit page for advanced editing
        router.push(`/articles/${data.article.id}`);
      } else {
        router.push("/articles");
      }
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      {/* Header */}
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
          <h1 className="text-xl font-semibold">Nouvel article</h1>
          <p className="text-sm text-muted-foreground">
            Créez un nouvel article
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div
          className="grid gap-4 lg:grid-cols-3"
          style={{ marginBottom: "80px" }}
        >
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
                    onChange={(e) => handleDesignationChange(e.target.value)}
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
                  <p className="text-xs text-muted-foreground">
                    Généré automatiquement, modifiable
                  </p>
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

            {/* Pricing */}
            <Card className="p-4">
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

                {/* Simple pricing - just sale price */}
                {!showAdvancedPricing && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="number"
                        value={salePrice}
                        onChange={(e) =>
                          setSalePrice(parseFloat(e.target.value) || 0)
                        }
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
                )}

                {/* Advanced pricing */}
                {showAdvancedPricing && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Purchase Price */}
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
                                  getTaxRate(),
                                ),
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

                      {/* Fees */}
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
                                  getTaxRate(),
                                ),
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

                    {/* Profit Type & Margin */}
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
                                getTaxRate(),
                              ),
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">
                              Pourcentage %
                            </SelectItem>
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
                                getTaxRate(),
                              ),
                            );
                          }}
                          placeholder="0"
                          step={profitType === "PERCENT" ? "1" : "0.01"}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Tax */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Taxe <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={taxId}
                        onValueChange={(val) => {
                          setTaxId(val);
                          // Get tax rate and recalculate
                          const tax = taxes.find((t) => t.id === val);
                          const taxRate = tax?.value || 0;
                          setSalePrice(
                            calculateSalePrice(
                              purchasePrice,
                              fees,
                              profitMargin,
                              profitType,
                              taxRate,
                            ),
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

                    {/* Calculated Sale Price */}
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
            </Card>

            {/* Discount */}
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Remise</Label>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Requis pour afficher l&apos;article sur SoldX
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Discount Percent */}
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

                  {/* Start Date */}
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

                  {/* End Date */}
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
            </Card>

            {/* Variants */}
            <ArticleVariants variants={variants} onChange={setVariants} />
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
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-1 lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:mt-4">
        <div className="flex flex-col gap-2 sm:flex-row max-w-7xl mx-auto lg:justify-end p-1 md:p-0">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="order-3 sm:order-1"
          >
            Annuler
          </Button>
          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || !designation.trim()}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:mr-2" />
              )}
              <span className="sm:inline">Enregistrer</span>
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving || !designation.trim()}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Enregistrer et continuer</span>
              <span className="sm:hidden">Enregistrer +</span>
            </Button>
          </div>
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
