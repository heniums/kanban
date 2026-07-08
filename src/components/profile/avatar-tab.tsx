"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/upload/image-upload";
import { updateUserAvatarAction, deleteUserAvatarAction } from "@/lib/actions/avatar";
import { mapUploadResultToAttachment } from "@/lib/cloudinary/client-safe";
import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";
import type { PublicUser } from "@/lib/data/auth";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function AvatarTab({ user }: { user: PublicUser }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const { update } = useSession();

  const handleUpload = async (result: CloudinaryUploadResult) => {
    setUploading(true);
    try {
      const meta = mapUploadResultToAttachment(result);
      const res = await updateUserAvatarAction({
        avatarUrl: meta.url,
        avatarPublicId: meta.publicId,
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      setAvatarUrl(meta.url);
      toast.success("Avatar updated");
      await update({ avatarUrl: meta.url });
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteUserAvatarAction();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setAvatarUrl("");
      toast.success("Avatar removed");
      await update({ avatarUrl: null });
    } catch {
      toast.error("Failed to remove avatar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        {avatarUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Avatar"
              className="ring-border size-32 rounded-full object-cover ring-2"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 size-3.5" />
              Remove avatar
            </Button>
          </div>
        ) : (
          <div className="bg-muted ring-border flex size-32 items-center justify-center rounded-full ring-2">
            <Camera className="text-muted-foreground size-10" />
          </div>
        )}
      </div>

      <ImageUpload
        onUpload={handleUpload}
        onError={(err) => toast.error(err)}
        disabled={uploading}
        maxFiles={1}
        maxFileSizeBytes={2 * 1024 * 1024}
      />
    </div>
  );
}
