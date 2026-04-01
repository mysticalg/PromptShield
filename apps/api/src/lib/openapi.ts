export function getOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "PromptShield API",
      version: "0.1.0",
      description: "Versioned JSON API for PromptShield extension, admin console, and billing."
    },
    servers: [
      {
        url: "/"
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "API is healthy"
            }
          }
        }
      },
      "/v1/auth/magic-links": {
        post: {
          summary: "Request a magic link"
        }
      },
      "/v1/auth/session": {
        post: {
          summary: "Create a session from a magic token, refresh token, or device code"
        }
      },
      "/v1/auth/device-codes": {
        post: {
          summary: "Create a short-lived device activation code"
        }
      },
      "/v1/extension/bootstrap": {
        get: {
          summary: "Fetch extension bootstrap context"
        }
      },
      "/v1/policies/current": {
        get: {
          summary: "Fetch the current policy pack"
        }
      },
      "/v1/events/batch": {
        post: {
          summary: "Upload a batch of extension events"
        }
      },
      "/v1/justifications": {
        post: {
          summary: "Create a justification record"
        }
      },
      "/v1/admin/overview": {
        get: {
          summary: "Fetch dashboard overview metrics"
        }
      },
      "/v1/admin/events": {
        get: {
          summary: "List metadata-only events"
        }
      },
      "/v1/admin/policies/publish": {
        post: {
          summary: "Publish a new policy pack version"
        }
      },
      "/v1/billing/checkout": {
        post: {
          summary: "Create a Stripe Checkout session"
        }
      },
      "/v1/billing/portal": {
        post: {
          summary: "Create a Stripe customer portal session"
        }
      },
      "/v1/webhooks/stripe": {
        post: {
          summary: "Handle Stripe subscription lifecycle updates"
        }
      }
    }
  };
}
