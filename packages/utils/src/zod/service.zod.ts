import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().min(1),
  profit: z.number().min(0),
  category: z.string().min(1),
});

export type TServiceFormValues = z.infer<typeof serviceFormSchema>
