import { z } from "zod";

export const paytmFormSchema = z.object({
  transactionId: z.string().min(1, {
    message: "Transaction ID is required.",
  }),
  amount: z.string().min(1, { message: "Amount is required." }),
});

export type TPaytmForm = z.infer<typeof paytmFormSchema>;
