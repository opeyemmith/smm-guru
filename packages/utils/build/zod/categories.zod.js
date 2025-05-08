"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryFormSchema = void 0;
const zod_1 = require("zod");
exports.categoryFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
});
//# sourceMappingURL=categories.zod.js.map