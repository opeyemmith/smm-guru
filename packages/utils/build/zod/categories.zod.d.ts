import { z } from "zod";
export declare const categoryFormSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type TCategoryForm = z.infer<typeof categoryFormSchema>;
//# sourceMappingURL=categories.zod.d.ts.map