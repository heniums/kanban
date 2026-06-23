import { BoardCardSkeleton } from "@/components/boards/board-card";

export default function BoardsLoading() {
  return (
    <main className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>

      <section className="mb-10">
        <div className="mb-4 h-7 w-28 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 h-7 w-36 animate-pulse rounded bg-muted" />
        <div className="rounded-lg border border-dashed p-8">
          <div className="mx-auto h-5 w-64 animate-pulse rounded bg-muted" />
        </div>
      </section>
    </main>
  );
}
