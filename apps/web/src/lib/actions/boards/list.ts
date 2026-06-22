"use server";

import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull, desc } from "drizzle-orm";

import { getSessionUserId } from "./auth";

const MAX_LIMIT = 100;

export async function listBoardsAction() {
  const userId = await getSessionUserId();

  const db = createDbClient();

  const [owned] = await Promise.all([
    db
      .select()
      .from(boards)
      .where(and(eq(boards.ownerId, userId), isNull(boards.deletedAt)))
      .orderBy(desc(boards.createdAt))
      .limit(MAX_LIMIT),
  ]);

  const shared: typeof owned = [];

  return { owned, shared };
}
