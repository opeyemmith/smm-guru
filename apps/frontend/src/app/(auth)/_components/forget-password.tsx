"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/better-auth/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { password } from "@smm-guru/utils";

const formSchema = z.object({
  password,
});

const ForgetPassword = () => {
  const route = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        throw new Error(
          "Reset password token is missing. Please use the link from your email."
        );
      }
      const { data, error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        throw new Error(error?.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Password Reset Successful", {
        description:
          "Your password has been successfully reset. You can now log in with your new password.",
      });

      route.push("/sign-in");
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below to reset your account.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutateAsync(values))}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input placeholder="34#BY$w37u7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isPending} className="w-full" type="submit">
            {!isPending ? "Change" : <Loader2 className="animate-spin" />}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ForgetPassword;