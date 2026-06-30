"use server";

import { registerUserSchema } from "@/lib/schemas/user";
import { createUser } from "@/lib/data/auth";

export type RegisterActionResult = { ok: true } | { ok: false; error: string };

export async function registerAction(input: {
  email: string;
  password: string;
  name: string;
}): Promise<RegisterActionResult> {
  const parsed = registerUserSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      error: first ? first.message : "Invalid input",
    };
  }

  try {
    await createUser(parsed.data);
    return { ok: true };
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      return { ok: false, error: "A user with this email already exists" };
    }
    console.error("Register error:", err);
    return { ok: false, error: "Internal server error" };
  }
}
