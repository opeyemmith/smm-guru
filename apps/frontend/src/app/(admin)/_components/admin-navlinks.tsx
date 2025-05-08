"use client";

import { adminNavLinks } from "@/lib/constants/navlinks.constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export const AdminNavLinks = () => {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4 mt-2">
      {adminNavLinks.map((link) => (
        <Link
          key={link.slug}
          href={link.slug}
          className={cn(
            "text-sm text-muted-foreground hover:text-foreground transition-colors",
            pathname === link.slug && "underline"
          )}
        >
          {link.title}
        </Link>
      ))}
    </nav>
  );
};

export default adminNavLinks;
