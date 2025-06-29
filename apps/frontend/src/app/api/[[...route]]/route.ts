import { errorHandler, addSession } from "@smm-guru/utils";
import sessionValidator from "@/lib/middleware.ts/unauthorized-access.middleware";
import { bodyLimit } from "hono/body-limit";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import routes from "./_routes/config.route";
import { auth } from "@/lib/better-auth/auth";

const app = new Hono().basePath("/api/v1");

// ENTERPRISE SECURITY MIDDLEWARE STACK (order is critical!)
// 1. PAYLOAD SIZE VALIDATION FIRST (prevents DoS attacks and info disclosure)
app.use(
  bodyLimit({
    maxSize: 100 * 1024, // 100KB limit for frontend APIs (stricter)
    onError: (c) => {
      return c.json(
        {
          success: false,
          error: "Payload Too Large",
          message: "Request payload exceeds maximum allowed size",
          maxSize: "100KB"
        },
        413 // HTTP 413 Payload Too Large
      );
    }
  })
);

// 2. JSON VALIDATION MIDDLEWARE (before authentication to prevent info disclosure)
app.use(async (c, next) => {
  // Only validate JSON for POST, PUT, PATCH requests with JSON content-type
  const method = c.req.method;
  const contentType = c.req.header('content-type');

  if (['POST', 'PUT', 'PATCH'].includes(method) && contentType?.includes('application/json')) {
    try {
      // Attempt to parse JSON to validate syntax
      const body = await c.req.text();
      if (body.trim()) {
        JSON.parse(body);
      }

      // Create new request with the body for downstream middleware
      const newRequest = new Request(c.req.url, {
        method: c.req.method,
        headers: c.req.headers,
        body: body || undefined
      });

      // Replace the request in context
      c.req = newRequest as any;
    } catch (error) {
      console.log('🚨 JSON validation failed - malformed JSON detected');
      return c.json(
        {
          success: false,
          error: "Invalid JSON",
          message: "Request body contains malformed JSON",
          details: {
            action: "check_json_syntax",
            hint: "Ensure your JSON is properly formatted"
          }
        },
        400 // HTTP 400 Bad Request
      );
    }
  }

  return next();
});

// 3. Session management
app.use((c, n) => addSession(c, n, auth));

// 4. Authentication/authorization LAST
app.use(sessionValidator);

app.onError(errorHandler);

app.route("/", routes)

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
