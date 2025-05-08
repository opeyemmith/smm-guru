import { ClipboardList, Code, List, ShoppingBag } from "lucide-react";

export const navLinks = [
  {
    title: "New Order",
    icon: ShoppingBag,
    slug: "/dashboard/new-orders",
  },
  {
    title: "Orders",
    icon: ClipboardList,
    slug: "/dashboard/orders",
  },
  {
    title: "Services",
    icon: List,
    slug: "/dashboard/services",
  },
  {
    title: "API",
    icon: Code,
    slug: "/dashboard/api",
  },
];

export const adminNavLinks = [
  {
    title: "Users",
    slug: "/admin/users",
  },
  {
    title: "Service",
    slug: "/admin/service",
  },
  {
    title: "Category",
    slug: "/admin/category",
  },
  {
    title: "Provider",
    slug: "/admin/provider",
  },
];
