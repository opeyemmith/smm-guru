"use client";

import * as React from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  Ban,
  Circle,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { paragraphVariants } from "@/components/global/p";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserWithRole } from "better-auth/plugins";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { authClient } from "@/lib/better-auth/auth-client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<UserWithRole> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.email}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

export const adminUserColumns: ColumnDef<UserWithRole>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    size: 90,
    filterFn: multiColumnFilterFn,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-left">{row.getValue("email")}</div>,
    size: 160,
  },
  {
    accessorKey: "emailVerified",
    header: () => <div className="text-right">Email Verified</div>,
    cell: ({ row }) => {
      const isEmailVerified = row.original.emailVerified;
      return (
        <div className="text-left font-medium capitalize">
          {" "}
          {isEmailVerified ? (
            <Badge>Verified</Badge>
          ) : (
            <Badge variant="secondary">Un-Verified</Badge>
          )}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "role",
    header: () => <div className="text-right">Role</div>,
    cell: ({ row }) => {
      const role = row.getValue("role");
      return (
        <div className="text-left font-medium capitalize">
          {" "}
          {role === "user" ? (
            <Badge variant="secondary">User</Badge>
          ) : (
            role === "admin" && <Badge>Admin</Badge>
          )}
        </div>
      );
    },
    size: 70,
  },
  {
    accessorKey: "banned",
    header: "Banned",
    cell: ({ row }) => {
      const isBanned = row.getValue("banned");

      return (
        <div className="text-left font-medium">
          {isBanned ? (
            <Badge variant="destructive">Banned</Badge>
          ) : (
            <Badge>Free</Badge>
          )}
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: "banExpires",
    header: () => <div className="text-right">Ban Expiry</div>,
    cell: ({ row }) => {
      const banExpiry = row.original.banExpires;
      return (
        <div className="text-left font-medium">
          {banExpiry ? format(banExpiry, "dd-MMM-yyyy") : "-"}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "banReason",
    header: () => <div className="text-right">Ban Reason</div>,
    cell: ({ row }) => {
      const banReason = row.original.banReason;
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!banReason} variant="ghost" size="icon">
              <MessageCircle className="opacity-80" size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <MessageCircle className="opacity-80" size={16} />
              </div>
              <AlertDialogHeader>
                <AlertDialogTitle>Reason</AlertDialogTitle>
                <AlertDialogDescription>{banReason}</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction>Cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
    size: 90,
  },
  {
    accessorKey: "createdAt",
    header: () => <div className="text-right">Joined at</div>,
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      return (
        <div className="text-left font-medium">
          {format(createdAt, "dd-MMM-yyyy")}
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
      return (
        <div className="text-right pr-3">
          <AdminUserColumnsDropdown original={original} />
        </div>
      );
    },
  },
];

function AdminUserColumnsDropdown({ original }: { original: UserWithRole }) {
  const queryClient = useQueryClient();

  const invalidateAdminUser = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user"] });
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isBanUserDialogOpen, setIsBanUserDialogOpen] = React.useState(false);
  const [isUnBanUserDialogOpen, setIsUnBanUserDialogOpen] =
    React.useState(false);

  const [banReason, setBanReason] = React.useState("");
  const [banExpiresIn, setBanExpiresIn] = React.useState("");

  const isUserBanned = original.banned;

  const mutationDeleteUser = useMutation({
    mutationFn: async () => {
      return await authClient.admin.removeUser({
        userId: original.id,
      });
    },
    onSuccess: () => {
      invalidateAdminUser();
      toast.success("User Removed", {
        description: "The user has been successfully removed from the system.",
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
    onSettled: () => {
      setIsDeleteDialogOpen(false);
    },
  });

  const mutationBanUser = useMutation({
    mutationFn: async () => {
      const daysInMilliseconds = parseInt(banExpiresIn) * 24 * 60 * 60 * 1000;

      const banInfo = await authClient.admin.banUser({
        userId: original.id,
        banReason: banReason || undefined,
        banExpiresIn: daysInMilliseconds || undefined,
      });

      if (banInfo.error) {
        throw new Error(banInfo.error.message);
      }

      return banInfo;
    },
    onSuccess: () => {
      invalidateAdminUser();
      toast.success("User Banned", {
        description: "The user has been successfully banned from the system.",
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
    onSettled: () => {
      setIsBanUserDialogOpen(false);
    },
  });

  const mutationUnBanUser = useMutation({
    mutationFn: async () => {
      const unBanInfo = await authClient.admin.unbanUser({
        userId: original.id,
      });

      if (unBanInfo.error) {
        throw new Error(unBanInfo.error.message);
      }

      return unBanInfo;
    },
    onSuccess: () => {
      invalidateAdminUser();

      toast.success("User Un-Banned", {
        description:
          "The user has been successfully un-banned from the system.",
      });
    },
    onError: (e) => {
      toast.error(e.name, {
        description: e.message,
      });
    },
    onSettled: () => {
      setIsUnBanUserDialogOpen(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4 text-gray-700 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 w-48 border border-gray-200 dark:border-gray-700"
        >
          <DropdownMenuLabel
            className={cn(
              paragraphVariants({ size: "medium", weight: "bold" }),
              "text-gray-800 dark:text-white"
            )}
          >
            User Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

          {/* Ban User */}
          {!isUserBanned && (
            <DropdownMenuItem
              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setIsBanUserDialogOpen(true)}
            >
              <Ban className="size-4 text-gray-700 dark:text-gray-300" />
              <span
                className={cn(
                  paragraphVariants({ size: "small", weight: "medium" }),
                  "text-gray-700 dark:text-gray-300"
                )}
              >
                Ban User
              </span>
            </DropdownMenuItem>
          )}

          {/* Un-Ban User */}
          {isUserBanned && (
            <DropdownMenuItem
              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setIsUnBanUserDialogOpen(true)}
            >
              <Circle className="size-4 text-gray-700 dark:text-gray-300" />
              <span
                className={cn(
                  paragraphVariants({ size: "small", weight: "medium" }),
                  "text-gray-700 dark:text-gray-300"
                )}
              >
                Un-Ban User
              </span>
            </DropdownMenuItem>
          )}

          {/* Delete User */}
          <DropdownMenuItem
            className="flex items-center gap-3 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 text-red-600 dark:text-red-400" />
            <span
              className={cn(
                paragraphVariants({ size: "small", weight: "medium" }),
                "text-red-600 dark:text-red-400"
              )}
            >
              Remove User
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban user */}
      <Dialog open={isBanUserDialogOpen} onOpenChange={setIsBanUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Set the ban duration and reason for this user. This will prevent
              them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col w-full items-start justify-center h-fit gap-2">
              <Label htmlFor="resson" className="text-right">
                Reason (optional)
              </Label>
              <Input
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason"
                className="col-span-3"
              />
            </div>
            <div className="flex flex-col w-full items-start justify-center h-fit gap-2">
              <Label htmlFor="duration" className="text-right">
                Duration (optional)
              </Label>
              <Select value={banExpiresIn} onValueChange={setBanExpiresIn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ban Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="20">20 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={mutationBanUser.isPending}
              onClick={() => mutationBanUser.mutateAsync()}
            >
              {!mutationBanUser.isPending ? (
                "Ban User"
              ) : (
                <Loader2 className="animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Un-ban user dialog here */}
      <AlertDialog
        open={isUnBanUserDialogOpen}
        onOpenChange={setIsUnBanUserDialogOpen}
      >
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <Circle className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Un-ban</AlertDialogTitle>
              <AlertDialogDescription>
                Un-banning this user will restore their access to the system.
                They will be able to use all features available to their role.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="h-fit w-full flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              disabled={mutationUnBanUser.isPending}
              onClick={() => setIsUnBanUserDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => mutationUnBanUser.mutateAsync()}
              disabled={mutationUnBanUser.isPending}
            >
              {!mutationUnBanUser.isPending ? (
                "Un-ban user"
              ) : (
                <Loader2 className="animate-spin" />
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog here */}
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
              <Trash2 className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Deleting this car will permanently remove it from the system.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="h-fit w-full flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              disabled={mutationDeleteUser.isPending}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => mutationDeleteUser.mutateAsync()}
              disabled={mutationDeleteUser.isPending}
            >
              {!mutationDeleteUser.isPending ? (
                "Delete"
              ) : (
                <Loader2 className="animate-spin" />
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}