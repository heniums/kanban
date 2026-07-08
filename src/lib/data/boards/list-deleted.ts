import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq, and, isNotNull, desc, ilike, sql, type SQL } from "drizzle-orm";

export interface ListDeletedBoardsParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListDeletedBoardsResult {
  boards: Board[];
  total: number;
}

const DEFAULT_LIMIT = 10;

export async function listDeletedBoardsByOwner(
  params: ListDeletedBoardsParams,
): Promise<ListDeletedBoardsResult> {
  const db = createDbClient();
  const limit = params.limit ?? DEFAULT_LIMIT;
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(boards.ownerId, params.userId), isNotNull(boards.deletedAt)];

  if (params.search) {
    conditions.push(ilike(boards.title, `%${params.search}%`));
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(boards)
      .where(whereClause)
      .orderBy(desc(boards.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(boards)
      .where(whereClause),
  ]);

  return {
    boards: data,
    total: countResult[0]?.count ?? 0,
  };
}
