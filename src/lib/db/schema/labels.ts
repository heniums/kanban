import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { boards } from "./boards";

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
  },
  (table) => ({
    boardIdIdx: index("labels_board_id_idx").on(table.boardId),
  }),
);

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
