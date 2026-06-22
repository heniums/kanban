"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createBoardSchema } from "@kanban/shared";
import type { CreateBoardInput } from "@kanban/shared";

import { createBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  BackgroundPicker,
  BACKGROUNDS,
} from "@/components/boards/background-picker";

export default function NewBoardPage() {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBoardInput>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      title: "",
      description: "",
      background: BACKGROUNDS[0].value,
    },
  });

  const background = watch("background");

  const onSubmit = async (data: CreateBoardInput) => {
    setServerError("");
    const formData = new FormData();
    formData.set("title", data.title);
    if (data.description) formData.set("description", data.description);
    formData.set("background", data.background);

    const result = await createBoardAction(formData);

    if (result && "errors" in result) {
      setServerError(
        result.errors.map((e: { message: string }) => e.message).join(", ")
      );
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create board</CardTitle>
          <CardDescription>
            Give your board a name and choose a background to get started.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Product Roadmap"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                placeholder="What is this board for?"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                onChange={(value) => setValue("background", value, { shouldValidate: true })}
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create board"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
