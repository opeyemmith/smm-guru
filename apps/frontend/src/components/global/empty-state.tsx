import { Frown } from "lucide-react";
import React from "react";

const EmptyState = () => {
  return (
    <div className="flex h-[450px] w-full flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Frown className="size-10 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Nothing to show here</h3>
      <p className="mt-2 text-sm text-gray-500">
        It looks like there&apos;s nothing here yet. Try adding some content or
        check back later.
      </p>
    </div>
  );
};

export default EmptyState;