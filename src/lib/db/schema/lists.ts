import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { boards } from "./boards";

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    boardIdPositionUnique: unique("lists_board_id_position_unique").on(
      table.boardId,
      table.position,
    ),
  }),
);

export type List = typeof lists.$inferSelect;
