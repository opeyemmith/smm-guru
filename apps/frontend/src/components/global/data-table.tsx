"use client";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  Loader2,
  Search,
  TrashIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import EmptyState from "./empty-state";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { axiosV1DashboardInstance } from "@/lib/axios/config";
import { ApiResponse } from "@/@types/response.type";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  addButton,
  statusFilter,
  placeholder,
  searchKey,
  deleteEndpoint,
}: DataTableProps<TData, TValue> & {
  addButton?: React.JSX.Element;
  statusFilter?: React.JSX.Element;
  searchKey: string;
  placeholder: string;
  deleteEndpoint: "cars" | "invoice" | "customers" | "none";
}) {
  const id = useId();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: searchKey,
      desc: true,
    },
  ]);

  const [tableData, setTableData] = useState<TData[]>(data);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const { mutateAsync, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const selectedRows = table.getSelectedRowModel().rows;

      await Promise.all(
        selectedRows.map(async (row) => {
          const res = await axiosV1DashboardInstance.delete<ApiResponse<null>>(
            `/${deleteEndpoint}/${(row.original as { id: number }).id}`
          );

          return res.data;
        })
      );

      return {
        message: `${deleteEndpoint.toLocaleUpperCase()} deleted successfully!`,
        description: `Selected ${deleteEndpoint} have been removed from the system.`,
      };
    },
    onSuccess: (res) => {
      const selectedRows = table.getSelectedRowModel().rows;

      const updatedData = tableData.filter(
        (item) =>
          !selectedRows.some(
            (row) =>
              (row.original as { id: string }).id ===
              (item as { id: string }).id
          )
      );

      setTableData(updatedData);
      table.resetRowSelection();
      setIsDeleteDialogOpen(false);

      toast.success(res.message, {
        description: res.description,
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
  });

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  if (tableData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="w-full h-fit flex items-center justify-end">
          {addButton}
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by search */}
          <div
            className={cn(
              "flex items-center justify-start w-fit h-fit gap-3 border border-border px-3 rounded-md",
              isSearchFocused && "border-primary"
            )}
          >
            <Search size={20} className="opacity-60" />
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn("blank-input")}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              value={
                (table.getColumn(searchKey)?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn(searchKey)?.setFilterValue(e.target.value)
              }
              placeholder={placeholder}
              type="text"
              aria-label={placeholder}
            />

            <span
              className={cn(
                "p-0 rounded-full opacity-0",
                Boolean(table.getColumn(searchKey)?.getFilterValue()) &&
                  "opacity-100 cursor-pointer"
              )}
              onClick={() => {
                if (!Boolean(table.getColumn(searchKey)?.getFilterValue())) {
                  return;
                }
                table.getColumn(searchKey)?.setFilterValue("");
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              aria-label="Clear filter"
            >
              <CircleXIcon
                className="opacity-60"
                size={16}
                aria-hidden="true"
              />
            </span>
          </div>
          {/* Filter by status */}
          {statusFilter && statusFilter}

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <>
              <Button
                className="ml-auto"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <TrashIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Delete
                <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                  {table.getSelectedRowModel().rows.length}
                </span>
              </Button>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                      aria-hidden="true"
                    >
                      <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete {table.getSelectedRowModel().rows.length}{" "}
                        selected{" "}
                        {table.getSelectedRowModel().rows.length === 1
                          ? "row"
                          : "rows"}
                        . This action may delete related data associated with
                        this entity.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter>
                    <Button
                      variant="secondary"
                      disabled={isDeleting}
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button disabled={isDeleting} onClick={() => mutateAsync()}>
                      {!isDeleting ? (
                        "Delete"
                      ) : (
                        <Loader2 className="animate-spin" />
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {/* Add button */}
          {addButton && <div className="text-end w-full">{addButton}</div>}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-medium text-xs uppercase tracking-wide text-muted-foreground py-3.5"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: cn(
                            "flex items-center gap-1",
                            header.column.getCanSort() &&
                              "cursor-pointer select-none"
                          ),
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUpIcon className="h-4 w-4" />,
                          desc: <ChevronDownIcon className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} total items
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronFirstIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronLastIcon className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
