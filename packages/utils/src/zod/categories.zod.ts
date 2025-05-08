import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type TCategoryForm = z.infer<typeof categoryFormSchema>;
