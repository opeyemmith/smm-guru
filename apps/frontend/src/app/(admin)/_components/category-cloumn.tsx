"use client";

import * as React from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TCategory } from "@smm-guru/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import AddCategory from "../admin/category/_components/add-category";

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<TCategory> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.id} ${row.original.name}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

export const categoryColumns: ColumnDef<TCategory>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="capitalize">{row.getValue("id")}</div>,
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
    accessorKey: "created_at",
    header: () => <div className="text-right">Rate per 1000</div>,
    cell: ({ row }) => {
      const formattedDate = format(row.getValue("created_at"), "dd-MMM-yyyy");

      return (
        <div className="text-left font-medium capitalize">{formattedDate}</div>
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
      return <CategoryAction original={original} />;
    },
  },
];

const CategoryAction = ({ original }: { original: TCategory }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosV1AdminInstance.delete<ApiResponse<null>>(
        `/categories/${original.id}`
      );
      return res.data;
    },
    onError: (e) => {
      toast(e.name, {
        description: e.message,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast(res.name, {
        description: res.message,
      });
    },
  });

  return (
    <>
      {" "}
      {original.name !== "Uncategorized" && (
        <>
          <div className="text-right pr-3 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {!deleteMutation.isPending ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <Loader2Icon className="animate-spin h-4 w-4" />
              )}
            </Button>
          </div>

          <AddCategory
            original={original}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
          />
        </>
      )}
    </>
  );
};

export default CategoryAction;
