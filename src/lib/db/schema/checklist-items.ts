import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { checklists } from "./checklists";

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => checklists.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  position: integer("position").notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;
