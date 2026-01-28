"use client";

import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Pending image represents an image that has been added but not yet uploaded to GitHub
export interface PendingImage {
  id: string; // Unique ID for this pending image
  file: File;
  blobUrl: string;
  filename: string;
}

interface ImageUploaderProps {
  onUpload: (markdown: string, pendingImage: PendingImage) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleUploadFile = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Create a blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      const id = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const filename = file.name.replace(/\s+/g, "-");

      const pendingImage: PendingImage = {
        id,
        file,
        blobUrl,
        filename,
      };

      // Create markdown with blob URL for preview
      // Format: ![alt](blob:...)
      const markdown = `![${filename}](${blobUrl})`;
      onUpload(markdown, pendingImage);

      toast({
        title: "Image added",
        description: "Image will be uploaded when you save the post",
      });
    },
    [onUpload, toast],
  );

  const handleUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      handleUploadFile(files[0]);
    },
    [handleUploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleUploadFile(file);
          }
          break;
        }
      }
    },
    [handleUploadFile],
  );

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <p>Drag & drop an image here, or paste from clipboard</p>
          <p className="mt-1 text-xs">PNG, JPG, GIF or WebP (max 5MB)</p>
        </div>
        <label htmlFor="image-upload">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            type="button"
            onClick={() =>
              document.getElementById("image-upload")?.click()
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Image
          </Button>
        </label>
      </div>
    </div>
  );
}
