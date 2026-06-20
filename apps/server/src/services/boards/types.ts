import type { boards } from "../../schema/boards.js";

export type Board = typeof boards.$inferSelect;
export type BoardInput = {
  title: string;
  description?: string;
  background: string;
  ownerId: string;
};
export type BoardUpdate = {
  title?: string;
  description?: string;
  background?: string;
};
