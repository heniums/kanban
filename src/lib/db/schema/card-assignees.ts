import { primaryKey, uuid, pgTable } from "drizzle-orm/pg-core";
import { cards } from "./cards";
import { users } from "./users";

export const cardAssignees = pgTable(
  "card_assignees",
  {
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cardId, table.userId] }),
  }),
);

export type CardAssignee = typeof cardAssignees.$inferSelect;
export type NewCardAssignee = typeof cardAssignees.$inferInsert;
