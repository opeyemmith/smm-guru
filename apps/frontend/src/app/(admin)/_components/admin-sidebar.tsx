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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { adminNavLinks } from "@/lib/constants/navlinks.constants";
import Logo from "@/components/global/logo";
import { 
  BarChart3, 
  Users, 
  TagIcon, 
  Package2, 
  Settings, 
  LifeBuoy, 
  LogOut,
  ExternalLink 
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Map the nav items to their icons
const getNavIcon = (title: string) => {
  switch (title.toLowerCase()) {
    case "dashboard":
      return BarChart3;
    case "users":
      return Users;
    case "service":
      return Package2;
    case "category":
      return TagIcon;
    case "provider":
      return ExternalLink;
    case "settings":
      return Settings;
    default:
      return Package2;
  }
};

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center justify-between w-full">
          <Logo />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-2">
        {/* Dashboard Link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin"}>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-md"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Admin Main Menu */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
            MANAGEMENT
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavLinks.map((item) => {
                const Icon = getNavIcon(item.title);
                return (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton asChild isActive={pathname === item.slug || pathname.startsWith(`${item.slug}/`)}>
                      <Link
                        href={item.slug}
                        className="flex items-center gap-3 px-3 py-2 rounded-md"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support & Settings Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
            SUPPORT
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/settings"}>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-md"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/help"}>
                  <Link
                    href="/admin/help"
                    className="flex items-center gap-3 px-3 py-2 rounded-md"
                  >
                    <LifeBuoy className="h-5 w-5" />
                    <span>Help & Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="mt-auto border-t border-border px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">Administrator</span>
              </div>
            </div>
            <ThemeToggle variant="outline" size="icon" className="h-8 w-8" />
          </div>
          
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
} 