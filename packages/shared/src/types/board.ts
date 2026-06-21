export interface Board {
  id: string;
  title: string;
  description: string | null;
  background: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}