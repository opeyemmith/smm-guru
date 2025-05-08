import { UNAUTHORIZED, ValidationError } from "@smm-guru/utils";
import { db } from "../database/db.js";
import { apikey as apikeySchema, eq, } from "@smm-guru/database";
export const verifyApiKey = async (key) => {
    try {
        const keyInfo = await db.query.apikey.findFirst({
            where: eq(apikeySchema.key, key),
        });
        if (!keyInfo) {
            return {
                valid: false,
                error: "API key not found",
                key: null,
            };
        }
        return {
            valid: true,
            error: null,
            key: keyInfo, // My provider error is here
        };
    }
    catch (error) {
        return {
            valid: false,
            error: "Database error",
            key: null,
        };
    }
};
const sessionValidator = async (c, next) => {
    const user = c.get("user");
    const path = c.req.path;
    let body;
    try {
        body = await c.req.json();
    }
    catch (error) { }
    const apiKey = body?.key;
    if (path.startsWith("/v2/api-key") && !user) {
        throw new ValidationError("Unauthorized access attempt detected.", {
            action: "access_protected_resource",
            requiredPermission: "user",
            receivedPermission: "unauthorized",
        }, UNAUTHORIZED);
    }
    if (path.startsWith("/v2/api-key") && user) {
        return next();
    }
    if (!apiKey) {
        throw new ValidationError("API key is missing.", {
            action: "provide_api_key",
            requiredPermission: "api_key",
            receivedPermission: "none",
        }, UNAUTHORIZED);
    }
    const { valid, error, key } = await verifyApiKey(apiKey);
    if (!valid || !key?.userId) {
        c.set("user-id", null);
        throw new ValidationError("Invalid api detected!", {
            action: "access_protected_resource",
            requiredPermission: "valid_api_key",
            receivedPermission: "invalid_api_key",
        }, UNAUTHORIZED);
    }
    c.set("user-id", key.userId);
    if (path.startsWith("/v2/handler") && !valid) {
        throw new ValidationError("Unauthorized access attempt.", {
            action: "access_protected_resource",
            requiredPermission: "valid_api_key",
            receivedPermission: "invalid_api_key",
            apiKeyError: error,
        }, UNAUTHORIZED);
    }
    return next();
};
export default sessionValidator;
