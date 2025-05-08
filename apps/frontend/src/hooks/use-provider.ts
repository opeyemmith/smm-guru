"use client";

import { ApiResponse } from "@/@types/response.type";
import { TProvider } from "@smm-guru/database";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import { useQuery } from "@tanstack/react-query";

const useProvider = () => {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res =
        await axiosV1AdminInstance.get<ApiResponse<TProvider[]>>("/providers");

      return res.data;
    },
  });

  displayError(isError, error);

  return { data, isLoading };
};

export default useProvider;
