"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Settings } from "lucide-react";
import AdminPageHeader from "../_components/admin-page-header";
import KPICards from "@/components/admin/dashboard/kpi-cards";
import RevenueChart from "@/components/admin/charts/revenue-chart";
import ServicePerformanceChart from "@/components/admin/charts/service-performance-chart";
import RecentActivities from "@/components/admin/dashboard/recent-activities";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { toast } from "sonner";

const AdminDashboard = () => {
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useDashboardMetrics();

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Dashboard data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh dashboard data");
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    toast.info("Export functionality coming soon");
  };

  if (error) {
    toast.error("Failed to load dashboard metrics");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Real-time overview of your SMM panel performance and analytics."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <KPICards data={metrics?.overview} isLoading={isLoading} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart
          data={metrics?.charts.dailyMetrics || []}
          isLoading={isLoading}
        />
        <ServicePerformanceChart
          data={metrics?.charts.topServices || []}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activities */}
      <RecentActivities
        data={metrics?.recentActivities}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminDashboard;
