import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import Header from "./_components/header";
import { SessionDebug } from "@/components/dev/session-debug";
import { RouteGuard } from "@/components/auth/route-guard";
import { SecurityTester } from "@/components/dev/security-tester";

// export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth={true}>
      <main>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "12.5rem",
              "--sidebar-width-mobile": "17rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <div className="w-full">
            <Header />
            <div className="w-full min-h-[calc(100vh-80px)] rounded-lg p-5 space-y-8">
              {children}
            </div>
          </div>
        </SidebarProvider>
        <SessionDebug />
      </main>
    </RouteGuard>
  );
}
