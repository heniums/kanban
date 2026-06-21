import { type Request, type Response, type NextFunction } from "express";
import { jwtVerify, errors as joseErrors } from "jose";

function getAuthKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jwtVerify(token, getAuthKey());

    if (!payload.id || typeof payload.id !== "string") {
      res.status(401).json({ error: "Invalid token: missing user ID" });
      return;
    }

    req.userId = payload.id;
    next();
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (
      err instanceof joseErrors.JWTInvalid ||
      err instanceof joseErrors.JWSInvalid ||
      err instanceof joseErrors.JWSSignatureVerificationFailed
    ) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export { getAuthKey };