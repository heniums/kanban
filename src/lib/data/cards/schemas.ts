export interface CreateCardInput {
  listId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  labelIds?: string[];
  assigneeIds?: string[];
}

export interface UpdateCardInput {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  listId?: string;
  labelIds?: string[];
  assigneeIds?: string[];
}
