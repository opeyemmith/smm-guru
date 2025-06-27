import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "../../_components/admin-page-header";
import CategoryList from "./_components/category-list";

const CategoriesPage = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Service Categories"
        description="Manage categories to organize your services."
        breadcrumbs={[
          { title: "Categories", href: "/admin/category" }
        ]}
        actions={
          <Button variant="outline" onClick={() => document.getElementById('add-category-trigger')?.click()}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />
      
      <CategoryList />
    </div>
  );
};

export default CategoriesPage;
