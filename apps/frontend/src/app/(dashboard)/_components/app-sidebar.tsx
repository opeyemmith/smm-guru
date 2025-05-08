"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { navLinks } from "@/lib/constants/navlinks.constants";
import Logo from "@/components/global/logo";
import SidebarProfile from "./sidebar-profile";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center justify-between w-full">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {navLinks.map((item) => (
            <SidebarMenuItem key={item.slug}>
              <SidebarMenuButton asChild isActive={pathname === item.slug}>
                <Link
                  href={item.slug}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    pathname === item.slug
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t border-border">
        <SidebarProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
