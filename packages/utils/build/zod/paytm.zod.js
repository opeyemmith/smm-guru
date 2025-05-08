"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paytmFormSchema = void 0;
const zod_1 = require("zod");
exports.paytmFormSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(1, {
        message: "Transaction ID is required.",
    }),
    amount: zod_1.z.string().min(1, { message: "Amount is required." }),
});
//# sourceMappingURL=paytm.zod.js.map