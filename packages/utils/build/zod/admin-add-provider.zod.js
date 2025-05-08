"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProviderFormSchema = void 0;
const zod_1 = require("zod");
exports.addProviderFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
    apiUrl: zod_1.z.string().url().trim(),
    apiKey: zod_1.z
        .string()
        .min(8, { message: "API Key must be at least 8 characters." }).trim(),
});
//# sourceMappingURL=admin-add-provider.zod.js.map