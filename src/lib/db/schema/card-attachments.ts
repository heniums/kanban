import { integer, pgTable, uuid, unique } from "drizzle-orm/pg-core";
import { cards } from "./cards";
import { attachments } from "./attachments";

export const cardAttachments = pgTable(
  "card_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    attachmentId: uuid("attachment_id")
      .notNull()
      .references(() => attachments.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => ({
    cardIdAttachmentIdUnique: unique("card_attachments_card_id_attachment_id_unique").on(
      table.cardId,
      table.attachmentId,
    ),
  }),
);

export type CardAttachment = typeof cardAttachments.$inferSelect;
export type NewCardAttachment = typeof cardAttachments.$inferInsert;
