"use client";

import * as React from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { 
  Calculator, 
  CheckCircle2, 
  CircleDollarSign, 
  CreditCard, 
  HelpCircle, 
  Layers, 
  Loader2Icon, 
  Pencil, 
  Shield, 
  Tag, 
  Trash 
} from "lucide-react";

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Enhanced service form schema with additional fields
const enhancedServiceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  profit: z.number().min(0, "Profit must be a positive number"),
  category: z.string().min(1, "Category is required"),
  min: z.number().int().positive("Minimum order must be a positive number"),
  max: z.number().int().positive("Maximum order must be a positive number"),
  dripfeed: z.boolean().default(false),
  refill: z.boolean().default(false),
  cancel: z.boolean().default(false),
});

type TEnhancedServiceFormValues = z.infer<typeof enhancedServiceFormSchema>;

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

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

export const servicesColumns: ColumnDef<TServices>[] = [
  {
    accessorKey: "service",
    header: "Service ID",
    cell: ({ row }) => (
      <div className="font-medium text-sm">{row.getValue("service")}</div>
    ),
    size: 100,
    filterFn: multiColumnFilterFn,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="text-sm whitespace-pre-wrap break-words max-w-[250px]">
        {row.getValue("name")}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) => {
      return (
        <div className="font-medium text-sm">
          {formatCurrency(Number(row.getValue("rate")))}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "profit",
    header: "Selling Price",
    cell: ({ row }) => {
      const sellingPrice = Number(row.original.rate) + Number(row.original.profit || 0);
      return (
        <div className="font-medium text-sm">
          {formatCurrency(sellingPrice)}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "min",
    header: "Min Order",
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("min")}</div>;
    },
    size: 100,
  },
  {
    accessorKey: "max",
    header: "Max Order",
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("max")}</div>;
    },
    size: 100,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="font-normal">
          {row.getValue("category")}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "refill",
    header: "Refill",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.getValue("refill") ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/20 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Yes
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">No</Badge>
          )}
        </div>
      );
    },
    size: 80,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableHiding: false,
    cell: ({ row }) => {
      const original = row.original;
      return (
        <div className="flex justify-end space-x-2">
          <ActionOnService original={original} />
        </div>
      );
    },
    size: 80,
  },
];

const ActionOnService = ({ original }: { original: TServices }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCategory();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("details");
  const [sellingPrice, setSellingPrice] = React.useState<number>(
    original.rate + (original.profit || 0)
  );

  const form = useForm<TEnhancedServiceFormValues>({
    resolver: zodResolver(enhancedServiceFormSchema),
    defaultValues: {
      name: original.name || "",
      profit: original.profit || 0,
      category: original.category || "",
      min: original.min || 1,
      max: original.max || 1000,
      dripfeed: original.dripfeed || false,
      refill: original.refill || false,
      cancel: original.cancel || false,
    },
  });

  // Watch profit field to calculate selling price in real-time
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "profit") {
        setSellingPrice(original.rate + (value.profit as number || 0));
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, original.rate]);

  const { isPending: isPendingUpdate, mutateAsync: mutateAsyncUpdate } =
    useMutation({
      mutationFn: async (values: TEnhancedServiceFormValues) => {
        // For backward compatibility, convert to the expected format by the API
        const apiValues: TServiceFormValues = {
          name: values.name,
          profit: values.profit,
          category: values.category,
        };

        const res = await axiosV1AdminInstance.patch<ApiResponse<null>>(
          `/services/${original.id}`,
          apiValues
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

  const onSubmit = (values: TEnhancedServiceFormValues) => {
    mutateAsyncUpdate(values);
  };

  return (
    <div className="w-full flex items-center justify-end pr-3 gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Tag className="h-5 w-5" />
              Edit Service
            </DialogTitle>
            <DialogDescription>
              Make changes to your service offering. Update pricing, limits, and features.
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 flex flex-col flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-1.5">
                  <CircleDollarSign className="h-4 w-4" />
                  <span>Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Features</span>
                </TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
                  <div className="overflow-y-auto pr-2 pb-2" style={{ maxHeight: "calc(85vh - 200px)" }}>
                    <div className="space-y-6 mt-4">
                      <TabsContent value="details" className="space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Basic Information</CardTitle>
                            <CardDescription>Essential service details</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Instagram Followers" {...field} />
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
                                      <Loader2Icon className="ml-2 animate-spin size-4 opacity-80" />
                                    )}
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                  >
                                    <FormControl className="w-full">
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
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
                            
                            <div className="pt-2">
                              <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Service ID:</span>
                                </div>
                                <Badge variant="outline" className="font-mono">{original.service}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="pricing" className="space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Pricing Information</CardTitle>
                            <CardDescription>Set your profit margin and view pricing details</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Provider Rate</p>
                                <p className="text-lg font-semibold">{formatCurrency(original.rate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Final Selling Price</p>
                                <p className="text-lg font-semibold text-primary">{formatCurrency(sellingPrice)}</p>
                              </div>
                            </div>

                            <FormField
                              control={form.control}
                              name="profit"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between">
                                    <FormLabel>Profit Margin</FormLabel>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="w-[200px] text-xs">
                                            Additional profit per 1000 units on top of the provider rate
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-7"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="min"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimum Order</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Smallest quantity a customer can order
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="max"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Maximum Order</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Largest quantity a customer can order
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="features" className="space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Service Features</CardTitle>
                            <CardDescription>Configure additional service options</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="dripfeed"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Drip Feed</FormLabel>
                                      <FormDescription>
                                        Gradually deliver over time instead of all at once
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="refill"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Refill Support</FormLabel>
                                      <FormDescription>
                                        Allow customers to request refills if count drops
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="cancel"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Cancellation</FormLabel>
                                      <FormDescription>
                                        Allow customers to cancel pending orders
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </div>
                  
                  <div className="sticky bottom-0 pt-4 mt-auto border-t bg-background">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isPendingUpdate}
                        className="gap-1"
                      >
                        {isPendingUpdate && <Loader2Icon className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="destructive"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={isPendingDelete}
        onClick={() => mutateAsyncDelete()}
      >
        {!isPendingDelete ? (
          <Trash className="h-3.5 w-3.5" />
        ) : (
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
        )}
      </Button>
    </div>
  );
};

export default ActionOnService;
