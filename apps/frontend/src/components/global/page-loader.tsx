import { Loader2Icon } from "lucide-react";
import React from "react";

const PageLoader = () => {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Loader2Icon className="animate-spin h-10 w-10 text-primary" />
    </div>
  );
};

export default PageLoader;
