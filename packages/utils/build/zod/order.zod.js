"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderFormSchema = void 0;
const zod_1 = require("zod");
exports.orderFormSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, "Category is required"),
    service: zod_1.z.string().min(1, "Service is required"),
    link: zod_1.z.string().url("Invalid URL"),
    quantity: zod_1.z.coerce.number().min(1, "Quantity must be at least 1"),
});
//# sourceMappingURL=order.zod.js.map