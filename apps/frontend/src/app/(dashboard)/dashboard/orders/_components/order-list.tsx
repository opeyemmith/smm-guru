"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllOrder } from "@/lib/fetch/order.fetch";
import PageLoader from "@/components/global/page-loader";
import { displayError } from "@/lib/error/toast.error";
import { useCurrency } from "@/context/zustand/store";

export interface IOrders {
  link: string;
  status: string;
  serviceName: string; // may be large
  id: number;
  refill: boolean;
  price: number;
}

export const OrderList = ({
  orders,
  currency,
}: {
  orders: IOrders[];
  currency: string;
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);

    const matchesFilter =
      filterStatus === "All" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            My Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your orders
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between bg-card p-4 rounded-lg shadow-sm border">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search by ID, link or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 h-10 bg-background/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 border-dashed">
              <Filter className="mr-2 h-4 w-4 text-primary" />
              Status: {filterStatus}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {[
              "All",
              "Pending",
              "In progress",
              "Completed",
              "Partial",
              "Processing",
              "Canceled",
            ].map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setFilterStatus(status)}
                className={
                  filterStatus === status ? "bg-primary/10 text-primary" : ""
                }
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="p-5 pb-3 space-y-0 bg-muted/30">
              <Badge variant={order.refill ? "default" : "outline"}>
                {order.refill ? "Refill Available" : "No Refill"}
              </Badge>
              <CardTitle
                className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors"
                title={order.serviceName}
              >
                {order.serviceName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">ID: {order.id}</p>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <div className="grid grid-cols-1 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-semibold text-primary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency,
                    }).format(order.price)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Link</p>
                  {/* Full Link Display */}
                  <a
                    href={order.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold break-all underline"
                  >
                    {order.link}
                  </a>
                </div>
              </div>

              {/* Refill Button */}
              {order.refill && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 flex items-center gap-x-2"
                >
                  <RefreshCw className="h-[16px] w-[16px]" />
                  Refill
                </Button>
              )}

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={`mt-4 ${getStatusColor(order.status)}`}
              >
                Status: {order.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <Search className="h-[40px] w-[40px] text-muted mx-auto mb-[16px]" />
            No orders found.
          </div>
        )}
      </div>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case "Pending":
        return "bg-yellow-100";
      case "In progress":
        return "bg-blue-100";
      case "Completed":
        return "bg-green-100";
      case "Canceled":
        return "bg-red-100";
      default:
        return "";
    }
  }
};

export const OrderWrapper = () => {
  const { currency } = useCurrency();

  const { data, isLoading, error, isError, isPending } = useQuery({
    queryKey: ["orders", currency],
    queryFn: () => getAllOrder(currency as string),
    enabled: !!currency,
  });

  displayError(isError, error);

  if (isLoading || isPending) return <PageLoader />;

  return <OrderList orders={data?.orders || []} currency={currency || "USD"} />;
};
