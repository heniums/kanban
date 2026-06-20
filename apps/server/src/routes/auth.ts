import { Router, type Request, type Response } from "express";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { loginSchema, registerUserSchema } from "@kanban/shared";

import { createDbClient } from "../db.js";
import { users } from "../schema/users.js";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  const { email, password, name } = parsed.data;
  const db = createDbClient();

  try {
    const passwordHash = await hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, name })
      .returning();

    const { passwordHash: _, ...publicUser } = user;
    res.status(201).json({ user: publicUser });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  const { email, password } = parsed.data;
  const db = createDbClient();

  try {
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
