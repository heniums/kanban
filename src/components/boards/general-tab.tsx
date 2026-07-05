"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updateBoardSchema } from "@/lib/schemas/board";
import type { UpdateBoardInput } from "@/lib/schemas/board";
import type { Board } from "@/lib/db/schema/boards";

import { updateBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPicker } from "@/components/boards/background-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneralTabProps {
  board: Board;
}

export function GeneralTab({ board }: GeneralTabProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<UpdateBoardInput>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      title: board.title,
      description: board.description ?? "",
      background: board.background,
    },
  });

  const onSubmit = (data: UpdateBoardInput) => {
    setServerError("");
    const formData = new FormData();
    if (data.title !== undefined) formData.set("title", data.title);
    if (data.description !== undefined) {
      formData.set("description", data.description ?? "");
    }
    if (data.background !== undefined) formData.set("background", data.background);

    startTransition(async () => {
      const result = await updateBoardAction(board.id, formData);

      if (result && "errors" in result) {
        setServerError((result.errors ?? []).map((e: { message: string }) => e.message).join(", "));
        return;
      }

      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Board Settings</CardTitle>
        <CardDescription>
          Update your board&apos;s title, description, and background.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  onBlur={field.onBlur}
                  name={field.name}
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

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
