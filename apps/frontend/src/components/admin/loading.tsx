"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  variant?: "page" | "card" | "inline" | "dashboard";
  message?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  variant = "page", 
  message = "Loading...",
  className = ""
}) => {
  switch (variant) {
    case "dashboard":
      return (
        <div className={`space-y-6 ${className}`}>
          {/* KPI Cards Loading */}
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

          {/* Charts Loading */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-[400px]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-[400px]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities Loading */}
          <Card className="h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
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
        </div>
      );

    case "card":
      return (
        <Card className={className}>
          <CardContent className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </CardContent>
        </Card>
      );

    case "inline":
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      );

    case "page":
    default:
      return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we load your data
              </p>
            </div>
          </div>
        </div>
      );
  }
};

export default Loading;
