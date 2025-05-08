"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LoaderCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpFormSchema, TSignUpForm } from "@smm-guru/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/better-auth/auth-client";
import { toast } from "sonner";

const AdminAddUserButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add New User
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account by filling in the required information
              below.
            </DialogDescription>
          </DialogHeader>
          <AdminAddUserForm setIsDialogOpen={setIsDialogOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdminAddUserForm = ({
  setIsDialogOpen,
}: {
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const signUpForm = useForm<TSignUpForm>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const mutationCreateUser = useMutation({
    mutationFn: async (values: TSignUpForm) => {
      const newUser = await authClient.admin.createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: "user",
      });

      if (newUser.error) {
        throw new Error(newUser.error.message);
      }

      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user"] });

      toast.success("User Created", {
        description: "The new user has been successfully added to the system.",
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
    onSettled: () => {
      setIsDialogOpen(false);
    },
  });

  return (
    <Form {...signUpForm}>
      <form
        onSubmit={signUpForm.handleSubmit((values) =>
          mutationCreateUser.mutateAsync(values)
        )}
        className="space-y-3"
      >
        <FormField
          control={signUpForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Erick Bosire" {...field} />
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
                <Input placeholder="e.g. erick-bosire@google.com" {...field} />
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
                    placeholder="e.g. #@%$6b4uE%^7586"
                    {...field}
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          disabled={mutationCreateUser.isPending}
          type="submit"
          className="w-full"
        >
          {mutationCreateUser.isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AdminAddUserButton;