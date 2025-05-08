import { z } from "zod";
export declare const serviceFormSchema: z.ZodObject<{
    name: z.ZodString;
    profit: z.ZodNumber;
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    profit: number;
    category: string;
}, {
    name: string;
    profit: number;
    category: string;
}>;
export type TServiceFormValues = z.infer<typeof serviceFormSchema>;
//# sourceMappingURL=service.zod.d.ts.map