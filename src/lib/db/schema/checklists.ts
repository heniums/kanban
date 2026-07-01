import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { cards } from "./cards";

export const checklists = pgTable("checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull(),
});

export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
