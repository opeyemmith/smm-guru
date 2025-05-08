import { errorHandler, addSession } from "@smm-guru/utils";
import sessionValidator from "@/lib/middleware.ts/unauthorized-access.middleware";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import routes from "./_routes/config.route";
import { auth } from "@/lib/better-auth/auth";

const app = new Hono().basePath("/api/v1");

// Middleware stack
app.use((c, n) => addSession(c, n, auth));
app.use(sessionValidator);

app.onError(errorHandler);

app.route("/", routes)

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
