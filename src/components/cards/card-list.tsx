"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CardItem, type CardSummary } from "@/components/cards/card-item";
import { AddCardForm } from "@/components/cards/add-card-form";
import { createCardAction } from "@/lib/actions/cards";
import { useBoardCardStore } from "@/lib/realtime/board-store";

interface CardListProps {
  listId: string;
  isDropTarget?: boolean;
}

export function CardList({ listId, isDropTarget }: CardListProps) {
  const router = useRouter();
  const cards = useBoardCardStore((s) => s.cardsByList[listId] ?? []);
  const addCard = useBoardCardStore((s) => s.addCard);
  const { setNodeRef } = useDroppable({ id: `list-drop-${listId}`, data: { listId } });

  const handleAdd = async (title: string) => {
    const result = await createCardAction({ listId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    if (result.data) addCard(result.data);
    router.refresh();
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[24px] flex-col gap-2 ${isDropTarget ? "bg-muted/30 rounded" : ""}`}
      data-list-id={listId}
    >
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <CardItem
        card={card}
        isDragging={isDragging}
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
