import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { listDeletedBoardsAction } from "@/lib/actions/boards";
import { PageContainer } from "@/components/layout/PageContainer";
import { TrashBoardList } from "@/components/boards/trash-board-list";

export default async function TrashPage() {
  await verifySession();

  const { boards } = await listDeletedBoardsAction();

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

      <TrashBoardList boards={boards} />
    </PageContainer>
  );
}
