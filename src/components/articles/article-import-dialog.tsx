"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

type ImportRow = {
  designation: string;
  parentId: string;
  variantType: string;
  variantValue: string;
  salePrice: string;
  shortDescription: string;
  isPublish: string;
};

interface ArticleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  etbId: string;
  onSuccess: () => void;
}

const CSV_TEMPLATE = `designation,parent_id,variant_type,variant_value,sale_price,short_description,is_publish
T-Shirt Classic,,,,150.00,Cotton t-shirt,true
T-Shirt Classic,1,COLOR,Red,,,
T-Shirt Classic,1,COLOR,Blue,,,
Jeans Denim,,,,250.00,Classic jeans,false
Jeans Denim,2,SIZE,S,,,
Jeans Denim,2,SIZE,M,,,
Jeans Denim,2,SIZE,L,,,`;

export function ArticleImportDialog({
  open,
  onOpenChange,
  orgId,
  etbId,
  onSuccess,
}: ArticleImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    parentArticles: number;
    variants: number;
    total: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    setFile(selectedFile);
    setImportResults(null);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setErrors(["Le fichier CSV est vide ou ne contient que l'en-tête"]);
          setParsedData([]);
          return;
        }

        // Get headers
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const designationIdx = headers.findIndex(
          (h) => h === "designation" || h === "désignation"
        );
        const parentIdIdx = headers.findIndex(
          (h) => h === "parent_id" || h === "parentid"
        );
        const variantTypeIdx = headers.findIndex((h) => h === "variant_type");
        const variantValueIdx = headers.findIndex((h) => h === "variant_value");
        const salePriceIdx = headers.findIndex(
          (h) => h === "sale_price" || h === "prix"
        );
        const shortDescIdx = headers.findIndex(
          (h) => h === "short_description" || h === "description"
        );
        const isPublishIdx = headers.findIndex(
          (h) => h === "is_publish" || h === "publié"
        );

        if (designationIdx === -1) {
          setErrors(["Colonne 'designation' requise"]);
          setParsedData([]);
          return;
        }

        const parseErrors: string[] = [];
        const data: ImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());

          if (values.length < 1) continue;

          const designation = values[designationIdx] || "";
          const parentId = parentIdIdx >= 0 ? values[parentIdIdx] || "" : "";
          const variantType = variantTypeIdx >= 0 ? values[variantTypeIdx] || "" : "";
          const variantValue = variantValueIdx >= 0 ? values[variantValueIdx] || "" : "";
          const salePrice = salePriceIdx >= 0 ? values[salePriceIdx] || "0" : "0";
          const shortDescription = shortDescIdx >= 0 ? values[shortDescIdx] || "" : "";
          const isPublish = isPublishIdx >= 0 ? values[isPublishIdx] || "false" : "false";

          // Validate
          if (!parentId && !designation) {
            parseErrors.push(`Ligne ${i + 1}: Désignation requise pour l'article parent`);
            continue;
          }

          if (parentId && !variantValue) {
            parseErrors.push(`Ligne ${i + 1}: 'variant_value' requis pour la variante`);
            continue;
          }

          data.push({
            designation,
            parentId,
            variantType,
            variantValue,
            salePrice,
            shortDescription,
            isPublish,
          });
        }

        setErrors(parseErrors);
        setParsedData(data);
      } catch {
        setErrors(["Erreur lors de la lecture du fichier CSV"]);
        setParsedData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Aucune donnée à importer");
      return;
    }

    // Filter to only parent articles (for validation)
    const parentArticles = parsedData.filter((row) => !row.parentId);
    if (parentArticles.length === 0) {
      toast.error("Aucun article parent trouvé");
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const response = await fetch("/api/articles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idOrg: orgId,
          idEtb: etbId,
          articles: parsedData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'import");
      }

      setImportResults(data.results);

      if (data.results.total > 0) {
        toast.success(`${data.results.total} articles importés avec succès`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "articles_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportResults(null);
    onOpenChange(false);
  };

  const parentCount = parsedData.filter((r) => !r.parentId).length;
  const variantCount = parsedData.filter((r) => r.parentId).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importer des articles
          </DialogTitle>
          <DialogDescription>
            Importez vos articles depuis un fichier CSV. Les références sont générées automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Modèle CSV</p>
              <p className="text-xs text-muted-foreground">
                Téléchargez le modèle pour voir le format attendu
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-1" />
              Télécharger
            </Button>
          </div>

          {/* File upload */}
          <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium text-sm sm:text-base">{file.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer de fichier
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Glissez-déposez votre fichier CSV ici
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Sélectionner un fichier
                </Button>
              </div>
            )}
          </div>

          {/* Parse errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Erreurs de validation:</p>
                <ul className="text-sm list-disc list-inside">
                  {errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>...et {errors.length - 5} autres erreurs</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Aperçu</span>
                <Badge variant="secondary">{parentCount} parents</Badge>
                <Badge variant="outline">{variantCount} variantes</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Désignation</TableHead>
                        <TableHead className="whitespace-nowrap">Parent</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Valeur</TableHead>
                        <TableHead className="whitespace-nowrap">Prix</TableHead>
                        <TableHead className="whitespace-nowrap">Publié</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, i) => (
                        <TableRow key={i} className={!row.parentId ? "" : "bg-muted/30"}>
                          <TableCell className="font-medium truncate max-w-[120px]">
                            {row.designation || "-"}
                          </TableCell>
                          <TableCell>{row.parentId || "-"}</TableCell>
                          <TableCell>{row.variantType || "-"}</TableCell>
                          <TableCell>{row.variantValue || "-"}</TableCell>
                          <TableCell>{row.salePrice || "0"}</TableCell>
                          <TableCell>
                            {row.isPublish === "true" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground py-2 border-t">
                    ...et {parsedData.length - 10} lignes supplémentaires
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import results */}
          {importResults && (
            <Alert>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <AlertDescription>
                <p className="font-medium">Import terminé!</p>
                <p className="text-sm">
                  {importResults.parentArticles} articles parents et{" "}
                  {importResults.variants} variantes créés.
                </p>
                {importResults.errors.length > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {importResults.errors.length} erreur(s)
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              {importResults ? "Fermer" : "Annuler"}
            </Button>
            {!importResults && (
              <Button
                onClick={handleImport}
                disabled={parsedData.length === 0 || isImporting}
                className="w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer ({parentCount + variantCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
