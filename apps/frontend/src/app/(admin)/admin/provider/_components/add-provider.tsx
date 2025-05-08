"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  addProviderFormSchema,
  TAddProviderForm,
} from "@smm-guru/utils";
import ListProviders from "./list-providers";
import { ApiResponse } from "@/@types/response.type";
import { toast } from "sonner";
import { AxiosResponse } from "axios";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";

export default function AddProvider() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-4 w-full">
      <div className="w-full h-fit flex items-center justify-end">
        <Button className="mb-4" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Key
        </Button>
      </div>

      <AddProviderForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        isEditing={false}
      />

      <ListProviders />
    </div>
  );
}

export function AddProviderForm({
  isDialogOpen,
  setIsDialogOpen,
  isEditing,
  id,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  id?: number;
}) {
  const queryClient = useQueryClient();

  const { data, error, isError, isLoading } = useQuery({
    queryFn: async () => {
      const res = await axiosV1AdminInstance.get<
        ApiResponse<{
          id: number;
          apiKey: string;
          name: string;
          apiUrl: string;
        }>
      >(`/providers/key/${id}`);

      return res.data.result;
    },
    queryKey: ["provider", id],
    enabled: isEditing,
  });

  const form = useForm({
    resolver: zodResolver(addProviderFormSchema),
    defaultValues: {
      name: data?.name || "",
      apiKey: data?.apiKey || "",
      apiUrl: data?.apiUrl || "",
    },
  });

  useEffect(() => {
    form.setValue("apiKey", data?.apiKey || "");
    form.setValue("name", data?.name || "");
    form.setValue("apiUrl", data?.apiUrl || "");
  }, [data]);

  const addProviderMutation = useMutation({
    mutationFn: async (values: TAddProviderForm) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let res: AxiosResponse<ApiResponse<null>, any>;

      if (!isEditing) {
        res = await axiosV1AdminInstance.post<ApiResponse<null>>(
          "/providers",
          values
        );
      } else {
        res = await axiosV1AdminInstance.patch<ApiResponse<null>>(
          `/providers/${id}`,
          values
        );
      }

      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });

      toast(res.name, {
        description: res.message,
      });

      setIsDialogOpen(false);
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  displayError(isError, error);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{!isEditing ? "Add New Key" : "Edit Key"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              addProviderMutation.mutateAsync(values)
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex w-fit h-fit items-center justify-start">
                    Name{" "}
                    {isEditing && isLoading && (
                      <Loader2Icon className="animate-spin size-3 opacity-80" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex w-fit h-fit items-center justify-start">
                    Api Url{" "}
                    {isEditing && isLoading && (
                      <Loader2Icon className="animate-spin size-3 opacity-80" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex w-fit h-fit items-center justify-start">
                    Api Key{" "}
                    {isEditing && isLoading && (
                      <Loader2Icon className="animate-spin size-3 opacity-80" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={addProviderMutation.isPending}
            >
              {addProviderMutation.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : !isEditing ? (
                "Add"
              ) : (
                "Edit"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
