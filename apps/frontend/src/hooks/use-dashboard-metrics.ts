"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    totalOrders: number;
    totalServices: number;
    totalProviders: number;
    activeOrders: number;
    totalRevenue: number;
    userGrowth: number;
    orderGrowth: number;
  };
  charts: {
    dailyMetrics: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      orderCount: number;
      totalRevenue: number;
    }>;
  };
  recentActivities: Array<{
    id: string;
    service: string;
    status: string;
    charge: string;
    createdAt: Date;
    userId: string;
  }>;
}

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await axiosV1AdminInstance.get<ApiResponse<DashboardMetrics>>(
        "/dashboard-metrics"
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch dashboard metrics");
      }

      // Transform the data to ensure dates are properly parsed
      const data = response.data.result;
      return {
        ...data,
        recentActivities: data.recentActivities.map(activity => ({
          ...activity,
          createdAt: new Date(activity.createdAt),
        })),
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
