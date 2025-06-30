import React, { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./_components/admin-sidebar";
import AdminHeader from "./_components/admin-header";
import { RouteGuard } from "@/components/auth/route-guard";
import { ErrorBoundary } from "@/components/admin/error-boundary";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAdmin={true}>
      <ErrorBoundary>
        <main className="min-h-screen bg-background">
          <SidebarProvider
            style={
              {
                "--sidebar-width": "15rem",
                "--sidebar-width-mobile": "18rem",
              } as React.CSSProperties
            }
          >
            <AdminSidebar />
            <div className="w-full">
              <AdminHeader />
              <div className="w-full min-h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 bg-muted/30">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </div>
          </SidebarProvider>
        </main>
      </ErrorBoundary>
    </RouteGuard>
  );
};

export default Layout;
