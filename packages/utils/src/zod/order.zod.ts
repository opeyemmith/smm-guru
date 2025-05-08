import { z } from "zod";

export const orderFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  service: z.string().min(1, "Service is required"),
  link: z.string().url("Invalid URL"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export type TOrderForm = z.infer<typeof orderFormSchema>;
