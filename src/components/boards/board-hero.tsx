import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getTextColor } from "@/lib/text-color";
import type { Board } from "@/lib/db/schema/boards";

export type BoardHeroVariant = "full" | "compact";

interface BoardHeroProps {
  board: Board;
  variant: BoardHeroVariant;
  className?: string;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<BoardHeroVariant, string> = {
  full: "min-h-[200px] py-8",
  compact: "h-24",
};

export function BoardHero({ board, variant, className, children }: BoardHeroProps) {
  const textColor = getTextColor(board.background);
  const isFull = variant === "full";

  return (
    <section
      aria-label={`${board.title} board header`}
      className={cn(
        "relative w-full overflow-hidden rounded-b-lg",
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{ background: board.background, color: textColor }}
    >
      <div
        className={cn(
          "mx-auto flex h-full w-full max-w-7xl px-4 sm:px-6 lg:px-8",
          isFull ? "flex-col justify-between gap-3 py-2" : "items-end justify-between gap-2 pb-2",
        )}
      >
        {isFull ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold" style={{ color: textColor }}>
                  {board.title}
                </h1>
                {board.description && (
                  <p className="mt-1 truncate opacity-90" style={{ color: textColor }}>
                    {board.description}
                  </p>
                )}
              </div>
              {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
            </div>
          </>
        ) : (
          <>
            <span
              className="truncate text-sm font-semibold drop-shadow"
              style={{ color: textColor }}
            >
              {board.title}
            </span>
            {children && <div className="flex shrink-0 items-center gap-1">{children}</div>}
          </>
        )}
      </div>
    </section>
  );
}
