"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

const AddServiceButton = () => {
  return (
    <div className="w-full h-fit flex items-center justify-end">
      <Link
        className={cn(
          buttonVariants({ variant: "default", className: "mb-4" })
        )}
        href="/admin/service/add"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Services
      </Link>
    </div>
  );
};

export default AddServiceButton;
