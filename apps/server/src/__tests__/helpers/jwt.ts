import { SignJWT } from "jose";

const TEST_SECRET = process.env.AUTH_SECRET || "test-secret-key-for-vitest";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = TEST_SECRET;
}

export async function createTestToken(userId: string, expiresIn = "1h"): Promise<string> {
  const key = new TextEncoder().encode(TEST_SECRET);
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);

  return token;
}

export function authBearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}