"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updateBoardSchema } from "@kanban/shared";
import type { UpdateBoardInput, BoardRow } from "@kanban/shared";

import { updateBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPicker } from "@/components/boards/background-picker";

interface BoardSettingsProps {
  board: BoardRow;
  onClose: () => void;
}

export function BoardSettings({ board, onClose }: BoardSettingsProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateBoardInput>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      title: board.title,
      description: board.description ?? "",
      background: board.background,
    },
  });

  const background = watch("background") ?? board.background;

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
      setServerError(
        (result.errors ?? [])
          .map((e: { message: string }) => e.message)
          .join(", ")
      );
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <textarea
          id="edit-description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Background</Label>
        <BackgroundPicker
          value={background}
          onChange={(value) =>
            setValue("background", value, { shouldValidate: true })
          }
        />
        {errors.background && (
          <p className="text-sm text-destructive">
            {errors.background.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
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
