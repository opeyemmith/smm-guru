"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertCircle, ArrowDownUp, ExternalLink, Loader2Icon, RefreshCw, Search, ServerCrash } from "lucide-react";
import useProvider from "@/hooks/use-provider";
import { useQuery } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";
import { TServicesFromProvider } from "@smm-guru/database";

import { addServicesColumns } from "@/app/(admin)/_components/add-services-column";
import DataTable from "@/components/global/data-table";
import { useProviderId } from "@/context/zustand/store";
import { displayError } from "@/lib/error/toast.error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";

export default function ServicesListFromProvider() {
  const { data: providers, isLoading: isProviderLoading } = useProvider();
  const { selectedProviderId, setSelectedProviderId } = useProviderId();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: services,
    error,
    isError,
    isLoading: isServiceLoading,
    refetch,
  } = useQuery({
    queryKey: ["provider-services", selectedProviderId],
    queryFn: async () => {
      const res = await axiosV1AdminInstance.get<
        ApiResponse<TServicesFromProvider[]>
      >(`/providers/services/${selectedProviderId}`);

      return res.data;
    },
    enabled: !!selectedProviderId,
  });

  displayError(isError, error);

  // Filter services based on search term
  const filteredServices = searchTerm && services?.result 
    ? services.result.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        service.service.toLowerCase().includes(searchTerm.toLowerCase()))
    : services?.result || [];

  // Get the selected provider name
  const selectedProviderName = providers?.result?.find(
    provider => provider.id === selectedProviderId
  )?.name || "Selected Provider";

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-64 space-y-2">
          <label className="text-sm font-medium">Select Provider</label>
          <Select
            disabled={isProviderLoading}
            onValueChange={(e) => setSelectedProviderId(Number(e))}
          >
            <SelectTrigger className="w-full">
              {isProviderLoading ? (
                <div className="flex items-center">
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading providers...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select Provider" />
              )}
            </SelectTrigger>
            <SelectContent>
              {(providers?.result || []).map((provider) => (
                <SelectItem
                  key={provider.id}
                  value={(provider.id as number).toString()}
                >
                  <div className="flex items-center gap-2">
                    <span>{provider.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Provider
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProviderId && (
          <div className="flex-1 flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isServiceLoading || !services?.result}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isServiceLoading}
              className="whitespace-nowrap"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedProviderId}
              className="whitespace-nowrap"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Visit Provider
            </Button>
          </div>
        )}
      </div>

      {selectedProviderId && (
        <div className="space-y-4">
          {isServiceLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2Icon className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm">Loading services from {selectedProviderName}...</p>
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load services from provider. Please try again or contact support.
              </AlertDescription>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="mt-2"
              >
                Try Again
              </Button>
            </Alert>
          ) : services?.result?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ServerCrash className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-1">No services found</h3>
              <p className="text-sm">This provider doesn't have any services available.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {filteredServices.length} services found
                  </Badge>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground">
                      Showing results for "{searchTerm}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ArrowDownUp className="mr-2 h-3.5 w-3.5" />
                    Sort
                  </Button>
                </div>
              </div>
              
              <DataTable
                columns={addServicesColumns}
                data={filteredServices}
                searchKey="service"
                placeholder="id or name or category"
                deleteEndpoint="none"
              />
            </>
          )}
        </div>
      )}

      {!selectedProviderId && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-1">No provider selected</h3>
          <p className="text-sm mb-4">Please select a provider to view available services.</p>
          {isProviderLoading ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : providers?.result?.length === 0 ? (
            <div className="text-center">
              <p className="text-sm mb-2">No providers found in the system.</p>
              <Button size="sm" asChild>
                <Link href="/admin/provider">Add Provider</Link>
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
