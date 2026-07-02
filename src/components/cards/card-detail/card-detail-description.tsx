"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DescriptionEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const html = useMemo(() => {
    if (!value.trim()) return "";
    try {
      return marked.parse(value, { async: false }) as string;
    } catch {
      return `<p>${value.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</p>`;
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="card-description" className="text-muted-foreground text-xs font-medium">
          Description (markdown supported)
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            onClick={() => setMode("edit")}
            disabled={disabled}
          >
            <Pencil className="mr-1 size-3" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            onClick={() => setMode("preview")}
            disabled={disabled}
          >
            Preview
          </Button>
        </div>
      </div>
      {mode === "edit" ? (
        <textarea
          id="card-description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={5000}
          rows={6}
          aria-label="Card description"
          placeholder="Add a description. Markdown is supported: **bold**, *italic*, `code`, [link](url), - lists"
          className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 font-mono text-sm"
        />
      ) : (
        <div
          data-testid="description-preview"
          className="border-input bg-background min-h-[6rem] w-full rounded-md border px-3 py-2 text-sm"
        >
          {html ? (
            <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-muted-foreground">No description yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
