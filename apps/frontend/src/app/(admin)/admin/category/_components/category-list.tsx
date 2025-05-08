"use client";

import { categoryColumns } from "@/app/(admin)/_components/category-cloumn";
import DataTable from "@/components/global/data-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddCategory from "./add-category";
import { Button } from "@/components/ui/button";
import useGetCategory from "@/hooks/use-get-category";
import PageLoader from "@/components/global/page-loader";

const CategoryList = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useGetCategory();

  function AddServiceButton() {
    return (
      <Button
        onClick={() => {
          setIsDialogOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Category
      </Button>
    );
  }

  return (
    <>
      {isLoading && <PageLoader />}

      {!isLoading && (
        <DataTable
          columns={categoryColumns}
          data={data?.result || []}
          placeholder="id or name"
          searchKey="name"
          deleteEndpoint="none"
          addButton={<AddServiceButton />}
        />
      )}

      <AddCategory
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
};

export default CategoryList;
