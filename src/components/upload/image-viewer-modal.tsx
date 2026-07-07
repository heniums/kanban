"use client";

import { useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Trash2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ImageViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageId: string;
  onDelete?: (imageId: string) => void;
}

export function ImageViewerModal({
  open,
  onOpenChange,
  imageUrl,
  imageId,
  onDelete,
}: ImageViewerModalProps) {
  const [scale, setScale] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.25, 3)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.25, 0.5)), []);
  const resetZoom = useCallback(() => setScale(1), []);

  const handleDelete = () => {
    onDelete?.(imageId);
    setDeleteConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[95vh] max-w-[95vw] border-0 bg-black/90 p-0"
          showCloseButton={false}
        >
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            {/* Toolbar */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={resetZoom}
                className="text-xs text-white hover:bg-white/20"
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={zoomIn}
                disabled={scale >= 3}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="size-4" />
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="gap-1 bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Image */}
            <div
              className="flex h-full w-full items-center justify-center overflow-auto p-8"
              onDoubleClick={() => setScale((s) => (s >= 2 ? 1 : s + 0.5))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Attachment preview"
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${scale})` }}
                draggable={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The image will be permanently removed from this card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
