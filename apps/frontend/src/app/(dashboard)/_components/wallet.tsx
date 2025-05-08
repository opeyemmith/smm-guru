"use client";

import { P } from "@/components/global/p";
import { Loader2Icon, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { paytmFormSchema, TPaytmForm } from "@smm-guru/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useRef, useState } from "react";
import { axiosV1DashboardInstance } from "@/lib/axios/config";
import { toast } from "sonner";
import { ApiResponse } from "@/@types/response.type";
import { Skeleton } from "@/components/ui/skeleton";
import { displayError } from "@/lib/error/toast.error";
import { useCurrency } from "@/context/zustand/store";

const Wallet = () => {
  const { currency } = useCurrency();

  const { data, error, isError, isLoading, isPending } = useQuery({
    queryKey: ["wallet", currency],
    queryFn: async () => {
      const res = await axiosV1DashboardInstance.get<
        ApiResponse<{ balance: string; currency: string }>
      >("/wallet", {
        params: {
          currency,
        },
      });

      return res.data;
    },
    enabled: !!currency,
  });

  displayError(isError, error);

  return (
    <div className="w-fit h-fit flex items-center justify-center">
      <div className="mr-2">
        {isLoading && isPending && <Skeleton className="w-24 h-6" />}

        {!isLoading && !isPending && (
          <P variant="muted" weight="bold">
            {data && !isError
              ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: currency || "USD",
                }).format(Number(data.result.balance) || 0)
              : "error"}
          </P>
        )}
      </div>

      <PaytmQrModule />
    </div>
  );
};

export function PaytmQrModule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(paytmFormSchema),
    defaultValues: {
      transactionId: "",
      amount: "0",
    },
  });

  const mutationOnSubmit = useMutation({
    mutationFn: async (v: TPaytmForm) => {
      const res = await axiosV1DashboardInstance.post<ApiResponse<null>>(
        "/fund/add/paytm-qr",
        v
      );
      return res.data;
    },
    onError: (e) => {
      displayError(true, e);
    },
    onSuccess: (res) => {
      setIsDialogOpen(false);

      toast(res.name, {
        description: res.message,
      });

      queryClient.invalidateQueries({
        queryKey: ["wallet"],
      });
    },
  });

  return (
    <>
      <span
        onClick={() => setIsDialogOpen(true)}
        className="p-1 bg-primary hover:bg-primary/80 transition-all duration-200 ease-in-out text-background rounded-sm cursor-pointer"
      >
        <Plus className="size-4" />
      </span>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg w-full max-h-[650px]">
          <DialogHeader>
            <DialogTitle>Manual Payment Gateway</DialogTitle>
          </DialogHeader>
          {/* Scrollable Content */}
          <ScrollArea className="max-h-[500px] overflow-y-auto px-5 py-3">
            {/* Note Section */}
            <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 mb-4">
              <p>
                <strong>Note:</strong>
              </p>
              <ul className="list-disc pl-5">
                <li>Scan the Paytm QR Code below to make the payment.</li>
                <li>
                  Enter the Transaction ID and Amount after completing the
                  payment.
                </li>
                <li>
                  Ensure the details are accurate to avoid delays in processing.
                </li>
              </ul>
            </div>
            {/* Form Section */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) =>
                  mutationOnSubmit.mutateAsync(v)
                )}
                className="space-y-4"
                ref={formRef}
              >
                {/* Transaction ID Field */}
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Transaction ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Amount Field */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter Amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Paytm QR Code Image */}
                <div className="flex justify-center mt-4">
                  <Image
                    className="rounded-xl"
                    src="/paytm-qr.png"
                    alt="Paytm QR Code"
                    width={320}
                    height={320}
                  />
                </div>
              </form>
            </Form>
          </ScrollArea>
          {/* Submit Button */}
          <DialogFooter className="mt-4 w-full">
            <Button
              className="w-full"
              disabled={mutationOnSubmit.isPending}
              onClick={() => {
                if (formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              type="submit"
            >
              {!mutationOnSubmit.isPending ? (
                "Submit Payment"
              ) : (
                <Loader2Icon className="animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Wallet;
