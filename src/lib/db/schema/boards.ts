import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const boards = pgTable(
  "boards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    background: text("background").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    ownerIdIdx: index("boards_owner_id_idx").on(table.ownerId),
    deletedAtIdx: index("boards_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`deleted_at IS NOT NULL`),
  }),
);

export type Board = typeof boards.$inferSelect;
