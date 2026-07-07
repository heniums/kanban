"use client";

import { useState, useCallback } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/upload/image-upload";
import { createAttachmentAction, deleteAttachmentAction } from "@/lib/actions/attachments";
import { mapUploadResultToAttachment } from "@/lib/cloudinary";
import type { CloudinaryUploadResult } from "@/lib/cloudinary";
import type { CardAttachment } from "./types";
import { toast } from "sonner";

interface CardDetailAttachmentsProps {
  cardId: string;
  boardId: string;
  attachments: CardAttachment[];
  onChange: (attachments: CardAttachment[]) => void;
  disabled?: boolean;
}

export function CardDetailAttachments({
  cardId,
  boardId,
  attachments,
  onChange,
  disabled,
}: CardDetailAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (result: CloudinaryUploadResult) => {
      setIsUploading(true);
      try {
        const meta = mapUploadResultToAttachment(result);
        const res = await createAttachmentAction({
          ...meta,
          cardId,
          boardId,
        });

        if ("error" in res) {
          toast.error(res.error);
          return;
        }

        if (res.attachment) {
          const newAttachment: CardAttachment = {
            id: res.attachment.id,
            cardId,
            attachmentId: res.attachment.id,
            displayOrder: attachments.length,
            url: meta.url,
            publicId: meta.publicId,
            format: meta.format,
            width: meta.width,
            height: meta.height,
            bytes: meta.bytes,
            resourceType: meta.resourceType,
            createdBy: res.attachment.createdBy,
            createdAt: res.attachment.createdAt,
          };
          onChange([...attachments, newAttachment]);
          toast.success("Image attached");
        }
      } catch {
        toast.error("Failed to attach image");
      } finally {
        setIsUploading(false);
      }
    },
    [cardId, boardId, attachments, onChange],
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      setDeletingId(attachmentId);
      try {
        const res = await deleteAttachmentAction({
          attachmentId,
          cardId,
          boardId,
        });

        if ("error" in res) {
          toast.error(res.error);
          return;
        }

        onChange(attachments.filter((a) => a.attachmentId !== attachmentId));
        toast.success("Image removed");
      } catch {
        toast.error("Failed to remove image");
      } finally {
        setDeletingId(null);
      }
    },
    [cardId, boardId, attachments, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Attachments</h3>
        <span className="text-muted-foreground text-xs">({attachments.length}/10)</span>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attachments.map((att) => (
            <div key={att.id} className="group relative">
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg"
              >
                <img
                  src={att.url}
                  alt="Attachment"
                  className="h-24 w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </a>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleDelete(att.attachmentId)}
                disabled={disabled || deletingId === att.attachmentId}
              >
                {deletingId === att.attachmentId ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {attachments.length < 10 && (
        <ImageUpload
          onUpload={handleUpload}
          onError={(err) => toast.error(err)}
          disabled={disabled || isUploading}
          maxFiles={Math.min(10 - attachments.length, 5)}
        />
      )}
    </div>
  );
}
