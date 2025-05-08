"use client";

import PageLoader from "@/components/global/page-loader";
import { ServicesCard } from "@/components/global/services-card";
import useServices from "@/hooks/use-services";
import React from "react";

const ServicesList = (props: { currency?: string }) => {
  const { data, isLoading, isPending } = useServices({
    currency: props.currency,
  });

  if (isLoading || isPending) return <PageLoader />;

  return (
    <ServicesCard
      categories={data?.services || []}
      mode="display"
      currency={data?.currency || "USD"}
    />
  );
};

export default ServicesList;
