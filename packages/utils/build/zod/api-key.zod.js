"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApiKeySchema = exports.createApiKeySchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createApiKeySchema = zod_1.default.object({
    name: zod_1.default.string().min(2, {
        message: "API key name must be at least 2 characters.",
    }),
});
exports.updateApiKeySchema = zod_1.default.object({
    id: zod_1.default.string(),
    name: zod_1.default.string().min(2, {
        message: "API key name must be at least 2 characters.",
    }),
});
//# sourceMappingURL=api-key.zod.js.map