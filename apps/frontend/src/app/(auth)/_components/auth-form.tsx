"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import {
  signInFormSchema,
  signUpFormSchema,
  TSignInForm,
  TSignUpForm,
} from "@smm-guru/utils";
import { GitHubIcon } from "@/components/icon/github";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/better-auth/auth-client";
import { toast } from "sonner";
import { P } from "@/components/global/p";

const AuthForm = ({ action }: { action: "in" | "up" }) => {
  const [showPassword, setShowPassword] = useState(false);

  const signUpForm = useForm<TSignUpForm>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const signInForm = useForm<TSignInForm>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutationForgetPassword = useMutation({
    mutationFn: async () => {
      const email = signInForm.watch("email");

      if (!email) {
        throw new Error("Email address is required for password reset");
      }

      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Password Reset Email Sent", {
        description: "Check your email for password reset instructions.",
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
  });

  const { mutateAsync: onSignUpSubmit, isPending: isSigning } = useMutation({
    mutationFn: async (values: TSignUpForm) => {
      const { error, data } = await authClient.signUp.email({
        ...values,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onError: (e) => {
      toast.error(e.name || "Error!", {
        description: e.message,
      });
    },
    onSuccess: () => {
      toast.success("Sign up completed", {
        description: "Redirecting you to the dashboard...",
      });
    },
  });

  const { mutateAsync: onSignInSubmit, isPending: isLogging } = useMutation({
    mutationFn: async (values: TSignInForm) => {
      const { error, data } = await authClient.signIn.email({
        ...values,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onError: (e) => {
      toast.error(e.name || "Error!", {
        description: e.message,
      });
    },
    onSuccess: () => {
      toast.success("Sign in completed", {
        description: "Redirecting you to the dashboard...",
      });
    },
  });

  function GitHubButton() {
    const { mutateAsync, isPending } = useMutation({
      mutationFn: async () => {
        await authClient.signIn.social({
          provider: "github",
          callbackURL: "/dashboard",
        });

        return "Success";
      },
      onError: (e) => {
        toast.error(e.name || "Error!", {
          description: e.message,
        });
      },
      onSuccess: () => {
        toast.success("GitHub Sign In Initiated", {
          description: "Redirecting you to GitHub authentication...",
        });
      },
    });
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full border-border"
        onClick={() => mutateAsync()}
        disabled={isPending}
      >
        {!isPending ? (
          <GitHubIcon className="mr-2 h-4 w-4" />
        ) : (
          <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    );
  }

  return (
    <div className="w-full md:w-2/3 p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {action === "in" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {action === "in"
              ? "Sign in to continue to our platform"
              : "Sign up to get started with our platform"}
          </p>
        </div>

        {action === "up" ? (
          // Sign Up Form
          <Form {...signUpForm}>
            <form
              onSubmit={signUpForm.handleSubmit((values) =>
                onSignUpSubmit(values)
              )}
              className="space-y-6"
            >
              <FormField
                control={signUpForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground"
                  disabled={isSigning}
                >
                  {!isSigning ? (
                    "Sign up with Email"
                  ) : (
                    <Loader2Icon className="animate-spin" />
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GitHubButton />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                By clicking &quot;Sign up&quot; or &quot;Continue with
                GitHub&quot;, you agree to our{" "}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </div>
            </form>
          </Form>
        ) : (
          // Sign In Form
          <Form {...signInForm}>
            <form
              onSubmit={signInForm.handleSubmit((values) =>
                onSignInSubmit(values)
              )}
              className="space-y-6"
            >
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                {!mutationForgetPassword.isPending ? (
                  <P
                    className="cursor-pointer hover:underline ease-in-out duration-200"
                    onClick={() => mutationForgetPassword.mutateAsync()}
                  >
                    Forget Password
                  </P>
                ) : (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground"
                  disabled={isLogging}
                >
                  {!isLogging ? (
                    "Sign in"
                  ) : (
                    <Loader2Icon className="animate-spin" />
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GitHubButton />
              </div>
            </form>
          </Form>
        )}

        <div className="text-center text-sm">
          {action === "in" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
