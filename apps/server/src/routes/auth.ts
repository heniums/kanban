import { Router } from "express";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { loginSchema, registerUserSchema } from "../../../../packages/shared/src/index.js";

import { createDbClient } from "../db.js";
import { users } from "../schema/users.js";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = registerUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password, name } = parsed.data;
  const db = createDbClient();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const passwordHash = await hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name })
    .returning();

  const { passwordHash: _, ...publicUser } = user;
  res.status(201).json({ user: publicUser });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;
  const db = createDbClient();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await compare(password, user.passwordHash);

  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { passwordHash: _, ...publicUser } = user;
  res.json({ user: publicUser });
});

export default router;
