import "server-only";

import { SignJWT } from "jose";

import { auth } from "@/auth";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";

async function getAuthToken(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not configured");
  }

  return new SignJWT({ id: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
}

type ApiResponse<T> = T;

async function serverApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    const message = (error as { error?: string }).error || `HTTP ${res.status}`;
    throw new ServerApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export { serverApiFetch };