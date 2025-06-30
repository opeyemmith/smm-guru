"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  DollarSign,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  service: string;
  status: string;
  charge: string;
  createdAt: Date;
  userId: string;
}

interface RecentActivitiesProps {
  data?: Activity[];
  isLoading?: boolean;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ data, isLoading }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100 text-green-800",
          label: "Completed",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100 text-yellow-800",
          label: "Pending",
        };
      case "processing":
      case "in_progress":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bgColor: "bg-blue-100 text-blue-800",
          label: "Processing",
        };
      case "failed":
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100 text-red-800",
          label: "Failed",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100 text-gray-800",
          label: status,
        };
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activities found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Activities</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest order activities and updates
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-4">
            {data.map((activity, index) => {
              const statusConfig = getStatusConfig(activity.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={activity.id} 
                  className={cn(
                    "flex items-start space-x-4 p-3 rounded-lg transition-colors",
                    "hover:bg-muted/50 border border-transparent hover:border-border"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    "bg-muted"
                  )}>
                    <StatusIcon 
                      className={cn(
                        "h-5 w-5", 
                        statusConfig.color,
                        activity.status === "processing" && "animate-spin"
                      )} 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.service}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            <span>User {activity.userId.slice(-6)}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>{formatCurrency(activity.charge)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs px-2 py-1 h-auto ml-2 flex-shrink-0",
                          statusConfig.bgColor,
                          "border-transparent"
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
