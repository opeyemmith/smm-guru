import { z } from "zod";
export declare const paytmFormSchema: z.ZodObject<{
    transactionId: z.ZodString;
    amount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transactionId: string;
    amount: string;
}, {
    transactionId: string;
    amount: string;
}>;
export type TPaytmForm = z.infer<typeof paytmFormSchema>;
//# sourceMappingURL=paytm.zod.d.ts.map