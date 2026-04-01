import {
  authSessionSchema,
  extensionEventSchema,
  justificationRequestSchema,
  policyPackSchema
} from "@promptshield/core";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";

import type { AppConfig } from "./config.js";
import { hashToken } from "./lib/crypto.js";
import { sendMagicLinkEmail } from "./lib/mailer.js";
import { getOpenApiDocument } from "./lib/openapi.js";
import { createStripeClient, priceIdForPlan } from "./lib/stripe.js";
import { issueSession } from "./lib/tokens.js";
import type { DataStore, UserRole } from "./store/types.js";

const magicLinkBodySchema = z.object({
  email: z.string().email(),
  orgName: z.string().optional()
});

const sessionRequestSchema = z.union([
  z.object({
    magicToken: z.string()
  }),
  z.object({
    refreshToken: z.string()
  }),
  z.object({
    deviceCode: z.string(),
    deviceId: z.string(),
    extensionVersion: z.string().nullable().optional()
  })
]);

const publishPolicyBodySchema = z.object({
  name: z.string(),
  protectedDomains: z.array(z.string()),
  rules: policyPackSchema.shape.rules
});

const checkoutBodySchema = z.object({
  plan: z.enum(["pro", "team", "enterprise"])
});

export async function createApp(config: AppConfig, store: DataStore) {
  const app = Fastify({
    logger: config.NODE_ENV !== "test"
  });

  app.decorate("config", config);
  app.decorate("store", store);

  await app.register(cors, {
    origin: true
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET
  });

  const stripe = createStripeClient(config);

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify<{
        userId: string;
        orgId: string;
        email: string;
        role: UserRole;
      }>();
      request.auth = request.user as typeof request.auth;
    } catch {
      reply.code(401).send({
        error: "Unauthorized"
      });
    }
  };

  const requireRoles =
    (roles: UserRole[]) =>
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await authenticate(request, reply);
      if (!request.auth) {
        return;
      }
      if (!roles.includes(request.auth.role)) {
        reply.code(403).send({
          error: "Forbidden"
        });
      }
    };

  app.get("/health", async () => ({
    status: "ok",
    service: "promptshield-api"
  }));

  app.get("/openapi.json", async () => getOpenApiDocument());

  app.post("/v1/auth/magic-links", async (request, reply) => {
    const body = magicLinkBodySchema.parse(request.body);
    const { token, session } = await app.store.createMagicLink(body.email, body.orgName);
    const verifyUrl = `${config.WEB_BASE_URL}/auth/verify?token=${token}`;
    const mailResult = await sendMagicLinkEmail(config, body.email, verifyUrl);

    reply.code(202).send({
      ok: true,
      organization: session.organization,
      previewUrl: config.ENABLE_DEV_MAGIC_LINK_PREVIEW ? mailResult.previewUrl : undefined
    });
  });

  app.post("/v1/auth/session", async (request, reply) => {
    const body = sessionRequestSchema.parse(request.body);

    if ("magicToken" in body) {
      const bundle = await app.store.consumeMagicLink(hashToken(body.magicToken));
      if (!bundle) {
        return reply.code(401).send({
          error: "Invalid or expired magic link"
        });
      }
      const session = authSessionSchema.parse(await issueSession(app, bundle));
      return reply.send(session);
    }

    if ("refreshToken" in body) {
      const refreshHash = hashToken(body.refreshToken);
      const bundle = await app.store.consumeRefreshToken(refreshHash);
      if (!bundle) {
        return reply.code(401).send({
          error: "Invalid or expired refresh token"
        });
      }
      await app.store.revokeRefreshToken(refreshHash);
      const session = authSessionSchema.parse(await issueSession(app, bundle));
      return reply.send(session);
    }

    const bundle = await app.store.consumeDeviceCode(
      body.deviceCode.toUpperCase(),
      body.deviceId,
      body.extensionVersion ?? null
    );
    if (!bundle) {
      return reply.code(401).send({
        error: "Invalid or expired device code"
      });
    }
    const session = authSessionSchema.parse(await issueSession(app, bundle));
    return reply.send({
      ...session,
      device: bundle.device
    });
  });

  app.get("/v1/me", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const bundle = await app.store.getAuthBundle(request.auth.userId, request.auth.orgId);
    if (!bundle) {
      return reply.code(404).send({
        error: "User not found"
      });
    }
    reply.send({
      user: bundle.user,
      organization: bundle.organization,
      entitlement: bundle.entitlement
    });
  });

  app.post("/v1/auth/device-codes", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const code = await app.store.createDeviceCode(request.auth.userId, request.auth.orgId, expiresAt);
    reply.send({
      code: code.code,
      expiresAt
    });
  });

  app.get("/v1/extension/bootstrap", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const bundle = await app.store.getAuthBundle(request.auth.userId, request.auth.orgId);
    const policy = await app.store.getPolicy(request.auth.orgId);
    reply.send({
      organization: bundle?.organization,
      entitlement: bundle?.entitlement,
      policyVersion: policy.version,
      protectedDomains: policy.protectedDomains,
      lastSync: new Date().toISOString()
    });
  });

  app.get("/v1/policies/current", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const policy = await app.store.getPolicy(request.auth.orgId);
    reply.send(policy);
  });

  app.post("/v1/events/batch", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const body = z
      .object({
        events: z.array(extensionEventSchema)
      })
      .parse(request.body);
    const count = await app.store.recordEvents(
      request.auth.orgId,
      request.auth.userId,
      request.headers["x-device-id"]?.toString(),
      body.events
    );
    reply.code(202).send({
      accepted: count
    });
  });

  app.post("/v1/justifications", { preHandler: authenticate }, async (request, reply) => {
    if (!request.auth) {
      return reply;
    }
    const body = justificationRequestSchema.parse(request.body);
    const justification = await app.store.createJustification(request.auth.orgId, request.auth.userId, body);
    reply.code(201).send(justification);
  });

  app.get(
    "/v1/admin/overview",
    {
      preHandler: requireRoles(["owner", "security_admin", "analyst", "billing_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      reply.send(await app.store.getOverview(request.auth.orgId));
    }
  );

  app.get(
    "/v1/admin/events",
    {
      preHandler: requireRoles(["owner", "security_admin", "analyst"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      const filters = z
        .object({
          severity: z.string().optional(),
          action: z.string().optional(),
          query: z.string().optional(),
          destinationDomain: z.string().optional()
        })
        .parse(request.query);
      reply.send(await app.store.listEvents(request.auth.orgId, filters));
    }
  );

  app.get(
    "/v1/admin/events/export.csv",
    {
      preHandler: requireRoles(["owner", "security_admin", "analyst"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      const events = await app.store.listEvents(request.auth.orgId, {});
      const header = [
        "id",
        "createdAt",
        "eventType",
        "severity",
        "action",
        "destinationDomain",
        "detectorIds",
        "ruleIds"
      ];
      const rows = events.map((event) =>
        [
          event.id,
          event.createdAt,
          event.eventType,
          event.severity,
          event.action,
          event.destinationDomain,
          event.detectorIds.join("|"),
          event.ruleIds.join("|")
        ].join(",")
      );

      reply
        .header("content-type", "text/csv")
        .send([header.join(","), ...rows].join("\n"));
    }
  );

  app.get(
    "/v1/admin/policies/current",
    {
      preHandler: requireRoles(["owner", "security_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      reply.send(await app.store.getPolicy(request.auth.orgId));
    }
  );

  app.post(
    "/v1/admin/policies/publish",
    {
      preHandler: requireRoles(["owner", "security_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      const body = publishPolicyBodySchema.parse(request.body);
      const policy = await app.store.publishPolicy(request.auth.orgId, request.auth.userId, body);
      reply.code(201).send(policy);
    }
  );

  app.get(
    "/v1/admin/users-devices",
    {
      preHandler: requireRoles(["owner", "security_admin", "billing_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      reply.send(await app.store.listUsersAndDevices(request.auth.orgId));
    }
  );

  app.get(
    "/v1/admin/billing",
    {
      preHandler: requireRoles(["owner", "billing_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      reply.send(await app.store.getBilling(request.auth.orgId));
    }
  );

  app.post(
    "/v1/billing/checkout",
    {
      preHandler: requireRoles(["owner", "billing_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }

      const body = checkoutBodySchema.parse(request.body);
      const priceId = priceIdForPlan(config, body.plan);
      const bundle = await app.store.getAuthBundle(request.auth.userId, request.auth.orgId);
      if (!bundle) {
        return reply.code(404).send({
          error: "Account not found"
        });
      }

      if (!stripe || !priceId) {
        await app.store.updateBilling({
          orgId: request.auth.orgId,
          plan: body.plan,
          state: body.plan === "enterprise" ? "active" : "trialing"
        });
        return reply.send({
          url: `${config.WEB_BASE_URL}/app/billing?checkout=mock&plan=${body.plan}`
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: bundle.user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${config.WEB_BASE_URL}/app/billing?checkout=success`,
        cancel_url: `${config.WEB_BASE_URL}/pricing?checkout=cancelled`,
        metadata: {
          orgId: request.auth.orgId,
          plan: body.plan
        },
        subscription_data: {
          trial_period_days: config.DEFAULT_TRIAL_DAYS
        }
      });

      reply.send({
        url: session.url
      });
    }
  );

  app.post(
    "/v1/billing/portal",
    {
      preHandler: requireRoles(["owner", "billing_admin"])
    },
    async (request, reply) => {
      if (!request.auth) {
        return reply;
      }
      const billing = await app.store.getBilling(request.auth.orgId);
      if (!stripe || !billing.stripeCustomerId) {
        return reply.send({
          url: `${config.WEB_BASE_URL}/app/billing?portal=mock`
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: billing.stripeCustomerId,
        return_url: `${config.WEB_BASE_URL}/app/billing`
      });

      reply.send({
        url: session.url
      });
    }
  );

  app.post("/v1/webhooks/stripe", async (request, reply) => {
    const body = z
      .object({
        type: z.string(),
        data: z.object({
          object: z.record(z.string(), z.any())
        })
      })
      .parse(request.body);

    const object = body.data.object;
    const orgId = typeof object.metadata?.orgId === "string" ? object.metadata.orgId : undefined;
    if (!orgId) {
      return reply.code(202).send({
        ignored: true
      });
    }

    if (body.type === "checkout.session.completed") {
      await app.store.updateBilling({
        orgId,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null
      });
    }

    if (body.type === "customer.subscription.created" || body.type === "customer.subscription.updated") {
      const priceId =
        typeof object.items?.data?.[0]?.price?.id === "string" ? object.items.data[0].price.id : null;
      const plan =
        priceId === config.STRIPE_PRICE_PRO
          ? "pro"
          : priceId === config.STRIPE_PRICE_ENTERPRISE
            ? "enterprise"
            : "team";
      await app.store.updateBilling({
        orgId,
        stripeSubscriptionId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        state: (typeof object.status === "string" ? object.status : "active") as
          | "trialing"
          | "active"
          | "past_due"
          | "canceled"
          | "free",
        plan,
        currentPeriodEnd:
          typeof object.current_period_end === "number"
            ? new Date(object.current_period_end * 1000).toISOString()
            : null
      });
    }

    if (body.type === "customer.subscription.deleted") {
      await app.store.updateBilling({
        orgId,
        state: "canceled"
      });
    }

    reply.code(202).send({
      received: true
    });
  });

  return app;
}
