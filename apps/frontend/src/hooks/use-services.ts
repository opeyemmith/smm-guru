"use client";

import { useCurrency } from "@/context/zustand/store";
import { displayError } from "@/lib/error/toast.error";
import { getServicesWithCat } from "@/lib/fetch/service.fetch";
import { useQuery } from "@tanstack/react-query";

const useServices = (props: { currency?: string }) => {
  const { currency } = useCurrency();

  const isEnableQuery = props?.currency ? true : currency ? true : false;

  const { data, isLoading, isPending, error, isError } = useQuery({
    queryKey: ["services", props?.currency || currency],
    queryFn: () => getServicesWithCat((props?.currency || currency) as string),
    enabled: isEnableQuery,
  });

  displayError(isError, error);

  return { data, isLoading, isPending };
};

export default useServices;
