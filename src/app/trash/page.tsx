import Link from "next/link";
import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import { listDeletedBoardsAction } from "@/lib/actions/boards";
import { PageContainer } from "@/components/layout/PageContainer";
import { TrashBoardList } from "@/components/boards/trash-board-list";
import { TrashSearchInput } from "@/components/boards/trash-search-input";
import { TrashPagination } from "@/components/boards/trash-pagination";

const PAGE_SIZE = 10;

interface TrashPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function TrashPage({ searchParams }: TrashPageProps) {
  await verifySession();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = params.q ?? "";

  const { boards, total } = await listDeletedBoardsAction({ page, search });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer as="main">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-muted-foreground">
            Manage your deleted boards. Restore or permanently delete them.
          </p>
        </div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="mb-6 max-w-sm">
        <Suspense>
          <TrashSearchInput />
        </Suspense>
      </div>

      <TrashBoardList boards={boards} />

      <TrashPagination currentPage={page} totalPages={totalPages} search={search} />
    </PageContainer>
  );
}
