"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";
import { uploadImageFile } from "@/lib/cloudinary/upload-file";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface BackgroundOption {
  label: string;
  value: string;
}

export const BACKGROUNDS: BackgroundOption[] = [
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Royal Blue", value: "#1e3a8a" },
  { label: "Emerald", value: "#065f46" },
  { label: "Coral", value: "#dc2626" },
  { label: "Amber", value: "#d97706" },
  { label: "Indigo", value: "#4f46e5" },
  {
    label: "Ocean",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    label: "Sunset",
    value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    label: "Aurora",
    value: "radial-gradient(circle, #43e97b 0%, #38f9d7 100%)",
  },
];

interface BackgroundPickerProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (result: CloudinaryUploadResult) => void;
  imageUrl?: string | null;
  onClearImage?: () => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function BackgroundPicker({
  value,
  onChange,
  onImageUpload,
  imageUrl,
  onClearImage,
  onBlur,
  name,
  disabled,
  ...ariaProps
}: BackgroundPickerProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const lastIndex = BACKGROUNDS.length - 1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = index < lastIndex ? index + 1 : 0;
        onChange(BACKGROUNDS[nextIndex].value);
        (e.currentTarget.parentElement?.children[nextIndex] as HTMLElement)?.focus();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : lastIndex;
        onChange(BACKGROUNDS[prevIndex].value);
        (e.currentTarget.parentElement?.children[prevIndex] as HTMLElement)?.focus();
        return;
      }
    },
    [onChange],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;

      setUploading(true);
      try {
        const result = await uploadImageFile(file);
        onImageUpload(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onImageUpload],
  );

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isImageSelected = !!imageUrl;

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Board background"
        className="flex flex-wrap gap-3"
        onBlur={onBlur}
        {...ariaProps}
      >
        {BACKGROUNDS.map((option, index) => {
          const isSelected = !isImageSelected && option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              tabIndex={isSelected ? 0 : -1}
              name={name}
              onClick={() => {
                onChange(option.value);
                onClearImage?.();
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={disabled}
              className={`focus-visible:ring-ring h-12 w-12 rounded-lg border-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isSelected ? "border-primary ring-primary ring-2 ring-offset-2" : "border-border"
              }`}
              style={{ background: option.value }}
            />
          );
        })}

        <button
          type="button"
          onClick={handleUploadButtonClick}
          disabled={disabled || uploading}
          className={`focus-visible:ring-ring flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isImageSelected
              ? "border-primary ring-primary ring-2 ring-offset-2"
              : "border-border hover:border-primary/50"
          }`}
          aria-label="Upload background image"
          title="Upload background image"
        >
          {uploading ? (
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          ) : isImageSelected ? (
            <img src={imageUrl!} alt="" className="h-full w-full rounded-lg object-cover" />
          ) : (
            <ImagePlus className="text-muted-foreground size-5" />
          )}
        </button>
      </div>

      {isImageSelected && onClearImage && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearImage}
            disabled={disabled}
          >
            <X className="size-4" />
            Remove image
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
