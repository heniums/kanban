import { z } from "zod";

const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

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
  query: z.string().min(2).max(255),
});

export const getBoardMembersSchema = z.object({
  boardId: uuid,
});
