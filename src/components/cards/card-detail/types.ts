import type { Card } from "@/lib/db/schema/cards";
import type { Label } from "@/lib/db/schema/labels";

export interface CardAttachment {
  id: string;
  cardId: string;
  attachmentId: string;
  displayOrder: number;
  url: string;
  publicId: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  resourceType: string | null;
  createdBy: string;
  createdAt: Date | string;
}

export interface CardDetailData {
  card: Card;
  labels: { id: string; name: string; color: string }[];
  boardId: string;
  boardLabels: Label[];
  assignees: { id: string; name: string; email: string; avatarUrl?: string | null }[];
  checklists: Array<{
    id: string;
    cardId: string;
    title: string;
    position: number;
    items: Array<{
      id: string;
      checklistId: string;
      content: string;
      isCompleted: boolean;
      position: number;
    }>;
  }>;
  comments: Array<{
    id: string;
    cardId: string;
    userId: string;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }>;
  boardMembers: { id: string; name: string; email: string; avatarUrl?: string | null }[];
  attachments: CardAttachment[];
}
