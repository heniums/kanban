import { pgEnum, pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { boards } from "./boards";
import { users } from "./users";

export const boardMemberRoleEnum = pgEnum("board_member_role", ["owner", "member"]);

export const boardMembers = pgTable(
  "board_members",
  {
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: boardMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.boardId, table.userId] }),
  }),
);

export type BoardMember = typeof boardMembers.$inferSelect;
export type BoardMemberRole = "owner" | "member";
