import type { FastifyInstance } from "fastify";

import { hashToken, randomToken } from "./crypto.js";
import type { AuthBundle } from "../store/types.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_DAYS = 30;

export async function issueSession(app: FastifyInstance, bundle: AuthBundle) {
  const accessToken = await app.jwt.sign(
    {
      userId: bundle.user.id,
      orgId: bundle.organization.id,
      email: bundle.user.email,
      role: bundle.user.role
    },
    {
      expiresIn: ACCESS_TOKEN_TTL
    }
  );

  const refreshToken = randomToken(32);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await app.store.createRefreshToken(
    bundle.user.id,
    bundle.organization.id,
    hashToken(refreshToken),
    refreshExpiresAt
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: bundle.user.id,
      email: bundle.user.email,
      role: bundle.user.role
    },
    organization: {
      id: bundle.organization.id,
      name: bundle.organization.name
    },
    entitlement: bundle.entitlement
  };
}
