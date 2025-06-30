"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "../../_components/admin-page-header";
import { AdvancedDataTable } from "@/components/admin/data-table/advanced-data-table";
import { createOrderColumns, Order } from "@/components/admin/orders/order-columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Download, 
  RefreshCw, 
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

// Mock data for enhanced order management
const generateMockOrders = (): Order[] => {
  const statuses = ["pending", "processing", "completed", "failed", "cancelled"] as const;
  const priorities = ["low", "medium", "high", "urgent"] as const;
  const services = [
    "Instagram Followers", "Facebook Likes", "YouTube Views", "Twitter Followers",
    "TikTok Likes", "LinkedIn Connections", "Spotify Plays", "SoundCloud Plays",
    "Instagram Likes", "Facebook Shares", "YouTube Subscribers", "Twitter Retweets"
  ];
  const categories = ["Social Media", "Music", "Video", "Engagement"];
  const users = [
    { name: "John Doe", email: "john.doe@example.com" },
    { name: "Jane Smith", email: "jane.smith@example.com" },
    { name: "Mike Johnson", email: "mike.johnson@example.com" },
    { name: "Sarah Wilson", email: "sarah.wilson@example.com" },
    { name: "David Brown", email: "david.brown@example.com" },
  ];
  
  return Array.from({ length: 100 }, (_, i) => {
    const user = users[i % users.length];
    const service = services[Math.floor(Math.random() * services.length)];
    const quantity = Math.floor(Math.random() * 10000) + 100;
    const price = Math.random() * 0.01 + 0.001; // Price per unit
    const totalAmount = quantity * price;
    
    return {
      id: `order-${i + 1}`,
      userId: `user-${(i % users.length) + 1}`,
      userName: user.name,
      userEmail: user.email,
      service,
      serviceCategory: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      quantity,
      price,
      totalAmount,
      link: `https://example.com/post/${i + 1}`,
      startCount: Math.floor(Math.random() * 1000),
      remains: Math.floor(Math.random() * quantity),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      completedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      notes: Math.random() > 0.7 ? "Special instructions for this order" : undefined,
    };
  });
};

const EnhancedOrdersPage = () => {
  const queryClient = useQueryClient();

  // Enhanced query with mock data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders-enhanced"],
    queryFn: async (): Promise<Order[]> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockOrders();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Calculate order statistics
  const orderStats = React.useMemo(() => {
    if (!data) return null;
    
    const total = data.length;
    const pending = data.filter(o => o.status === "pending").length;
    const processing = data.filter(o => o.status === "processing").length;
    const completed = data.filter(o => o.status === "completed").length;
    const failed = data.filter(o => o.status === "failed" || o.status === "cancelled").length;
    const totalRevenue = data.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return { total, pending, processing, completed, failed, totalRevenue };
  }, [data]);

  // Mock mutations
  const updateOrderMutation = useMutation({
    mutationFn: async ({ order, status }: { order: Order; status: Order['status'] }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...order, status };
    },
    onSuccess: (updatedOrder) => {
      toast.success(`Order ${updatedOrder.id} status updated to ${updatedOrder.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return order.id;
    },
    onSuccess: (_, order) => {
      toast.success(`Order ${order.id} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to delete order");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (orders: Order[]) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return orders.map(o => o.id);
    },
    onSuccess: (_, orders) => {
      toast.success(`${orders.length} orders deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to delete orders");
    },
  });

  // Action handlers
  const handleView = (order: Order) => {
    toast.info(`Viewing order details for ${order.id}`);
    // TODO: Open order details modal
  };

  const handleEdit = (order: Order) => {
    toast.info(`Editing order ${order.id}`);
    // TODO: Open edit order dialog
  };

  const handleDelete = (order: Order) => {
    if (confirm(`Are you sure you want to delete order ${order.id}?`)) {
      deleteOrderMutation.mutate(order);
    }
  };

  const handleUpdateStatus = (order: Order, status: Order['status']) => {
    updateOrderMutation.mutate({ order, status });
  };

  const handleViewUser = (order: Order) => {
    toast.info(`Viewing customer details for ${order.userName}`);
    // TODO: Navigate to user details or open user modal
  };

  const handleBulkDelete = (orders: Order[]) => {
    if (confirm(`Are you sure you want to delete ${orders.length} orders?`)) {
      bulkDeleteMutation.mutate(orders);
    }
  };

  const handleBulkEdit = (orders: Order[]) => {
    toast.info(`Opening bulk edit dialog for ${orders.length} orders`);
    // TODO: Open bulk edit dialog
  };

  const handleExport = () => {
    toast.success("Exporting order data to CSV...");
    // TODO: Implement CSV export
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Order data refreshed");
  };

  const columns = createOrderColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onUpdateStatus: handleUpdateStatus,
    onViewUser: handleViewUser,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Enhanced Order Management"
          description="Advanced order management with real-time tracking and analytics."
        />
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load orders</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enhanced Order Management"
        description="Advanced order management with real-time tracking, analytics, and bulk operations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div>
        }
      />

      {/* Order Statistics */}
      {orderStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{orderStats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${orderStats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <AdvancedDataTable
        columns={columns}
        data={data || []}
        searchKey="id"
        searchPlaceholder="Search orders by ID, customer, or service..."
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enableGlobalFilter={true}
        pageSize={25}
      />
    </div>
  );
};

export default EnhancedOrdersPage;
