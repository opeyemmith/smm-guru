import { z } from "zod";
export declare const password: z.ZodString;
export declare const signUpFormSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export type TSignUpForm = z.infer<typeof signUpFormSchema>;
export declare const signInFormSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type TSignInForm = z.infer<typeof signInFormSchema>;
//# sourceMappingURL=auth.zod.d.ts.map