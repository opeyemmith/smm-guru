import { z } from "zod";

export const password = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

export const signUpFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password,
});

export type TSignUpForm = z.infer<typeof signUpFormSchema>;

export const signInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password,
});

export type TSignInForm = z.infer<typeof signInFormSchema>;
