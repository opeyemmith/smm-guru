"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useServices from "@/hooks/use-services";
import {
  CreditCard,
  Loader2Icon,
  Link as LinkIcon,
  Package,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { orderFormSchema, TOrderForm } from "@smm-guru/utils";
import { TService } from "@/components/global/services-card";
import { generateApiKey } from "@smm-guru/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PageLoader from "@/components/global/page-loader";
import { axiosV1DashboardInstance } from "@/lib/axios/config";
import { toast } from "sonner";
import { ApiResponse } from "@/@types/response.type";
import { displayError } from "@/lib/error/toast.error";

const CreateOrder = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isPending } = useServices({ currency: undefined });
  const [services, setServices] = useState<TService[]>([]);
  const [selectedService, setSelectedService] = useState<TService | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const categories = data?.services || [];
  const currency = data?.currency || "USD";

  const form = useForm<TOrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      category: "",
      service: "",
      link: "",
      quantity: 1,
    },
  });

  const mutationOrder = useMutation({
    mutationFn: async (values: TOrderForm) => {
      const res = await axiosV1DashboardInstance.post<ApiResponse<null>>(
        "/orders",
        values
      );
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast(res.name, {
        description: res.message,
      });

      form.reset();
      setSelectedService(null);
      setTotalPrice(0);
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  useEffect(() => {
    if (categories && categories.length > 0) {
      const selectedCategory = categories.find(
        (category) => category.name === form.watch("category")
      );

      setServices(selectedCategory?.services || []);
    }

    if (services && services.length > 0) {
      const service = services.find(
        (service) => service.id === Number(form.watch("service"))
      );

      if (service) {
        setSelectedService(service);
        form.setValue("quantity", service.min);
      }
    }
  }, [form.watch("category"), form.watch("service")]);

  useEffect(() => {
    if (selectedService && form.watch("quantity")) {
      const quantity = form.watch("quantity");
      const price = selectedService.price / 1000;
      setTotalPrice(quantity * price);
    } else {
      setTotalPrice(0);
    }
  }, [form.watch("quantity"), selectedService]);

  if (isLoading || isPending) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center">
            Create New Order
          </CardTitle>
          <CardDescription className="text-center">
            Boost your social media presence with our premium services
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                mutationOrder.mutate(values)
              )}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={mutationOrder.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories
                            ?.filter((c) => c.name !== "Uncategorized")
                            .map((category) => (
                              <SelectItem
                                key={generateApiKey(5)}
                                value={category.name}
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

                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Service
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          mutationOrder.isPending || !form.getValues("category")
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(services || [])?.map((service) => (
                            <SelectItem
                              key={generateApiKey(5)}
                              value={service.id.toString()}
                            >
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Link
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter URL (e.g., https://instagram.com/username)"
                        {...field}
                        disabled={mutationOrder.isPending}
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Quantity
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={selectedService?.min || 1}
                        max={selectedService?.max || 1000}
                        placeholder="Enter quantity"
                        {...field}
                        disabled={mutationOrder.isPending || !selectedService}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    {selectedService && (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-muted/50">
                            Min: {selectedService.min}
                          </Badge>
                          <Badge variant="outline" className="bg-muted/50">
                            Max: {selectedService.max}
                          </Badge>
                          {selectedService.refill && (
                            <Badge variant="secondary">Refill Available</Badge>
                          )}
                          {selectedService.dripfeed && (
                            <Badge variant="secondary">Drip Feed</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedService && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price per 1000:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency,
                      }).format(selectedService.price)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Quantity:</span>
                    <span className="font-semibold">
                      {form.watch("quantity") || 0}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-bold">Total Price:</span>
                    <span className="font-bold text-lg">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency,
                      }).format(totalPrice)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold transition-all hover:scale-[1.02]"
                disabled={mutationOrder.isPending}
              >
                {mutationOrder.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin mr-2 h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrder;
