import React from "react";
import ServicesListFromProvider from "./_components/add-services";
import AdminPageHeader from "../../../_components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, HelpCircle, RefreshCw, Server } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AddServices = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Services"
        description="Import services from providers to your platform."
        breadcrumbs={[
          { title: "Services", href: "/admin/service" },
          { title: "Add Services", href: "/admin/service/add" }
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/service">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Services
            </Link>
          </Button>
        }
      />
      
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <span>Provider Services</span>
              </CardTitle>
              <CardDescription>
                Select a provider to view and import available services
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="text-sm">
                    Services imported from providers will be added to your platform with 
                    default profit margins. You can customize pricing and features after import.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ServicesListFromProvider />
        </CardContent>
        <CardFooter className="border-t bg-muted/30 flex justify-between py-3">
          <div className="text-xs text-muted-foreground">
            Last synchronized: 10 minutes ago
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh All Providers</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddServices;
