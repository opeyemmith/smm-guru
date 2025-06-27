"use client";

import React from "react";
import { 
  SidebarTrigger, 
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Search,
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <SidebarTrigger className="block md:hidden mr-2" />
        
        {/* Page Title - Hidden on mobile */}
        <h1 className="text-lg font-medium hidden md:block">
          Admin Dashboard
        </h1>
        
        {/* Search */}
        <div className="flex-1 flex justify-center px-4 lg:px-6">
          <div className="w-full max-w-lg lg:max-w-xl relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Help Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[220px] p-0">
              <div className="grid gap-1 p-2">
                <a
                  href="/admin/help"
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                >
                  <LifeBuoy className="h-4 w-4" />
                  <span>Help Center</span>
                </a>
                <a
                  href="/admin/docs"
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Documentation</span>
                </a>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-0">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                  Mark all as read
                </Button>
              </div>
              <div className="max-h-[300px] overflow-auto">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "flex gap-3 p-3 hover:bg-accent/50 border-b border-border last:border-0",
                      item === 1 && "bg-accent/20"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U{item}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm">
                        New user registered{" "}
                        <span className="font-medium">User #{item}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item * 5} minutes ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatar.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline-block">Admin</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 