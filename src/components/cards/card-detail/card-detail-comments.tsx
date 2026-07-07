"use client";

import { useState, useTransition, type Dispatch, type SetStateAction, useCallback } from "react";
import { MessageSquare, Pencil, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageViewerModal } from "@/components/upload/image-viewer-modal";
import {
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/actions/comments";
import { createAttachmentAction } from "@/lib/actions/attachments";
import { uploadImageFile } from "@/lib/cloudinary/upload-file";
import { mapUploadResultToAttachment } from "@/lib/cloudinary/client-safe";
import type { CardDetailData } from "./types";

const IMAGE_MARKDOWN_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function parseCommentContent(
  content: string,
): Array<{ type: "text"; value: string } | { type: "image"; alt: string; url: string }> {
  const parts: ReturnType<typeof parseCommentContent> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IMAGE_MARKDOWN_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "image", alt: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", value: content });
  }

  return parts;
}

export function CommentsSection({
  cardId,
  boardId,
  comments,
  boardMembers,
  onChange,
}: {
  cardId: string;
  boardId: string;
  comments: CardDetailData["comments"];
  boardMembers: { id: string; name: string; email: string }[];
  onChange: Dispatch<SetStateAction<CardDetailData["comments"]>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <MessageSquare className="size-3.5" /> Comments
      </div>
      <div className="flex flex-col gap-2">
        {comments.length === 0 && <p className="text-muted-foreground text-xs">No comments yet.</p>}
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} boardMembers={boardMembers} onChange={onChange} />
        ))}
      </div>
      <AddComment cardId={cardId} boardId={boardId} onAdded={(c) => onChange([...comments, c])} />
    </div>
  );
}

function CommentItem({
  comment,
  boardMembers,
  onChange,
}: {
  comment: CardDetailData["comments"][number];
  boardMembers: { id: string; name: string; email: string }[];
  onChange: Dispatch<SetStateAction<CardDetailData["comments"]>>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const author = boardMembers.find((m) => m.id === comment.userId);
  const authorName = author?.name ?? "Unknown";

  const handleSave = async () => {
    const next = draft.trim();
    if (!next) return;
    if (next === comment.content) {
      setEditing(false);
      return;
    }
    onChange((prev) => prev.map((c) => (c.id === comment.id ? { ...c, content: next } : c)));
    setEditing(false);
    const result = await updateCommentAction({ commentId: comment.id, content: next });
    if ("errors" in result) {
      onChange((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, content: comment.content } : c)),
      );
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const handleDelete = async () => {
    onChange((prev) => prev.filter((c) => c.id !== comment.id));
    const result = await deleteCommentAction({ commentId: comment.id });
    if ("errors" in result) {
      onChange((prev) => [...prev, comment]);
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const created = new Date(comment.createdAt);
  const createdStr = created.toLocaleString();

  return (
    <div className="group/comment flex flex-col gap-1 rounded-md border p-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium">{authorName}</span>
          <span className="text-muted-foreground">{createdStr}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setDraft(comment.content);
              setEditing(true);
            }}
            aria-label="Edit comment"
            className="text-muted-foreground"
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete comment"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            autoFocus
            className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(comment.content);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!draft.trim()}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <CommentContent
          content={comment.content}
          onImageClick={(url) => {
            setViewerUrl(url);
            setViewerOpen(true);
          }}
        />
      )}

      <ImageViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageUrl={viewerUrl}
        imageId={viewerUrl}
      />
    </div>
  );
}

function InlineImage({ url, alt, onClick }: { url: string; alt: string; onClick: () => void }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="bg-muted text-muted-foreground my-1 inline-block rounded-md border px-3 py-2 text-xs italic">
        [deleted image]
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="my-1 inline-block overflow-hidden rounded-md border hover:opacity-90"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="max-h-40 max-w-full object-contain"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </button>
  );
}

function CommentContent({
  content,
  onImageClick,
}: {
  content: string;
  onImageClick: (url: string) => void;
}) {
  const parts = parseCommentContent(content);

  if (parts.length === 1 && parts[0].type === "text") {
    return <p className="text-sm whitespace-pre-wrap">{parts[0].value}</p>;
  }

  return (
    <div className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.type === "text" ? (
          <span key={i}>{part.value}</span>
        ) : (
          <InlineImage
            key={i}
            url={part.url}
            alt={part.alt}
            onClick={() => onImageClick(part.url)}
          />
        ),
      )}
    </div>
  );
}

function AddComment({
  cardId,
  boardId,
  onAdded,
}: {
  cardId: string;
  boardId: string;
  onAdded: (c: CardDetailData["comments"][number]) => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPastingImage, setIsPastingImage] = useState(false);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      // Capture cursor position synchronously before async work
      const target = e.currentTarget;
      const start = target.selectionStart ?? content.length;
      const end = target.selectionEnd ?? content.length;

      setIsPastingImage(true);
      try {
        const result = await uploadImageFile(file);
        const meta = mapUploadResultToAttachment(result);

        // Also create an attachment for the card
        const attachRes = await createAttachmentAction({
          ...meta,
          cardId,
          boardId,
        });

        if ("error" in attachRes) {
          toast.error(attachRes.error);
          return;
        }

        const imageRef = `![Pasted image](${meta.url})`;
        setContent((prev) => {
          const before = prev.slice(0, start);
          const after = prev.slice(end);
          return `${before}\n${imageRef}\n${after}`;
        });
        toast.success("Image pasted into comment");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to paste image");
      } finally {
        setIsPastingImage(false);
      }
    },
    [cardId, boardId],
  );

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createCommentAction({ cardId, content: trimmed });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      if (result.data) {
        onAdded({
          id: result.data.id,
          cardId: result.data.cardId,
          userId: result.data.userId,
          content: result.data.content,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });
      }
      setContent("");
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="Write a comment… (paste images directly)"
          maxLength={2000}
          rows={2}
          disabled={isPastingImage}
          className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {isPastingImage && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
            <ImageIcon className="size-5 animate-pulse text-white" />
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={!content.trim() || isPending || isPastingImage}
        >
          {isPending ? "Posting…" : isPastingImage ? "Pasting image…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
