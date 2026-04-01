import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(size = 32): string {
  return randomBytes(size).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function compareHashedToken(token: string, hash: string): boolean {
  const left = Buffer.from(hashToken(token), "utf8");
  const right = Buffer.from(hash, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function contentHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

