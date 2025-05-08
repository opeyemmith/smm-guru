"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInFormSchema = exports.signUpFormSchema = exports.password = void 0;
const zod_1 = require("zod");
exports.password = zod_1.z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
})
    .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
})
    .regex(/[0-9]/, { message: "Password must contain at least one number" });
exports.signUpFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: zod_1.z.string().email({ message: "Please enter a valid email address" }),
    password: exports.password,
});
exports.signInFormSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Please enter a valid email address" }),
    password: exports.password,
});
//# sourceMappingURL=auth.zod.js.map