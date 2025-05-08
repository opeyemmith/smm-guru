import z from "zod";

export const createApiKeySchema = z.object({
  name: z.string().min(2, {
    message: "API key name must be at least 2 characters.",
  }),
});

export type TCreateApiKey = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(2, {
    message: "API key name must be at least 2 characters.",
  }),
});

export type TUpdateApiKey = z.infer<typeof updateApiKeySchema>;
