"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="relative p-2 rounded-full border border-gray-300 dark:border-gray-600"
      >
        <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-300 ease-in-out dark:rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 text-gray-500 transition-transform duration-300 ease-in-out rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
      align="end"
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2"
      >
      <DropdownMenuItem
        onClick={() => setTheme("light")}
        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Sun className="h-4 w-4 mr-2 text-yellow-500" />
        Light
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme("dark")}
        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Moon className="h-4 w-4 mr-2 text-gray-500" />
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme("system")}
        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <span className="h-4 w-4 mr-2 text-gray-500">🖥️</span>
        System
      </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
