"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "../../_components/admin-page-header";
import { AdvancedDataTable } from "@/components/admin/data-table/advanced-data-table";
import { createUserColumns, User } from "@/components/admin/users/user-columns";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

// Mock data for enhanced user management
const generateMockUsers = (): User[] => {
  const statuses = ["active", "inactive", "suspended"] as const;
  const roles = ["user", "admin"] as const;
  const names = [
    "John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "David Brown",
    "Emily Davis", "Chris Miller", "Lisa Garcia", "Tom Anderson", "Amy Taylor",
    "Kevin Martinez", "Rachel White", "Jason Lee", "Michelle Clark", "Ryan Lewis",
    "Jennifer Hall", "Mark Young", "Laura King", "Daniel Wright", "Nicole Scott",
    "Alex Thompson", "Maria Rodriguez", "James Wilson", "Anna Johnson", "Robert Davis"
  ];
  
  return Array.from({ length: 75 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: names[i % names.length] || `User ${i + 1}`,
    email: `${names[i % names.length]?.toLowerCase().replace(' ', '.') || `user${i + 1}`}@example.com`,
    role: i < 8 ? "admin" : "user",
    status: statuses[Math.floor(Math.random() * statuses.length)],
    emailVerified: Math.random() > 0.15,
    balance: Math.floor(Math.random() * 2000),
    totalOrders: Math.floor(Math.random() * 150),
    lastLogin: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
    phone: Math.random() > 0.4 ? `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}` : undefined,
  }));
};

const EnhancedUsersPage = () => {
  const queryClient = useQueryClient();

  // Enhanced query with mock data for demonstration
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users-enhanced"],
    queryFn: async (): Promise<User[]> => {
      // Simulate API delay for realistic loading experience
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockUsers();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });

  // Mock mutations for user actions
  const editUserMutation = useMutation({
    mutationFn: async (user: User) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return user;
    },
    onSuccess: (user) => {
      toast.success(`User ${user.name} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (user: User) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return user.id;
    },
    onSuccess: (_, user) => {
      toast.success(`User ${user.name} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (users: User[]) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return users.map(u => u.id);
    },
    onSuccess: (_, users) => {
      toast.success(`${users.length} users deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to delete users");
    },
  });

  const bulkEditMutation = useMutation({
    mutationFn: async (users: User[]) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return users;
    },
    onSuccess: (_, users) => {
      toast.success(`${users.length} users updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-enhanced"] });
    },
    onError: () => {
      toast.error("Failed to update users");
    },
  });

  // Action handlers
  const handleEdit = (user: User) => {
    toast.info(`Opening edit dialog for ${user.name}`);
    // TODO: Open edit dialog
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user);
    }
  };

  const handleBulkDelete = (users: User[]) => {
    if (confirm(`Are you sure you want to delete ${users.length} users?`)) {
      bulkDeleteMutation.mutate(users);
    }
  };

  const handleBulkEdit = (users: User[]) => {
    toast.info(`Opening bulk edit dialog for ${users.length} users`);
    // TODO: Open bulk edit dialog
  };

  const handleToggleRole = (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const updatedUser = { ...user, role: newRole };
    editUserMutation.mutate(updatedUser);
    toast.info(`Changed ${user.name}'s role to ${newRole}`);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    const updatedUser = { ...user, status: newStatus };
    editUserMutation.mutate(updatedUser);
    toast.info(`Changed ${user.name}'s status to ${newStatus}`);
  };

  const handleViewOrders = (user: User) => {
    toast.info(`Viewing orders for ${user.name}`);
    // TODO: Navigate to user orders page or open orders modal
  };

  const handleExport = () => {
    toast.success("Exporting user data to CSV...");
    // TODO: Implement CSV/Excel export functionality
    
    // Mock CSV export
    const csvData = data?.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      Balance: user.balance,
      Orders: user.totalOrders,
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'Last Login': user.lastLogin ? user.lastLogin.toISOString() : 'Never',
      'Created At': user.createdAt.toISOString(),
    }));
    
    console.log('CSV Export Data:', csvData);
  };

  const handleAddUser = () => {
    toast.info("Opening add user dialog");
    // TODO: Open add user dialog
  };

  const handleRefresh = () => {
    refetch();
    toast.success("User data refreshed");
  };

  const columns = createUserColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleRole: handleToggleRole,
    onToggleStatus: handleToggleStatus,
    onViewOrders: handleViewOrders,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Enhanced User Management"
          description="Advanced user management with filtering, bulk operations, and analytics."
        />
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load users</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enhanced User Management"
        description="Advanced user management with filtering, bulk operations, and real-time analytics."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleAddUser} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        }
      />

      <AdvancedDataTable
        columns={columns}
        data={data || []}
        searchKey="name"
        searchPlaceholder="Search users by name, email, or ID..."
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enableGlobalFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default EnhancedUsersPage;
