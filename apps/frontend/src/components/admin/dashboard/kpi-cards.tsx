"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  ShoppingBag, 
  Package2, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Activity,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  totalUsers: number;
  totalOrders: number;
  totalServices: number;
  totalProviders: number;
  activeOrders: number;
  totalRevenue: number;
  userGrowth: number;
  orderGrowth: number;
}

interface KPICardsProps {
  data?: KPIData;
  isLoading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ data, isLoading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? "text-green-600" : "text-red-600",
      bgColor: isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
    };
  };

  const kpiItems = [
    {
      title: "Total Users",
      value: data?.totalUsers || 0,
      icon: Users,
      growth: data?.userGrowth,
      description: "Registered users",
      color: "text-blue-600",
    },
    {
      title: "Total Orders",
      value: data?.totalOrders || 0,
      icon: ShoppingBag,
      growth: data?.orderGrowth,
      description: "All time orders",
      color: "text-purple-600",
    },
    {
      title: "Active Orders",
      value: data?.activeOrders || 0,
      icon: Activity,
      description: "Currently processing",
      color: "text-orange-600",
    },
    {
      title: "Total Revenue",
      value: data?.totalRevenue || 0,
      icon: CreditCard,
      description: "All time earnings",
      color: "text-green-600",
      isCurrency: true,
    },
    {
      title: "Services",
      value: data?.totalServices || 0,
      icon: Package2,
      description: "Available services",
      color: "text-indigo-600",
    },
    {
      title: "Providers",
      value: data?.totalProviders || 0,
      icon: ExternalLink,
      description: "Connected providers",
      color: "text-teal-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiItems.map((item, index) => {
        const Icon = item.icon;
        const growthData = item.growth !== undefined ? formatGrowth(item.growth) : null;
        const GrowthIcon = growthData?.icon;

        return (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <Icon className={cn("h-4 w-4", item.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {item.isCurrency 
                  ? formatCurrency(item.value) 
                  : formatNumber(item.value)
                }
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
                {growthData && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-1.5 py-0.5 h-auto",
                      growthData.bgColor,
                      "border-transparent"
                    )}
                  >
                    <GrowthIcon className="h-3 w-3 mr-1" />
                    {growthData.value}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICards;
