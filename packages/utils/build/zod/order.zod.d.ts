import { z } from "zod";
export declare const orderFormSchema: z.ZodObject<{
    category: z.ZodString;
    service: z.ZodString;
    link: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    category: string;
    service: string;
    link: string;
    quantity: number;
}, {
    category: string;
    service: string;
    link: string;
    quantity: number;
}>;
export type TOrderForm = z.infer<typeof orderFormSchema>;
//# sourceMappingURL=order.zod.d.ts.map