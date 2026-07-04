import { describe, expect, it } from "vitest";
// @vitest-environment node
import { TestDataFactory } from "@/__tests__/test-factory";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";
import { BoardPermission, ROLE_PERMISSIONS, hasPermission, getUserRole } from "@/lib/permissions";

const db = createDbClient();
const factory = new TestDataFactory();
factory.registerCleanup();

async function createTestUser(label: string) {
  return factory.createUser({
    email: `perm-test-${label}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@kanban.local`,
    name: `Test User ${label}`,
  });
}

describe("Permissions system", () => {
  describe("ROLE_PERMISSIONS mapping", () => {
    it("contains correct permissions for owner role", () => {
      expect(ROLE_PERMISSIONS.owner).toContain(BoardPermission.VIEW);
      expect(ROLE_PERMISSIONS.owner).toContain(BoardPermission.EDIT_CONTENT);
      expect(ROLE_PERMISSIONS.owner).toContain(BoardPermission.MANAGE_SETTINGS);
      expect(ROLE_PERMISSIONS.owner).toContain(BoardPermission.MANAGE_MEMBERS);
    });

    it("contains correct permissions for member role", () => {
      expect(ROLE_PERMISSIONS.member).toContain(BoardPermission.VIEW);
      expect(ROLE_PERMISSIONS.member).toContain(BoardPermission.EDIT_CONTENT);
      expect(ROLE_PERMISSIONS.member).not.toContain(BoardPermission.MANAGE_SETTINGS);
      expect(ROLE_PERMISSIONS.member).not.toContain(BoardPermission.MANAGE_MEMBERS);
    });
  });

  describe("getUserRole", () => {
    it("returns the correct role for a board owner", async () => {
      const user = await createTestUser("owner-role");
      const board = await factory.createBoard({
        title: "Owner Role Board",
        background: "#000000",
        ownerId: user.id,
      });

      const role = await getUserRole(user.id, board.id);
      expect(role).toBe("owner");
    });

    it("returns the correct role for a board member", async () => {
      const owner = await createTestUser("member-role-owner");
      const member = await createTestUser("member-role-member");
      const board = await factory.createBoard({
        title: "Member Role Board",
        background: "#000000",
        ownerId: owner.id,
      });

      await db.insert(boardMembers).values({
        boardId: board.id,
        userId: member.id,
        role: "member",
      });

      const role = await getUserRole(member.id, board.id);
      expect(role).toBe("member");
    });

    it("returns null when user is not a board member", async () => {
      const owner = await createTestUser("non-member-owner");
      const nonMember = await createTestUser("non-member");
      const board = await factory.createBoard({
        title: "Non-Member Board",
        background: "#000000",
        ownerId: owner.id,
      });

      const role = await getUserRole(nonMember.id, board.id);
      expect(role).toBeNull();
    });
  });

  describe("hasPermission", () => {
    it("returns true when owner has the permission", async () => {
      const user = await createTestUser("owner-perm");
      const board = await factory.createBoard({
        title: "Owner Perm Board",
        background: "#000000",
        ownerId: user.id,
      });

      expect(await hasPermission(user.id, board.id, BoardPermission.VIEW)).toBe(true);
      expect(await hasPermission(user.id, board.id, BoardPermission.EDIT_CONTENT)).toBe(true);
      expect(await hasPermission(user.id, board.id, BoardPermission.MANAGE_SETTINGS)).toBe(true);
      expect(await hasPermission(user.id, board.id, BoardPermission.MANAGE_MEMBERS)).toBe(true);
    });

    it("returns true when member has view permission", async () => {
      const owner = await createTestUser("member-view-owner");
      const member = await createTestUser("member-view");
      const board = await factory.createBoard({
        title: "Member View Board",
        background: "#000000",
        ownerId: owner.id,
      });

      await db.insert(boardMembers).values({
        boardId: board.id,
        userId: member.id,
        role: "member",
      });

      expect(await hasPermission(member.id, board.id, BoardPermission.VIEW)).toBe(true);
      expect(await hasPermission(member.id, board.id, BoardPermission.EDIT_CONTENT)).toBe(true);
    });

    it("returns false when member lacks manage_settings permission", async () => {
      const owner = await createTestUser("member-no-settings-owner");
      const member = await createTestUser("member-no-settings");
      const board = await factory.createBoard({
        title: "Member No Settings Board",
        background: "#000000",
        ownerId: owner.id,
      });

      await db.insert(boardMembers).values({
        boardId: board.id,
        userId: member.id,
        role: "member",
      });

      expect(await hasPermission(member.id, board.id, BoardPermission.MANAGE_SETTINGS)).toBe(false);
      expect(await hasPermission(member.id, board.id, BoardPermission.MANAGE_MEMBERS)).toBe(false);
    });

    it("returns false when user is not a board member", async () => {
      const owner = await createTestUser("non-member-perm-owner");
      const nonMember = await createTestUser("non-member-perm");
      const board = await factory.createBoard({
        title: "Non-Member Perm Board",
        background: "#000000",
        ownerId: owner.id,
      });

      expect(await hasPermission(nonMember.id, board.id, BoardPermission.VIEW)).toBe(false);
      expect(await hasPermission(nonMember.id, board.id, BoardPermission.EDIT_CONTENT)).toBe(false);
    });
  });
});
