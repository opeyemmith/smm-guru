import z from "zod";
export declare const createApiKeySchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type TCreateApiKey = z.infer<typeof createApiKeySchema>;
export declare const updateApiKeySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
}, {
    name: string;
    id: string;
}>;
export type TUpdateApiKey = z.infer<typeof updateApiKeySchema>;
//# sourceMappingURL=api-key.zod.d.ts.map