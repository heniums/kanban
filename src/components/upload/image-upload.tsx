"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { getUploadSignatureAction } from "@/lib/actions/upload-signature";
import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";

interface ImageUploadProps {
  onUpload: (result: CloudinaryUploadResult) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  maxFiles?: number;
  autoOpen?: boolean;
  maxFileSizeBytes?: number;
}

export function ImageUpload({
  onUpload,
  onError,
  onCancel,
  disabled,
  maxFiles = 1,
  autoOpen,
  maxFileSizeBytes,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open file dialog on mount
  useEffect(() => {
    if (autoOpen && inputRef.current && !disabled && !isUploading) {
      inputRef.current.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, disabled]);

  // Detect dialog cancellation via window focus
  useEffect(() => {
    if (!autoOpen) return;
    let timeout: ReturnType<typeof setTimeout>;

    const handleWindowFocus = () => {
      // Give onChange time to fire if a file was selected
      timeout = setTimeout(() => {
        if (!hasUploaded && !isUploading) {
          onCancel?.();
        }
      }, 300);
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      clearTimeout(timeout);
    };
  }, [autoOpen, hasUploaded, isUploading, onCancel]);

  const uploadToCloudinary = useCallback(
    async (file: File) => {
      if (maxFileSizeBytes && file.size > maxFileSizeBytes) {
        const mb = Math.round(maxFileSizeBytes / 1024 / 1024);
        const message = `File too large. Maximum size is ${mb}MB.`;
        onError?.(message);
        throw new Error(message);
      }
      setIsUploading(true);
      try {
        const sig = await getUploadSignatureAction();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sig.apiKey);
        formData.append("timestamp", String(sig.timestamp));
        formData.append("signature", sig.signature);
        formData.append("upload_preset", sig.uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Cloudinary upload failed: ${err}`);
        }

        const result = (await res.json()) as CloudinaryUploadResult;
        setHasUploaded(true);
        onUpload(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        onError?.(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onError, maxFileSizeBytes],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files).slice(0, maxFiles);
      const newPreviews = fileArray.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);

      for (const file of fileArray) {
        await uploadToCloudinary(file);
      }

      // Clean up object URLs after upload
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [uploadToCloudinary, maxFiles],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, maxFiles);

      if (files.length === 0) return;

      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);

      for (const file of files) {
        await uploadToCloudinary(file);
      }

      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
    },
    [uploadToCloudinary, disabled, isUploading, maxFiles],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          disabled || isUploading ? "opacity-50" : "cursor-pointer"
        }`}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="text-primary size-6 animate-spin" />
            <span className="text-muted-foreground text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <ImagePlus className="text-muted-foreground size-6" />
            <span className="text-muted-foreground text-sm">Click or drag images to upload</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="Preview" className="h-20 w-20 rounded object-cover" />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
                  <Loader2 className="size-4 animate-spin text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
