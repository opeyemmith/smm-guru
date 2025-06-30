"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  isLoading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const currentRevenue = data[data.length - 1]?.revenue || 0;
  const previousRevenue = data[data.length - 2]?.revenue || 0;
  const trend = currentRevenue > previousRevenue;
  const trendPercentage = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), "MMM dd"),
    formattedRevenue: `$${item.revenue.toFixed(2)}`,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: <span className="font-medium text-foreground">${payload[0].value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Orders: <span className="font-medium text-foreground">{payload[0].payload.orders}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Revenue Trends</CardTitle>
        <div className="flex items-center space-x-1 text-sm">
          {trend ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={trend ? "text-green-500" : "text-red-500"}>
            {Math.abs(trendPercentage).toFixed(1)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
