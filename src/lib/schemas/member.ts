import { z } from "zod";

const uuid = z.string().uuid();

export const addMemberSchema = z.object({
  boardId: uuid,
  userId: uuid,
});

export const removeMemberSchema = z.object({
  boardId: uuid,
  userId: uuid,
});

export const searchUsersSchema = z.object({
  boardId: uuid,
  query: z.string().min(2),
});

export const getBoardMembersSchema = z.object({
  boardId: uuid,
});
