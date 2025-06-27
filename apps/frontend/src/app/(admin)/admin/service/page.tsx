import { Plus, BarChart2, Grid3X3, Settings, Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "../../_components/admin-page-header";
import ServiceList from "./_components/services-list";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ServiceManagementPage = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Service Management"
        description="Manage and organize services that will be displayed to customers."
        breadcrumbs={[
          { title: "Services", href: "/admin/service" }
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/service/add">
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Link>
          </Button>
        }
      />
      
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="h-10">
            <TabsTrigger value="list" className="flex items-center gap-2 px-4">
              <Grid3X3 className="h-4 w-4" />
              <span>Service List</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 px-4">
              <BarChart2 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 px-4">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="space-y-0 mt-0">
          <ServiceList />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Services</CardTitle>
                <CardDescription>All services in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">235</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-800/20 dark:text-green-400">+12% from last month</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Services</CardTitle>
                <CardDescription>Services currently available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">198</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-800/20 dark:text-green-400">84% of total</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Popular Services</CardTitle>
                <CardDescription>Most ordered services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">54</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-800/20 dark:text-blue-400">23% of total</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Monthly orders by service type</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center">
                <BarChart2 className="h-16 w-16 opacity-20 mb-2" />
                <p className="text-sm">Chart visualization would go here</p>
                <p className="text-xs text-muted-foreground mt-1">No data available for the selected period</p>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 flex justify-between">
              <Button variant="outline" size="sm">Export Data</Button>
              <Button variant="ghost" size="sm">View Full Report</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-0">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
              <CardDescription>Configure global service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Profit Margin (%)</label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="10" className="w-full" />
                    <Button variant="secondary">Apply</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This value will be used as the default profit margin for new services
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Currency</label>
                  <div className="flex gap-2">
                    <Input type="text" placeholder="USD" className="w-full" />
                    <Button variant="secondary">Apply</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default currency for service pricing and customer orders
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t mt-6">
                <h3 className="text-sm font-medium mb-3">API Integration Settings</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Refresh Interval (minutes)</label>
                    <Input type="number" placeholder="30" className="w-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sync Provider Services</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="w-full">Sync Now</Button>
                      <Button variant="outline" size="sm" className="w-full">Schedule Sync</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button>Save All Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceManagementPage;
