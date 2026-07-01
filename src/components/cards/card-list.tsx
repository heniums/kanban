"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { CardItem, type CardSummary } from "@/components/cards/card-item";
import { AddCardForm } from "@/components/cards/add-card-form";
import { createCardAction } from "@/lib/actions/cards";

interface CardListProps {
  listId: string;
  cards: CardSummary[];
  isDropTarget?: boolean;
}

export function CardList({ listId, cards: cardList, isDropTarget }: CardListProps) {
  const router = useRouter();
  const { setNodeRef } = useDroppable({ id: `list-drop-${listId}`, data: { listId } });

  const handleAdd = async (title: string) => {
    const result = await createCardAction({ listId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    router.refresh();
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[24px] flex-col gap-2 ${isDropTarget ? "bg-muted/30 rounded" : ""}`}
      data-list-id={listId}
    >
      <SortableContext items={cardList.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cardList.map((card) => (
          <SortableCardItem key={card.id} card={card} />
        ))}
      </SortableContext>
      <AddCardForm onAdd={handleAdd} />
    </div>
  );
}

function SortableCardItem({ card }: { card: CardSummary }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CardItem
        card={card}
        isDragging={isDragging}
        dragHandleProps={listeners}
        onOpen={() => {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("card", card.id);
            window.history.pushState({}, "", url);
            window.dispatchEvent(new CustomEvent("card:open", { detail: { cardId: card.id } }));
          }
        }}
      />
    </div>
  );
}
