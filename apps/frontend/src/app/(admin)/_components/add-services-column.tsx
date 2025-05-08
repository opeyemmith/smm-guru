"use client";

import * as React from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Loader2Icon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TServicesFromProvider } from "@smm-guru/database";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";
import { toast } from "sonner";
import { useProviderId } from "@/context/zustand/store";
import { displayError } from "@/lib/error/toast.error";

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<TServicesFromProvider> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.service} ${row.original.name} ${row.original.category}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

export const addServicesColumns: ColumnDef<TServicesFromProvider>[] = [
  {
    accessorKey: "service",
    header: "ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("service")}</div>
    ),
    size: 70,
    filterFn: multiColumnFilterFn,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div
        className="text-left whitespace-pre-wrap break-words"
        style={{ maxWidth: "250px" }}
      >
        {row.getValue("name")}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "rate",
    header: () => <div className="text-right">Rate per 1000</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium capitalize">
          {row.getValue("rate")}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "min",
    header: "Min Order",
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("min")}</div>;
    },
    size: 190,
  },
  {
    accessorKey: "max",
    header: "Max Order",
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("max")}</div>;
    },
    size: 190,
  },
  {
    accessorKey: "refill",
    header: () => <div className="text-right">Refill</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">
          {row.getValue("refill") ? (
            <Badge variant="secondary">Yes</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          )}
        </div>
      );
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-3">Action</div>,
    enableHiding: false,
    cell: ({ row }) => {
      const original = row.original;
      return <AddService original={original} />;
    },
  },
];

const AddService = ({ original }: { original: TServicesFromProvider }) => {
  const { selectedProviderId } = useProviderId();

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async () => {
      const res = await axiosV1AdminInstance.post<ApiResponse<null>>(
        `/services?provider-id=${selectedProviderId}`,
        original
      );

      return res.data;
    },
    onError: (e) => {
      displayError(true, e);
    },
    onSuccess: (res) => {
      toast(res.name, {
        description: res.message,
      });
    },
  });
  return (
    <div className="text-right pr-3">
      <Button
        variant="outline"
        size="icon"
        disabled={isPending}
        onClick={() => mutateAsync()}
      >
        {!isPending ? <Plus /> : <Loader2Icon className="animate-spin" />}
      </Button>
    </div>
  );
};
