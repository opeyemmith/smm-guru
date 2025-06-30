"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServicePerformanceChartProps {
  data: Array<{
    serviceId: string;
    serviceName: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  isLoading?: boolean;
}

const ServicePerformanceChart: React.FC<ServicePerformanceChartProps> = ({ 
  data, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Top Services</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  // Color palette for bars
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  // Format data for chart
  const chartData = data.map((item, index) => ({
    ...item,
    shortName: item.serviceName.length > 20 
      ? `${item.serviceName.substring(0, 20)}...` 
      : item.serviceName,
    color: colors[index % colors.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium text-sm mb-2">{data.serviceName}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Orders: <span className="font-medium text-foreground">{data.orderCount}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Revenue: <span className="font-medium text-foreground">${data.totalRevenue.toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Service ID: <span className="font-medium text-foreground">{data.serviceId}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="text-base font-medium">Top Performing Services</CardTitle>
        <p className="text-sm text-muted-foreground">
          Services ranked by order volume (last 30 days)
        </p>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="shortName" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
              label={{ value: 'Orders', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="orderCount" 
              radius={[4, 4, 0, 0]}
              className="drop-shadow-sm"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ServicePerformanceChart;
