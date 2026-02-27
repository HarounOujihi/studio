"use client";

import { useState, useMemo, useCallback } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Palette,
  X,
  Layers,
  List,
  Sparkles,
} from "lucide-react";

export type VariantType = "COLOR" | "SIZE" | "NUMBER" | "TEXT";

export interface VariantInput {
  id: string;
  type: VariantType;
  value: string;
  designation: string;
  image?: string;
  colorHex?: string;
  children?: VariantInput[];
}

// Dimension for generating variants
interface DimensionValue {
  id: string;
  value: string;
  designation: string;
  colorHex?: string;
}

interface Dimension {
  id: string;
  type: VariantType;
  name: string;
  values: DimensionValue[];
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
    <div className="space-y-2">
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
          placeholder="#000000 ou red"
          className="flex-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}

// Dimension value item
function DimensionValueItem({
  value,
  type,
  onChange,
  onDelete,
}: {
  value: DimensionValue;
  type: VariantType;
  onChange: (val: DimensionValue) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />

      {type === "COLOR" && (
        <div
          className="w-6 h-6 rounded border shrink-0"
          style={{ backgroundColor: value.colorHex || "#ccc" }}
        />
      )}

      <Input
        value={value.value}
        onChange={(e) => onChange({ ...value, value: e.target.value })}
        placeholder="Valeur"
        className="h-8 text-xs flex-1 min-w-0"
      />

      <Input
        value={value.designation}
        onChange={(e) => onChange({ ...value, designation: e.target.value })}
        placeholder="Affichage"
        className="h-8 text-xs flex-1 min-w-0"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-8 w-8 text-destructive shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Add value modal for COLOR type
function AddColorValueModal({
  onAdd,
}: {
  onAdd: (value: DimensionValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [designation, setDesignation] = useState("");
  const [colorHex, setColorHex] = useState("#000000");

  const handleAdd = () => {
    if (!value || !designation) return;
    onAdd({
      id: `val-${nanoid()}`,
      value,
      designation,
      colorHex,
    });
    setValue("");
    setDesignation("");
    setColorHex("#000000");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full">
          <Plus className="w-3 h-3 mr-1" />
          Ajouter une couleur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Ajouter une couleur</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <ColorPicker value={colorHex} onChange={setColorHex} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Valeur</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="red, blue..."
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Affichage</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Rouge, Bleu..."
                className="h-8"
              />
            </div>
          </div>
          <Button type="button" onClick={handleAdd} className="w-full">
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dimension card
function DimensionCard({
  dimension,
  onChange,
  onDelete,
}: {
  dimension: Dimension;
  onChange: (dim: Dimension) => void;
  onDelete: () => void;
}) {
  const addValue = () => {
    const newValue: DimensionValue = {
      id: `val-${nanoid()}`,
      value: "",
      designation: "",
      colorHex: dimension.type === "COLOR" ? "#000000" : undefined,
    };
    onChange({ ...dimension, values: [...dimension.values, newValue] });
  };

  const updateValue = (index: number, val: DimensionValue) => {
    const newValues = [...dimension.values];
    newValues[index] = val;
    onChange({ ...dimension, values: newValues });
  };

  const deleteValue = (index: number) => {
    onChange({
      ...dimension,
      values: dimension.values.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="p-3">
      <div className="space-y-3">
        {/* Dimension header */}
        <div className="flex items-center gap-2 flex-wrap">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

          <Select
            value={dimension.type}
            onValueChange={(val: VariantType) =>
              onChange({ ...dimension, type: val, name: getDimensionName(val) })
            }
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COLOR">
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3" /> Couleur
                </span>
              </SelectItem>
              <SelectItem value="SIZE">Taille</SelectItem>
              <SelectItem value="NUMBER">Numéro</SelectItem>
              <SelectItem value="TEXT">Texte</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={dimension.name}
            onChange={(e) => onChange({ ...dimension, name: e.target.value })}
            className="h-8 flex-1 min-w-[100px]"
            placeholder="Nom"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Values */}
        <div className="space-y-2">
          {dimension.type === "COLOR" ? (
            <>
              {dimension.values.map((val, index) => (
                <DimensionValueItem
                  key={val.id}
                  value={val}
                  type={dimension.type}
                  onChange={(v) => updateValue(index, v)}
                  onDelete={() => deleteValue(index)}
                />
              ))}
              <AddColorValueModal
                onAdd={(val) =>
                  onChange({ ...dimension, values: [...dimension.values, val] })
                }
              />
            </>
          ) : (
            <>
              {dimension.values.map((val, index) => (
                <DimensionValueItem
                  key={val.id}
                  value={val}
                  type={dimension.type}
                  onChange={(v) => updateValue(index, v)}
                  onDelete={() => deleteValue(index)}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addValue}
                className="w-full"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter une valeur
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function getDimensionName(type: VariantType): string {
  switch (type) {
    case "COLOR":
      return "Couleur";
    case "SIZE":
      return "Taille";
    case "NUMBER":
      return "Numéro";
    case "TEXT":
      return "Texte";
    default:
      return "Dimension";
  }
}

// Generate all combinations from dimensions
function generateCombinations(dimensions: Dimension[]): VariantInput[] {
  if (dimensions.length === 0) return [];

  const validDimensions = dimensions.filter(
    (d) => d.values.length > 0 && d.values.every((v) => v.value && v.designation)
  );

  if (validDimensions.length === 0) return [];

  function combine(dims: Dimension[], currentIndex: number): VariantInput[] {
    if (currentIndex >= dims.length) return [];

    const currentDim = dims[currentIndex];
    const currentVariants: VariantInput[] = currentDim.values.map((v) => ({
      id: `var-${nanoid()}`,
      type: currentDim.type,
      value: v.value,
      designation: v.designation,
      colorHex: v.colorHex,
      children: [],
    }));

    if (currentIndex === dims.length - 1) {
      return currentVariants;
    }

    const nextCombinations = combine(dims, currentIndex + 1);

    return currentVariants.map((variant) => ({
      ...variant,
      children: nextCombinations.map((next) => ({
        ...next,
        id: `var-${nanoid()}`,
      })),
    }));
  }

  return combine(validDimensions, 0);
}

// Preview generated combinations
function CombinationsPreview({ dimensions }: { dimensions: Dimension[] }) {
  const combinations = useMemo(
    () => generateCombinations(dimensions),
    [dimensions]
  );

  if (combinations.length === 0) return null;

  const countCombinations = (vars: VariantInput[]): number => {
    if (vars.length === 0) return 0;
    const first = vars[0];
    if (!first.children || first.children.length === 0) {
      return vars.length;
    }
    return vars.length * countCombinations(first.children);
  };

  const total = countCombinations(combinations);

  const renderPreview = (vars: VariantInput[], depth = 0): React.ReactNode => {
    if (vars.length === 0) return null;

    return (
      <div className={depth > 0 ? "ml-4 border-l-2 border-muted pl-2" : ""}>
        {vars.slice(0, 5).map((v, i) => (
          <div key={i} className="text-xs py-0.5">
            {v.type === "COLOR" && v.colorHex && (
              <span
                className="inline-block w-3 h-3 rounded mr-1 align-middle"
                style={{ backgroundColor: v.colorHex }}
              />
            )}
            <span className="font-medium">{v.designation}</span>
            {v.children && v.children.length > 0 && (
              <span className="text-muted-foreground">
                {" → "}
                {renderPreview(v.children, depth + 1)}
              </span>
            )}
          </div>
        ))}
        {vars.length > 5 && (
          <div className="text-xs text-muted-foreground">
            ... et {vars.length - 5} autres
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 p-2 bg-muted/30 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">
          Aperçu ({total} combinaisons)
        </span>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {renderPreview(combinations)}
      </div>
    </div>
  );
}

// Manual variant item
function ManualVariantItem({
  variant,
  onChange,
  onDelete,
  onAddChild,
}: {
  variant: VariantInput;
  onChange: (variant: VariantInput) => void;
  onDelete: () => void;
  onAddChild: () => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={variant.type}
          onValueChange={(val: VariantType) => onChange({ ...variant, type: val })}
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

        {variant.type === "COLOR" && (
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-8 h-8 rounded border-2 border-muted-foreground/20 hover:border-primary transition-colors"
            style={{ backgroundColor: variant.colorHex || "#ccc" }}
          />
        )}

        <Input
          value={variant.value}
          onChange={(e) => onChange({ ...variant, value: e.target.value })}
          placeholder="Valeur"
          className="h-8 flex-1 min-w-[80px]"
        />

        <Input
          value={variant.designation}
          onChange={(e) => onChange({ ...variant, designation: e.target.value })}
          placeholder="Affichage"
          className="h-8 flex-1 min-w-[80px]"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {variant.type === "COLOR" && showColorPicker && (
        <ColorPicker
          value={variant.colorHex || "#000000"}
          onChange={(hex) => onChange({ ...variant, colorHex: hex })}
        />
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddChild}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Sous-variante
        </Button>
      </div>
    </div>
  );
}

// Manual mode component
function ManualVariantsMode({
  variants,
  onChange,
}: {
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}) {
  const addVariant = () => {
    const newVariant: VariantInput = {
      id: `var-${nanoid()}`,
      type: "COLOR",
      value: "",
      designation: "",
      children: [],
    };
    onChange([...variants, newVariant]);
  };

  const updateVariant = (index: number, variant: VariantInput) => {
    const newVariants = [...variants];
    newVariants[index] = variant;
    onChange(newVariants);
  };

  const deleteVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const addChildVariant = (parentIndex: number) => {
    const parent = variants[parentIndex];
    const newChild: VariantInput = {
      id: `var-${nanoid()}`,
      type: "SIZE",
      value: "",
      designation: "",
      children: [],
    };
    updateVariant(parentIndex, {
      ...parent,
      children: [...(parent.children || []), newChild],
    });
  };

  const updateChildVariant = (
    parentIndex: number,
    childIndex: number,
    child: VariantInput
  ) => {
    const parent = variants[parentIndex];
    const newChildren = [...(parent.children || [])];
    newChildren[childIndex] = child;
    updateVariant(parentIndex, { ...parent, children: newChildren });
  };

  const deleteChildVariant = (parentIndex: number, childIndex: number) => {
    const parent = variants[parentIndex];
    const newChildren = (parent.children || []).filter(
      (_, i) => i !== childIndex
    );
    updateVariant(parentIndex, { ...parent, children: newChildren });
  };

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <div key={variant.id} className="space-y-2">
          <ManualVariantItem
            variant={variant}
            onChange={(v) => updateVariant(index, v)}
            onDelete={() => deleteVariant(index)}
            onAddChild={() => addChildVariant(index)}
          />

          {/* Children */}
          {variant.children && variant.children.length > 0 && (
            <div className="ml-4 space-y-2 border-l-2 border-muted pl-3">
              {variant.children.map((child, childIndex) => (
                <ManualVariantItem
                  key={child.id}
                  variant={child}
                  onChange={(c) => updateChildVariant(index, childIndex, c)}
                  onDelete={() => deleteChildVariant(index, childIndex)}
                  onAddChild={() => {
                    // Could support deeper nesting if needed
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}

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
    </div>
  );
}

// Dimension mode component
function DimensionMode({
  onGenerate,
}: {
  onGenerate: (variants: VariantInput[]) => void;
}) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  const addDimension = () => {
    const newDimension: Dimension = {
      id: `dim-${nanoid()}`,
      type: "COLOR",
      name: "Couleur",
      values: [],
    };
    setDimensions([...dimensions, newDimension]);
  };

  const updateDimension = (index: number, dim: Dimension) => {
    const newDimensions = [...dimensions];
    newDimensions[index] = dim;
    setDimensions(newDimensions);
  };

  const deleteDimension = (index: number) => {
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    const generated = generateCombinations(dimensions);
    onGenerate(generated);
  };

  const countCombinations = (dims: Dimension[]): number => {
    const validDims = dims.filter(
      (d) => d.values.length > 0 && d.values.every((v) => v.value && v.designation)
    );
    if (validDims.length === 0) return 0;
    return validDims.reduce((acc, d) => acc * d.values.length, 1);
  };

  const total = countCombinations(dimensions);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Définissez les dimensions (couleur, taille) et leurs valeurs.
        Les combinaisons seront générées automatiquement.
      </p>

      {dimensions.map((dim, index) => (
        <DimensionCard
          key={dim.id}
          dimension={dim}
          onChange={(d) => updateDimension(index, d)}
          onDelete={() => deleteDimension(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addDimension}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une dimension
      </Button>

      {dimensions.length > 0 && (
        <CombinationsPreview dimensions={dimensions} />
      )}

      {total > 0 && (
        <Button type="button" onClick={handleGenerate} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Générer {total} variante(s)
        </Button>
      )}
    </div>
  );
}

// Count total variants helper
function countTotalVariants(vars: VariantInput[]): number {
  if (vars.length === 0) return 0;
  const first = vars[0];
  if (!first.children || first.children.length === 0) {
    return vars.length;
  }
  return vars.length * countTotalVariants(first.children);
}

interface ArticleVariantsProps {
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}

export function ArticleVariants({ variants, onChange }: ArticleVariantsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDimensionMode, setIsDimensionMode] = useState(true);

  const totalVariants = countTotalVariants(variants);

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <Label className="text-xs cursor-pointer">Variantes</Label>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalVariants > 0
                ? `${totalVariants} variante(s)`
                : "Optionnel"}
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          {/* Mode switcher */}
          <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              {isDimensionMode ? (
                <Layers className="w-4 h-4 text-primary" />
              ) : (
                <List className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs font-medium">
                {isDimensionMode ? "Génération par dimensions" : "Saisie manuelle"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Mode</Label>
              <Switch
                checked={isDimensionMode}
                onCheckedChange={setIsDimensionMode}
              />
            </div>
          </div>

          {isDimensionMode ? (
            <DimensionMode onGenerate={onChange} />
          ) : (
            <ManualVariantsMode variants={variants} onChange={onChange} />
          )}

          {/* Generated variants info */}
          {totalVariants > 0 && (
            <div className="mt-3 p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-xs">
              ✓ {totalVariants} variante(s) seront créées avec le même prix et la
              même remise que l&apos;article principal
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
