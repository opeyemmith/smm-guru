"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceFormSchema = void 0;
const zod_1 = require("zod");
exports.serviceFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    profit: zod_1.z.number().min(0),
    category: zod_1.z.string().min(1),
});
//# sourceMappingURL=service.zod.js.map