"use client";

import DataTable from "@/components/global/data-table";
import { authClient } from "@/lib/better-auth/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminUserColumns } from "./admin-user-columns";
import AdminAddUserButton from "./admin-add-user";

const AdminUsersDashboard = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-user"],
    queryFn: async () => {
      return (await authClient.admin.listUsers({ query: { limit: 20 } })).data
        ?.users;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <DataTable
      columns={adminUserColumns}
      data={users || []}
      placeholder="name or email"
      searchKey="name"
      deleteEndpoint="none"
      addButton={<AdminAddUserButton />}
    />
  );
};

export default AdminUsersDashboard;