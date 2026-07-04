import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardById } from "@/lib/data/boards";
import { getUserRole } from "@/lib/permissions";
import { verifySession } from "@/lib/dal";
import { BoardHero } from "@/components/boards/board-hero";
import { BoardSettingsTabs } from "@/components/boards/board-settings-tabs";

interface BoardSettingsPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardSettingsPage({ params }: BoardSettingsPageProps) {
  const { userId } = await verifySession();

  const { boardId } = await params;
  const board = await getBoardById(boardId, { userId });

  if (!board) {
    notFound();
  }

  const role = await getUserRole(userId, boardId);

  if (role !== "owner") {
    redirect(`/boards/${boardId}`);
  }

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <BoardHero
        board={board}
        variant="full"
        breadcrumb={
          <Link href={`/boards/${boardId}`} className="text-sm underline-offset-4 hover:underline">
            &larr; Back to board
          </Link>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <BoardSettingsTabs board={board} />
      </div>
    </div>
  );
}
