import { Hono } from "hono";
import { auth } from "../../lib/better-auth/auth.js";
import { zValidator } from "@hono/zod-validator";
import { createApiKeySchema, CREATED, OK, updateApiKeySchema, } from "@smm-guru/utils";
import { db } from "../../lib/database/db.js";
import { and, apikey, eq } from "@smm-guru/database";
const apiKeyRoute = new Hono();
apiKeyRoute.get("/", async (c) => {
    const user = c.get("user");
    const allUserApiKeys = await db
        .select()
        .from(apikey)
        .where(eq(apikey.userId, user.id));
    return c.json({
        success: true,
        name: "API_KEYS_FETCHED",
        message: "API keys fetched successfully",
        result: allUserApiKeys,
    }, OK);
});
apiKeyRoute.post("/", zValidator("json", createApiKeySchema), async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    await auth.api.createApiKey({
        body: {
            name: body.name,
            prefix: "smm_guru_live_",
            rateLimitTimeWindow: 1000, // every second
            rateLimitMax: 300, // every second, they can use up to 300 requests
            rateLimitEnabled: true,
            userId: user.id, // the user id to create the API key for
        },
    });
    return c.json({
        success: true,
        name: "API_KEY_CREATED",
        message: "API key created successfully",
        result: null,
    }, CREATED);
});
apiKeyRoute.patch("/", zValidator("json", updateApiKeySchema), async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    await auth.api.updateApiKey({
        body: {
            keyId: body.id,
            name: body.name,
            userId: user.id,
        },
    });
    return c.json({
        success: true,
        name: "API_KEY_UPDATED",
        message: "API key updated successfully",
        result: null,
    }, OK);
});
apiKeyRoute.delete("/:id", async (c) => {
    const apiKeyId = c.req.param("id");
    const user = c.get("user");
    await db
        .delete(apikey)
        .where(and(eq(apikey.id, apiKeyId), eq(apikey.userId, user.id)));
    return c.json({
        success: true,
        name: "API_KEY_DELETED",
        message: "API key deleted successfully",
        result: null,
    }, OK);
});
export default apiKeyRoute;
