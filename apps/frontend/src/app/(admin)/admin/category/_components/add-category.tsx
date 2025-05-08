"use client";

import { ApiResponse } from "@/@types/response.type";
import { TCategory } from "@smm-guru/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import { categoryFormSchema, TCategoryForm } from "@smm-guru/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const AddCategory = ({
  original,
  isDialogOpen,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  original?: TCategory;
}) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: original?.name || "",
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: TCategoryForm) => {
      let res;

      if (original) {
        res = await axiosV1AdminInstance.patch<ApiResponse<null>>(
          `/categories/${original.id}`,
          values
        );
      } else {
        res = await axiosV1AdminInstance.post<ApiResponse<null>>(
          `/categories`,
          values
        );
      }

      return res.data;
    },
    onError: (e) => {
      displayError(true, e);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast(res.name, {
        description: res.message,
      });
      setIsDialogOpen(false);
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              editMutation.mutateAsync(values)
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? (
                <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
              ) : null}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategory;
