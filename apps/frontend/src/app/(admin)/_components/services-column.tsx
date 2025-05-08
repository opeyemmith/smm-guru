"use client";

import * as React from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Loader2Icon, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";
import { toast } from "sonner";
import { TServices } from "@smm-guru/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { serviceFormSchema, TServiceFormValues } from "@smm-guru/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useGetCategory from "@/hooks/use-get-category";

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<TServices> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.id} ${row.original.name} ${row.original.category}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

export const servicesColumns: ColumnDef<TServices>[] = [
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("service")}</div>
    ),
    size: 70,
    filterFn: multiColumnFilterFn,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div
        className="text-left whitespace-pre-wrap break-words"
        style={{ maxWidth: "250px" }}
      >
        {row.getValue("name")}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "rate",
    header: () => <div className="text-right">Rate per 1000</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium capitalize">
          {row.getValue("rate")}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "profit",
    header: () => <div className="text-right">Selling Price per 1000</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium capitalize">
          {row.original.rate + (row.original.profit || 0)}
        </div>
      );
    },
    size: 170,
  },
  {
    accessorKey: "min",
    header: "Min Order",
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("min")}</div>;
    },
    size: 190,
  },
  {
    accessorKey: "max",
    header: "Max Order",
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("max")}</div>;
    },
    size: 190,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">{row.getValue("category")}</div>
      );
    },
    size: 190,
  },
  {
    accessorKey: "refill",
    header: () => <div className="text-right">Refill</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">
          {row.getValue("refill") ? (
            <Badge variant="secondary">Yes</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          )}
        </div>
      );
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-3">Action</div>,
    enableHiding: false,
    cell: ({ row }) => {
      const original = row.original;
      return <ActionOnService original={original} />;
    },
  },
];

const ActionOnService = ({ original }: { original: TServices }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCategory();
  const [open, setOpen] = React.useState(false);

  const form = useForm<TServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: original.name || "",
      profit: original.profit || 0,
      category: original.category || "",
    },
  });

  const { isPending: isPendingUpdate, mutateAsync: mutateAsyncUpdate } =
    useMutation({
      mutationFn: async (values: z.infer<typeof serviceFormSchema>) => {
        const res = await axiosV1AdminInstance.patch<ApiResponse<null>>(
          `/services/${original.id}`,
          values
        );
        return res.data;
      },
      onError: (e) => {
        toast(e?.name || "Error", {
          description: e?.message || "Failed to update service.",
        });
      },
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast(res.name, {
          description: res.message,
        });
        setOpen(false);
      },
    });

  const { isPending: isPendingDelete, mutateAsync: mutateAsyncDelete } =
    useMutation({
      mutationFn: async () => {
        const res = await axiosV1AdminInstance.delete<ApiResponse<null>>(
          `/services/${original.id}`
        );
        return res.data;
      },
      onError: (e) => {
        toast(e?.name || "Error", {
          description: e?.message || "Failed to delete service.",
        });
      },
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["services"] });
        toast(res.name, {
          description: res.message,
        });
      },
    });

  const onSubmit = (values: TServiceFormValues) => {
    mutateAsyncUpdate(values);
  };

  return (
    <div className="w-full flex items-center justify-end pr-3 gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Pencil />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="w-full h-fit flex items-center justify-start">
                      <span>Category</span>
                      {isLoading && (
                        <Loader2Icon className="animate-spin size-4 opacity-80" />
                      )}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a verified email to display" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data &&
                          data.result.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={JSON.stringify({
                                name: category.name,
                                id: category.id,
                              })}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                className="w-full"
                type="submit"
                disabled={isPendingUpdate}
              >
                {isPendingUpdate ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Button
        variant="destructive"
        size="icon"
        disabled={isPendingDelete}
        onClick={() => mutateAsyncDelete()}
      >
        {!isPendingDelete ? (
          <Trash />
        ) : (
          <Loader2Icon className="animate-spin" />
        )}
      </Button>
    </div>
  );
};

export default ActionOnService;
