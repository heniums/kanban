import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

export interface MovePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: { id: string; title: string }[];
  currentListId: string;
  onMove: (targetListId: string) => void;
  isPending: boolean;
}

export function MovePopover({
  open,
  onOpenChange,
  lists,
  currentListId,
  onMove,
  isPending,
}: MovePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          aria-label="Move card"
          title="Move card"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowRightLeft className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="border-b px-3 py-2">
          <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Move to list
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onMove(l.id)}
              disabled={l.id === currentListId}
              className="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs disabled:opacity-50"
            >
              <span className="truncate">{l.title}</span>
              {l.id === currentListId && (
                <span className="text-muted-foreground text-[10px]">current</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
