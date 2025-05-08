import { UNAUTHORIZED, ValidationError } from "@smm-guru/utils";
import { auth } from "../better-auth/auth.js";
const sessionValidator = async (c, next) => {
    const user = c.get("user");
    const path = c.req.path;
    const { key: apiKey } = await c.req.json();
    if (path.startsWith("/v2/api-key") && !user) {
        throw new ValidationError("Unauthorized access attempt detected.", {
            action: "access_protected_resource",
            requiredPermission: "user",
            receivedPermission: "unauthorized",
        }, UNAUTHORIZED);
    }
    if (!apiKey) {
        throw new ValidationError("API key is missing.", {
            action: "provide_api_key",
            requiredPermission: "api_key",
            receivedPermission: "none",
        }, UNAUTHORIZED);
    }
    const { valid, error, key } = await auth.api.verifyApiKey({
        body: {
            key: apiKey,
        },
    });
    if (path.startsWith("/v2/handler") && !valid) {
        throw new ValidationError(error?.message || "Unauthorized access attempt.", {
            action: "access_protected_resource",
            requiredPermission: "valid_api_key",
            receivedPermission: "invalid_api_key",
            apiKeyError: error,
        }, UNAUTHORIZED);
    }
    return next();
};
export default sessionValidator;
