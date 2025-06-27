"use client";

import { ApiResponse } from "@/@types/response.type";
import { TServices } from "@smm-guru/database";
import { servicesColumns } from "@/app/(admin)/_components/services-column";
import DataTable from "@/components/global/data-table";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowDownUp, 
  CircleAlert, 
  Download, 
  Filter, 
  Loader2Icon, 
  RefreshCw,
  Search,
  SlidersHorizontal 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useGetCategory from "@/hooks/use-get-category";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const ServiceList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  
  // Get categories
  const { data: categoriesData } = useGetCategory();
  const categories = categoriesData?.result || [];
  
  // Get services
  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res =
        await axiosV1AdminInstance.get<ApiResponse<TServices[]>>("/services");

      return res.data;
    },
  });

  displayError(isError, error);
  
  // Filter and sort data
  let processedData = data?.result || [];
  
  // Apply search filter
  if (searchQuery) {
    processedData = processedData.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      service.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply category filter
  if (selectedCategories.length > 0) {
    processedData = processedData.filter(service => 
      selectedCategories.includes(service.category)
    );
  }
  
  // Apply feature filters
  if (selectedFeatures.length > 0) {
    processedData = processedData.filter(service => {
      return selectedFeatures.every(feature => {
        switch (feature) {
          case 'refill': return service.refill;
          case 'dripfeed': return service.dripfeed;
          case 'cancel': return service.cancel;
          default: return true;
        }
      });
    });
  }
  
  // Apply sorting
  if (sortField && sortOrder) {
    processedData = [...processedData].sort((a, b) => {
      let valueA = a[sortField as keyof TServices];
      let valueB = b[sortField as keyof TServices];
      
      // Handle numeric values
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Handle string values
      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();
      
      if (sortOrder === 'asc') {
        return stringA.localeCompare(stringB);
      } else {
        return stringB.localeCompare(stringA);
      }
    });
  }
  
  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Toggle feature selection
  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedFeatures([]);
    setSortOrder(null);
    setSortField(null);
    setSearchQuery("");
  };
  
  // Apply a sort
  const applySort = (field: string) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : (prev === 'desc' ? null : 'asc'));
      if (sortOrder === 'desc') {
        setSortField(null);
      }
    } else {
      // New field, set to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Count active filters
  const activeFilterCount = selectedCategories.length + selectedFeatures.length + (sortField ? 1 : 0);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        {isError && (
          <div className="flex items-center justify-center p-6 text-destructive gap-2">
            <CircleAlert className="h-4 w-4" />
            <p>Error loading services. Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2Icon className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading services...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px]">
                    <DropdownMenuLabel>Filter Services</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <h4 className="text-sm font-medium mb-2">Categories</h4>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`category-${category.id}`} 
                              checked={selectedCategories.includes(category.name)}
                              onCheckedChange={() => toggleCategory(category.name)}
                            />
                            <Label 
                              htmlFor={`category-${category.id}`}
                              className="text-sm"
                            >
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>

                      <DropdownMenuSeparator />
                      
                      <h4 className="text-sm font-medium mb-2 mt-2">Features</h4>
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="feature-refill"
                            checked={selectedFeatures.includes('refill')}
                            onCheckedChange={() => toggleFeature('refill')}
                          />
                          <Label htmlFor="feature-refill" className="text-sm">Refill Support</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="feature-dripfeed"
                            checked={selectedFeatures.includes('dripfeed')}
                            onCheckedChange={() => toggleFeature('dripfeed')}
                          />
                          <Label htmlFor="feature-dripfeed" className="text-sm">Drip Feed</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="feature-cancel"
                            checked={selectedFeatures.includes('cancel')}
                            onCheckedChange={() => toggleFeature('cancel')}
                          />
                          <Label htmlFor="feature-cancel" className="text-sm">Cancellation</Label>
                        </div>
                      </div>

                      <DropdownMenuSeparator />
                      
                      <h4 className="text-sm font-medium mb-2 mt-2">Sort By</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={sortField === 'name' ? 'secondary' : 'outline'} 
                          size="sm"
                          className="w-full"
                          onClick={() => applySort('name')}
                        >
                          Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                          variant={sortField === 'rate' ? 'secondary' : 'outline'} 
                          size="sm"
                          className="w-full"
                          onClick={() => applySort('rate')}
                        >
                          Rate {sortField === 'rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                          variant={sortField === 'profit' ? 'secondary' : 'outline'} 
                          size="sm"
                          className="w-full"
                          onClick={() => applySort('profit')}
                        >
                          Profit {sortField === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                          variant={sortField === 'category' ? 'secondary' : 'outline'} 
                          size="sm"
                          className="w-full"
                          onClick={() => applySort('category')}
                        >
                          Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </div>
                    </div>

                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
                        Reset Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Service Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>Refresh</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export CSV</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Filter indicators */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedCategories.map(category => (
                  <Badge variant="secondary" key={category} className="flex items-center gap-1">
                    <span>Category: {category}</span>
                    <button 
                      className="ml-1 hover:bg-muted rounded-full"
                      onClick={() => toggleCategory(category)}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                
                {selectedFeatures.map(feature => (
                  <Badge variant="secondary" key={feature} className="flex items-center gap-1">
                    <span>{feature.charAt(0).toUpperCase() + feature.slice(1)}</span>
                    <button 
                      className="ml-1 hover:bg-muted rounded-full"
                      onClick={() => toggleFeature(feature)}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
                
                {sortField && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <span>Sort: {sortField} {sortOrder === 'asc' ? '↑' : '↓'}</span>
                    <button 
                      className="ml-1 hover:bg-muted rounded-full"
                      onClick={() => {
                        setSortField(null);
                        setSortOrder(null);
                      }}
                    >
                      ✕
                    </button>
                  </Badge>
                )}
                
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7">
                  Clear All
                </Button>
              </div>
            )}
            
            {/* Results summary */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{processedData.length}</span> of {data?.result?.length || 0} services
                </p>
              </div>
            </div>
            
            <DataTable
              columns={servicesColumns}
              data={processedData}
              placeholder="id or name or category"
              searchKey="name"
              deleteEndpoint="none"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceList;
