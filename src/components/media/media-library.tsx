"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  File,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { S3_HOST } from "@/lib/config";

type MediaFile = {
  key: string;
  filename: string;
  extension: string;
  size: number;
  lastModified: string | null;
  isImage: boolean;
  isDocument: boolean;
  type: "image" | "document" | "other";
};

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onSelect: (keys: string[]) => void;
  multiple?: boolean;
  fileType?: "images" | "documents" | "all";
  title?: string;
}

export function MediaLibrary({
  open,
  onOpenChange,
  orgId,
  onSelect,
  multiple = false,
  fileType = "images",
  title = "Bibliothèque de fichiers",
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(fileType === "all" ? "all" : fileType);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const type = activeTab === "all" ? "" : `&type=${activeTab}`;
      const response = await fetch(`/api/files?orgId=${orgId}${type}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, [orgId, activeTab]);

  useEffect(() => {
    if (open) {
      fetchFiles();
      setSelectedKeys(new Set());
    }
  }, [open, fetchFiles]);

  // Filter files by search
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (key: string) => {
    if (multiple) {
      const newSelected = new Set(selectedKeys);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedKeys(newSelected);
    } else {
      setSelectedKeys(new Set([key]));
    }
  };

  const handleConfirm = () => {
    if (selectedKeys.size > 0) {
      onSelect(Array.from(selectedKeys));
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (selectedKeys.size === 0) return;

    if (!confirm(`Supprimer ${selectedKeys.size} fichier(s) ?`)) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: Array.from(selectedKeys),
          orgId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setSelectedKeys(new Set());
      fetchFiles();
    } catch (error) {
      console.error("Error deleting files:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("orgId", orgId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        return response.json();
      });

      await Promise.all(uploadPromises);
      fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: MediaFile) => {
    if (file.isImage) {
      return (
        <img
          src={`${S3_HOST}/${file.key}`}
          alt={file.filename}
          className="w-full h-full object-cover"
        />
      );
    }
    if (file.isDocument) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {multiple
              ? "Sélectionnez un ou plusieurs fichiers"
              : "Sélectionnez un fichier"}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 py-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="images" className="text-xs sm:text-sm">
                <ImageIcon className="h-4 w-4 mr-1" />
                Images
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Tous
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept={activeTab === "images" ? "image/*" : undefined}
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">Télécharger</span>
              </label>
            </Button>
            {selectedKeys.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">Supprimer ({selectedKeys.size})</span>
              </Button>
            )}
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun fichier trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                Téléchargez des fichiers pour commencer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-1">
              {filteredFiles.map((file) => (
                <button
                  key={file.key}
                  type="button"
                  onClick={() => handleSelect(file.key)}
                  className={cn(
                    "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    selectedKeys.has(file.key)
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-transparent bg-muted"
                  )}
                >
                  {/* File preview/icon */}
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {getFileIcon(file)}
                  </div>

                  {/* Selection indicator */}
                  {selectedKeys.has(file.key) && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  {/* Filename tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-white text-xs truncate">{file.filename}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedKeys.size > 0
              ? `${selectedKeys.size} fichier(s) sélectionné(s)`
              : `${files.length} fichier(s)`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={selectedKeys.size === 0}>
              Sélectionner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
