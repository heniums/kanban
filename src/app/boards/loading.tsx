import { BoardCardSkeleton } from "@/components/boards/board-card";
import { PageContainer } from "@/components/layout/PageContainer";

export default function BoardsLoading() {
  return (
    <PageContainer as="main">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-5 w-64 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-10 w-32 animate-pulse rounded" />
      </div>

      <section className="mb-10">
        <div className="bg-muted mb-4 h-7 w-28 animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section>
        <div className="bg-muted mb-4 h-7 w-36 animate-pulse rounded" />
        <div className="rounded-lg border border-dashed p-8">
          <div className="bg-muted mx-auto h-5 w-64 animate-pulse rounded" />
        </div>
      </section>
    </PageContainer>
  );
}
