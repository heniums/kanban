"use client";

import { useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/actions/comments";
import type { CardDetailData } from "./types";

export function CommentsSection({
  cardId,
  comments,
  boardMembers,
  onChange,
}: {
  cardId: string;
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
      <AddComment cardId={cardId} onAdded={(c) => onChange([...comments, c])} />
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
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>
  );
}

function AddComment({
  cardId,
  onAdded,
}: {
  cardId: string;
  onAdded: (c: CardDetailData["comments"][number]) => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
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
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment…"
        maxLength={2000}
        rows={2}
        className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={submit} disabled={!content.trim() || isPending}>
          {isPending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
