"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2Icon } from "lucide-react";
import useProvider from "@/hooks/use-provider";
import { useQuery } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";
import { TServicesFromProvider } from "@smm-guru/database";

import { addServicesColumns } from "@/app/(admin)/_components/add-services-column";
import DataTable from "@/components/global/data-table";
import { useProviderId } from "@/context/zustand/store";
import { displayError } from "@/lib/error/toast.error";

export default function ServicesListFromProvider() {
  const { data: providers, isLoading: isProviderLoading } = useProvider();
  const { selectedProviderId, setSelectedProviderId } = useProviderId();

  const {
    data: services,
    error,
    isError,
    isLoading: isServiceLoading,
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

  return (
    <div className="w-full space-y-4">
      <div className="w-full h-fit flex items-center justify-start gap-3">
        {isProviderLoading && (
          <Loader2Icon className="animate-spin opacity-80" />
        )}
        <Select
          disabled={isProviderLoading}
          onValueChange={(e) => setSelectedProviderId(Number(e))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>
          <SelectContent>
            {(providers?.result || []).map((provider) => (
              <SelectItem
                key={provider.id}
                value={(provider.id as number).toString()}
              >
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {isServiceLoading && (
          <Loader2Icon className="animate-spin opacity-80 mx-auto" />
        )}
        {!isServiceLoading && services?.result && (
          // <ServicesCard mode="display" services={services.result} />
          <DataTable
            columns={addServicesColumns}
            data={services.result}
            searchKey="service"
            placeholder="id or name or category"
            deleteEndpoint="none"
          />
        )}
      </div>
    </div>
  );
}
