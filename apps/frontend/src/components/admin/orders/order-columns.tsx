"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  User,
  Package,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type Order = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  service: string;
  serviceCategory: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  quantity: number;
  price: number;
  totalAmount: number;
  link: string;
  startCount?: number;
  remains?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
};

interface OrderColumnsProps {
  onView?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onUpdateStatus?: (order: Order, status: Order['status']) => void;
  onViewUser?: (order: Order) => void;
}

export const createOrderColumns = ({
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onViewUser,
}: OrderColumnsProps = {}): ColumnDef<Order>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Order ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return (
        <div className="font-mono text-sm">
          #{id.slice(-8).toUpperCase()}
        </div>
      );
    },
  },
  {
    accessorKey: "userName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{order.userName}</span>
          <span className="text-xs text-muted-foreground">{order.userEmail}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "service",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Service
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-medium text-sm truncate">{order.service}</span>
          <Badge variant="outline" className="text-xs w-fit mt-1">
            {order.serviceCategory}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as Order['status'];
      
      const getStatusConfig = (status: Order['status']) => {
        switch (status) {
          case "completed":
            return {
              variant: "default" as const,
              className: "bg-green-100 text-green-800 border-green-200",
              icon: CheckCircle,
            };
          case "processing":
            return {
              variant: "default" as const,
              className: "bg-blue-100 text-blue-800 border-blue-200",
              icon: Loader2,
            };
          case "pending":
            return {
              variant: "secondary" as const,
              className: "bg-yellow-100 text-yellow-800 border-yellow-200",
              icon: Clock,
            };
          case "failed":
          case "cancelled":
            return {
              variant: "destructive" as const,
              className: "bg-red-100 text-red-800 border-red-200",
              icon: XCircle,
            };
          default:
            return {
              variant: "outline" as const,
              className: "",
              icon: Clock,
            };
        }
      };

      const config = getStatusConfig(status);
      const StatusIcon = config.icon;

      return (
        <Badge variant={config.variant} className={cn("gap-1", config.className)}>
          <StatusIcon className={cn(
            "h-3 w-3",
            status === "processing" && "animate-spin"
          )} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const priority = row.getValue("priority") as Order['priority'];
      
      const getPriorityConfig = (priority: Order['priority']) => {
        switch (priority) {
          case "urgent":
            return {
              className: "bg-red-100 text-red-800 border-red-200",
              label: "🔥 Urgent",
            };
          case "high":
            return {
              className: "bg-orange-100 text-orange-800 border-orange-200",
              label: "⚡ High",
            };
          case "medium":
            return {
              className: "bg-blue-100 text-blue-800 border-blue-200",
              label: "📋 Medium",
            };
          case "low":
            return {
              className: "bg-gray-100 text-gray-800 border-gray-200",
              label: "📝 Low",
            };
          default:
            return {
              className: "",
              label: priority,
            };
        }
      };

      const config = getPriorityConfig(priority);

      return (
        <Badge variant="outline" className={cn("text-xs", config.className)}>
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      return (
        <div className="font-mono text-sm">
          {quantity.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{formatted}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>{format(createdAt, "MMM dd, yyyy")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.link)}
            >
              Copy link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onView && (
              <DropdownMenuItem onClick={() => onView(order)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
            )}
            {onViewUser && (
              <DropdownMenuItem onClick={() => onViewUser(order)}>
                <User className="mr-2 h-4 w-4" />
                View customer
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit order
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onUpdateStatus && (
              <>
                <DropdownMenuItem onClick={() => onUpdateStatus(order, "processing")}>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Mark processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(order, "completed")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(order, "failed")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark failed
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(order)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
