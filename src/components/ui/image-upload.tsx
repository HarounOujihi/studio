"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { S3_HOST } from "@/lib/config";
import { MediaLibrary } from "@/components/media/media-library";

interface ImageUploadProps {
  value: string | null; // S3 key
  onChange: (key: string | null) => void;
  orgId: string;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
}

export function ImageUpload({
  value,
  onChange,
  orgId,
  label = "Image",
  className,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const imageUrl = value ? `${S3_HOST}/${value}` : null;

  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Veuillez télécharger un fichier image");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("orgId", orgId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Erreur lors du téléchargement");
        }

        // Save only the key
        const uploadedFile = data.files?.[0];
        if (uploadedFile?.key) {
          onChange(uploadedFile.key);
        }
      } catch (error) {
        console.error("Erreur de téléchargement:", error);
        alert(error instanceof Error ? error.message : "Erreur lors du téléchargement");
      } finally {
        setUploading(false);
      }
    },
    [orgId, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleLibrarySelect = (keys: string[]) => {
    if (keys.length > 0) {
      onChange(keys[0]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors overflow-hidden",
          aspectClasses[aspectRatio],
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {imageUrl ? (
          // Preview mode
          <>
            <img
              src={imageUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLibraryOpen(true)}
                title="Choisir de la bibliothèque"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Bibliothèque
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          // Upload mode
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-4">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Téléchargement...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm text-center">
                  <span className="hidden sm:inline">Cliquer ou glisser pour télécharger</span>
                  <span className="sm:hidden">Appuyer pour télécharger</span>
                </span>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLibraryOpen(true)}
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Bibliothèque
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Media Library */}
      <MediaLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        orgId={orgId}
        onSelect={handleLibrarySelect}
        multiple={false}
        fileType="images"
        title="Sélectionner une image"
      />
    </div>
  );
}
