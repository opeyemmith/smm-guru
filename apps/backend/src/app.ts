import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PORT } from "./lib/env.js";
import { logger } from "hono/logger";
import { addSession, errorHandler } from "@smm-guru/utils";
import { auth } from "./lib/better-auth/auth.js";
import routes from "./routes/routes.config.js";
import configCors from "./lib/middleware/cors.middleware.js";
import sessionValidator from "./lib/middleware/unauthorized-access.middleware.js";

const app = new Hono();

// Error handler
app.use(logger());
app.use(configCors);
app.onError(errorHandler);
app.use((c, n) => addSession(c, n, auth));
app.use(sessionValidator);

// Auth Route
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.route("/v2", routes);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
