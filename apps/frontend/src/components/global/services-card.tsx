"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Edit,
  Filter,
  PlusCircle,
  Trash2,
  Search,
  ShoppingCart,
  Tag,
  Droplets,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export type TService = {
  id: number;
  dripfeed: boolean;
  cancel: boolean;
  max: number;
  min: number;
  name: string;
  price: number;
  refill: boolean;
  type: string;
};

export type TCategory = {
  id: number;
  name: string;
  services: TService[];
};

type FilterType = "all" | "refill" | "dripfeed";
type SortType = "name" | "price" | "recent";

export function ServicesCard({
  categories,
  mode,
  currency,
}: {
  mode: "display" | "add";
  categories: TCategory[];
  currency: string;
}) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("name");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const getFilteredSortedServices = () => {
    const filtered: TCategory[] = categories.map((cat) => {
      const matchedServices = cat.services.filter((service) => {
        const matchesSearch =
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.id.toString().includes(searchTerm) ||
          cat.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
          filter === "all"
            ? true
            : filter === "refill"
              ? service.refill
              : service.dripfeed;

        return matchesSearch && matchesFilter;
      });

      const sortedServices = [...matchedServices];
      switch (sort) {
        case "name":
          sortedServices.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "price":
          sortedServices.sort((a, b) => a.price - b.price);
          break;
        case "recent":
          sortedServices.sort((a, b) => b.id - a.id);
          break;
      }

      return {
        ...cat,
        services: sortedServices,
      };
    });

    return filtered.filter((cat) => cat.services.length > 0);
  };

  const displayedCategories = getFilteredSortedServices();

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Services Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and purchase premium social media services
          </p>
        </div>
        {mode === "add" && (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-300 hover:scale-105">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between bg-card p-4 rounded-lg shadow-sm border">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search by name, ID or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 h-10 bg-background/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex gap-3 self-end md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 border-dashed"
              >
                <Filter className="mr-2 h-4 w-4 text-primary" />
                {filter === "all"
                  ? "All Services"
                  : filter === "refill"
                    ? "With Refill"
                    : "With Dripfeed"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-primary/10 text-primary" : ""}
              >
                <Tag className="mr-2 h-4 w-4" />
                All Services
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilter("refill")}
                className={
                  filter === "refill" ? "bg-primary/10 text-primary" : ""
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                With Refill
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilter("dripfeed")}
                className={
                  filter === "dripfeed" ? "bg-primary/10 text-primary" : ""
                }
              >
                <Droplets className="mr-2 h-4 w-4" />
                With Dripfeed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 border-dashed"
              >
                <ArrowUpDown className="mr-2 h-4 w-4 text-primary" />
                Sort:{" "}
                {sort === "name"
                  ? "Name"
                  : sort === "price"
                    ? "Price"
                    : "Recent"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setSort("name")}
                className={sort === "name" ? "bg-primary/10 text-primary" : ""}
              >
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSort("price")}
                className={sort === "price" ? "bg-primary/10 text-primary" : ""}
              >
                Rate (Low-High)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSort("recent")}
                className={
                  sort === "recent" ? "bg-primary/10 text-primary" : ""
                }
              >
                Recently Added
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 pb-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-all"
          onClick={() => setActiveCategory(null)}
        >
          All Categories
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-all whitespace-nowrap"
            onClick={() =>
              setActiveCategory(
                activeCategory === category.id ? null : category.id
              )
            }
          >
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Services Grid */}
      <div className="h-[calc(100vh-320px)] p-1 pr-2">
        {displayedCategories
          .filter((cat) => activeCategory === null || cat.id === activeCategory)
          .map((category) => (
            <div key={category.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <Badge variant="outline" className="ml-2">
                  {category.services.length} services
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.services.map((service) => (
                  <Card
                    key={service.id}
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full group relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>

                    <CardHeader className="p-5 pb-3 space-y-0 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <Badge
                          variant={
                            service.type === "Default" ? "outline" : "secondary"
                          }
                          className="mb-2 shadow-sm"
                        >
                          {service.type}
                        </Badge>

                        <div className="flex gap-1">
                          {mode === "add" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              className="text-primary hover:text-primary-foreground hover:bg-primary text-sm px-3 py-1 transition-colors duration-300"
                            >
                              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                              Buy
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle
                        className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors"
                        title={service.name}
                      >
                        {service.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {service.id}
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 pt-3">
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="bg-muted/20 p-2 rounded-md">
                          <p className="text-muted-foreground text-xs">Rate</p>
                          <p className="font-semibold text-primary">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency,
                            }).format(service.price)}
                          </p>
                        </div>
                        <div className="bg-muted/20 p-2 rounded-md">
                          <p className="text-muted-foreground text-xs">
                            Min-Max
                          </p>
                          <p className="font-semibold">
                            {service.min.toLocaleString()}-
                            {service.max.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`dripfeed-${service.id}`}
                              checked={service.dripfeed}
                              className="data-[state=checked]:bg-primary"
                            />
                            <label
                              htmlFor={`dripfeed-${service.id}`}
                              className="text-xs font-medium flex items-center"
                            >
                              <Droplets className="h-3 w-3 mr-1" />
                              Dripfeed
                            </label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`refill-${service.id}`}
                              checked={service.refill}
                              className="data-[state=checked]:bg-primary"
                            />
                            <label
                              htmlFor={`refill-${service.id}`}
                              className="text-xs font-medium flex items-center"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refill
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`cancel-${service.id}`}
                            checked={service.cancel}
                            className="data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`cancel-${service.id}`}
                            className="text-xs font-medium flex items-center"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

        {displayedCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-muted/30 p-8 rounded-lg">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter settings
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setActiveCategory(null);
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
