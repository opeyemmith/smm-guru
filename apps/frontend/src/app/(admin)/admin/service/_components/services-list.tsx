"use client";

import { ApiResponse } from "@/@types/response.type";
import { TServices } from "@smm-guru/database";
import { servicesColumns } from "@/app/(admin)/_components/services-column";
import DataTable from "@/components/global/data-table";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

const ServiceList = () => {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res =
        await axiosV1AdminInstance.get<ApiResponse<TServices[]>>("/services");

      return res.data;
    },
  });

  displayError(isError, error);

  return (
    <>
      {isLoading && <Loader2Icon className="animate-spin mx-auto" />}

      {!isLoading && (
        <DataTable
          columns={servicesColumns}
          data={data?.result || []}
          placeholder="id or name or category"
          searchKey="name"
          deleteEndpoint="none"
        />
      )}
    </>
  );
};

export default ServiceList;
