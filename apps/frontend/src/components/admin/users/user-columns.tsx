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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  emailVerified: boolean;
  balance: number;
  totalOrders: number;
  lastLogin: Date | null;
  createdAt: Date;
  avatar?: string;
  phone?: string;
};

interface UserColumnsProps {
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleRole?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onViewOrders?: (user: User) => void;
}

export const createUserColumns = ({
  onEdit,
  onDelete,
  onToggleRole,
  onToggleStatus,
  onViewOrders,
}: UserColumnsProps = {}): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xs">
              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge 
          variant={role === "admin" ? "default" : "secondary"}
          className={cn(
            "gap-1",
            role === "admin" && "bg-purple-100 text-purple-800 border-purple-200"
          )}
        >
          {role === "admin" ? (
            <Shield className="h-3 w-3" />
          ) : (
            <ShieldOff className="h-3 w-3" />
          )}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
      const status = row.getValue("status") as string;
      const emailVerified = row.original.emailVerified;
      
      const getStatusConfig = (status: string) => {
        switch (status) {
          case "active":
            return {
              variant: "default" as const,
              className: "bg-green-100 text-green-800 border-green-200",
              icon: Activity,
            };
          case "inactive":
            return {
              variant: "secondary" as const,
              className: "bg-gray-100 text-gray-800 border-gray-200",
              icon: Activity,
            };
          case "suspended":
            return {
              variant: "destructive" as const,
              className: "bg-red-100 text-red-800 border-red-200",
              icon: Activity,
            };
          default:
            return {
              variant: "outline" as const,
              className: "",
              icon: Activity,
            };
        }
      };

      const config = getStatusConfig(status);
      const StatusIcon = config.icon;

      return (
        <div className="flex flex-col space-y-1">
          <Badge variant={config.variant} className={cn("gap-1 w-fit", config.className)}>
            <StatusIcon className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {!emailVerified && (
            <Badge variant="outline" className="text-xs w-fit">
              <Mail className="h-2 w-2 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "balance",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue("balance"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(balance);

      return (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "font-medium",
            balance > 0 ? "text-green-600" : "text-muted-foreground"
          )}>
            {formatted}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalOrders",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const totalOrders = row.getValue("totalOrders") as number;
      return (
        <Badge variant="outline" className="font-mono">
          {totalOrders.toLocaleString()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lastLogin",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Last Login
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as Date | null;
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {lastLogin ? (
            <span>{format(lastLogin, "MMM dd, yyyy")}</span>
          ) : (
            <span className="text-muted-foreground">Never</span>
          )}
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
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {format(createdAt, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;

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
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.email)}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onViewOrders && (
              <DropdownMenuItem onClick={() => onViewOrders(user)}>
                View orders
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
            )}
            {onToggleRole && (
              <DropdownMenuItem onClick={() => onToggleRole(user)}>
                <Shield className="mr-2 h-4 w-4" />
                Toggle role
              </DropdownMenuItem>
            )}
            {onToggleStatus && (
              <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                <Activity className="mr-2 h-4 w-4" />
                Toggle status
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
