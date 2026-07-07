"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updateBoardSchema } from "@/lib/schemas/board";
import type { UpdateBoardInput } from "@/lib/schemas/board";
import type { Board } from "@/lib/db/schema/boards";

import { updateBoardAction } from "@/lib/actions/boards";
import {
  updateBoardBackgroundImageAction,
  deleteBoardBackgroundImageAction,
} from "@/lib/actions/board-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPicker } from "@/components/boards/background-picker";
import { mapUploadResultToAttachment } from "@/lib/cloudinary/client-safe";
import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";
import { toast } from "sonner";

interface BoardSettingsProps {
  board: Board;
  onClose: () => void;
}

export function BoardSettings({ board, onClose }: BoardSettingsProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(board.backgroundImageUrl);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    setValue,
  } = useForm<UpdateBoardInput>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      title: board.title,
      description: board.description ?? "",
      background: board.background,
    },
  });

  const onSubmit = async (data: UpdateBoardInput) => {
    setServerError("");
    const formData = new FormData();
    if (data.title !== undefined) formData.set("title", data.title);
    if (data.description !== undefined) {
      formData.set("description", data.description ?? "");
    }
    if (data.background !== undefined) formData.set("background", data.background);

    const result = await updateBoardAction(board.id, formData);

    if (result && "errors" in result) {
      setServerError((result.errors ?? []).map((e: { message: string }) => e.message).join(", "));
      return;
    }

    router.refresh();
    onClose();
  };

  const handleImageUpload = async (result: CloudinaryUploadResult) => {
    const meta = mapUploadResultToAttachment(result);
    const res = await updateBoardBackgroundImageAction({
      boardId: board.id,
      backgroundImagePublicId: meta.publicId,
      backgroundImageUrl: meta.url,
    });

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setBackgroundImageUrl(meta.url);
    setValue("background", board.background, { shouldDirty: true });
    toast.success("Background image updated");
    router.refresh();
  };

  const handleClearImage = async () => {
    if (!board.backgroundImagePublicId) {
      setBackgroundImageUrl(null);
      return;
    }

    const res = await deleteBoardBackgroundImageAction({ boardId: board.id });
    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setBackgroundImageUrl(null);
    toast.success("Background image removed");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "edit-title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="edit-title-error" className="text-destructive text-sm">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <textarea
          id="edit-description"
          rows={3}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "edit-description-error" : undefined}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          {...register("description")}
        />
        {errors.description && (
          <p id="edit-description-error" className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Background</Label>
        <Controller
          name="background"
          control={control}
          render={({ field }) => (
            <BackgroundPicker
              value={field.value ?? board.background}
              onChange={field.onChange}
              onImageUpload={handleImageUpload}
              imageUrl={backgroundImageUrl}
              onClearImage={handleClearImage}
              onBlur={field.onBlur}
              name={field.name}
              disabled={isSubmitting}
              aria-invalid={errors.background ? true : undefined}
              aria-describedby={errors.background ? "edit-background-error" : undefined}
            />
          )}
        />
        {errors.background && (
          <p id="edit-background-error" className="text-destructive text-sm">
            {errors.background.message}
          </p>
        )}
      </div>

      {serverError && (
        <p id="edit-server-error" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
