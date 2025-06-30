import { BarChart3, ClipboardList, Code, List, ShoppingBag, Users, Package2, TagIcon, ExternalLink, Settings, TrendingUp } from "lucide-react";

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
    title: "Dashboard",
    icon: BarChart3,
    slug: "/admin",
  },
  {
    title: "Users",
    icon: Users,
    slug: "/admin/users",
  },
  {
    title: "Users Enhanced",
    icon: Users,
    slug: "/admin/users-enhanced",
  },
  {
    title: "Orders Enhanced",
    icon: ShoppingBag,
    slug: "/admin/orders-enhanced",
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    slug: "/admin/analytics",
  },
  {
    title: "Service",
    icon: Package2,
    slug: "/admin/service",
  },
  {
    title: "Category",
    icon: TagIcon,
    slug: "/admin/category",
  },
  {
    title: "Provider",
    icon: ExternalLink,
    slug: "/admin/provider",
  },
  {
    title: "Settings",
    icon: Settings,
    slug: "/admin/settings",
  },
];
