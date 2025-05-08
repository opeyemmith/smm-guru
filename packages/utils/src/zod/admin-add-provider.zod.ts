import { z } from "zod";

export const addProviderFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  apiUrl: z.string().url().trim(),
  apiKey: z
    .string()
    .min(8, { message: "API Key must be at least 8 characters." }).trim(),
});

export type TAddProviderForm = z.infer<typeof addProviderFormSchema>;
