import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-48 flex-col gap-3 p-3 border-r">
        {/* Logo */}
        <Skeleton className="h-8 w-24 rounded-md" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-md" />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-7 w-[150px] rounded-md" /> {/* Title */}
          <Skeleton className="h-7 w-[80px] rounded-md" /> {/* Button */}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>

        {/* Table Skeleton */}
        <section className="mt-4">
          <Skeleton className="h-7 w-full mb-3 rounded-md" />{" "}
          {/* Table Header */}
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
