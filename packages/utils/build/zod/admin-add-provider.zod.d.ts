import { z } from "zod";
export declare const addProviderFormSchema: z.ZodObject<{
    name: z.ZodString;
    apiUrl: z.ZodString;
    apiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    apiUrl: string;
    apiKey: string;
}, {
    name: string;
    apiUrl: string;
    apiKey: string;
}>;
export type TAddProviderForm = z.infer<typeof addProviderFormSchema>;
//# sourceMappingURL=admin-add-provider.zod.d.ts.map