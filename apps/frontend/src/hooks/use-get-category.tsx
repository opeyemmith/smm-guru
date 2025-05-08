"use client";

import { ApiResponse } from "@/@types/response.type";
import { TCategory } from "@smm-guru/database";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import { useQuery } from "@tanstack/react-query";

const useGetCategory = () => {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res =
        await axiosV1AdminInstance.get<ApiResponse<TCategory[]>>("/categories");

      return res.data;
    },
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  displayError(isError, error);

  return { data, isLoading };
};

export default useGetCategory;
