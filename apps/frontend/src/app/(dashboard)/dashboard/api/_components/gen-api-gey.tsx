"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Copy, Edit, Key, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { axiosMyApiServerInstance } from "@/lib/axios/config";
import {
  createApiKeySchema,
  TCreateApiKey,
  TUpdateApiKey,
  updateApiKeySchema,
} from "@smm-guru/utils";
import { ApiResponse } from "@/@types/response.type";
import { apikey as apikeySchema } from "@smm-guru/database";
import { format } from "date-fns";
import { displayError } from "@/lib/error/toast.error";
import { API_SERVER_ENDPOINT } from "@/lib/env";

// API key interface
type ApiKey = typeof apikeySchema.$inferInsert;

const fetchApiKeys = async () => {
  const res = await axiosMyApiServerInstance.get<ApiResponse<ApiKey[]>>(
    "/v2/api-key"
  );

  return res.data;
};

const createApiKey = async (
  data: TCreateApiKey
): Promise<ApiResponse<null>> => {
  const res = await axiosMyApiServerInstance.post<ApiResponse<null>>(
    "/v2/api-key",
    data
  );

  return res.data;
};

const updateApiKey = async (data: TUpdateApiKey) => {
  const res = await axiosMyApiServerInstance.patch<ApiResponse<null>>(
    "/v2/api-key",
    data
  );

  return res.data;
};

const deleteApiKey = async (id: string): Promise<ApiResponse<null>> => {
  const res = await axiosMyApiServerInstance.delete<ApiResponse<null>>(
    `/v2/api-key/${id}`
  );

  return res.data;
};

export function ApiKeyManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);

  const queryClient = useQueryClient();

  // Fetch API keys
  const { data, isLoading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: fetchApiKeys,
  });

  const apiKeys = data?.result || [];

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setIsCreateDialogOpen(false);
      toast(res.name, {
        description: res.message,
      });
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  // Update API key mutation
  const updateMutation = useMutation({
    mutationFn: updateApiKey,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setIsEditDialogOpen(false);
      toast(res.name, {
        description: res.message,
      });
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setIsDeleteDialogOpen(false);
      toast(res.name, {
        description: res.message,
      });
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  // Create form
  const createForm = useForm<TCreateApiKey>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
    },
  });

  // Update form
  const updateForm = useForm<TUpdateApiKey>({
    resolver: zodResolver(updateApiKeySchema),
    defaultValues: {
      id: "",
      name: "",
    },
  });

  // Handle create form submission
  function onCreateSubmit(values: z.infer<typeof createApiKeySchema>) {
    createMutation.mutate(values);
  }

  // Handle update form submission
  function onUpdateSubmit(values: z.infer<typeof updateApiKeySchema>) {
    updateMutation.mutate(values);
  }

  // Handle edit button click
  const handleEditClick = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    updateForm.reset({
      id: apiKey.id || "",
      name: apiKey.name || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setIsDeleteDialogOpen(true);
  };

  // Handle copy API key
  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast("API Key Copied", {
      description: "API key has been copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            API Key Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, edit, and manage your API keys
          </p>
        </div>
      </div>

      {/* API URL Section */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>API URL</CardTitle>
          <CardDescription>Use this URL for all API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              readOnly
              value={`${API_SERVER_ENDPOINT}/v2/handler`}
              className="font-mono text-sm bg-muted/30"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleCopyApiKey(`${API_SERVER_ENDPOINT}/v2/handler`)
              }
              className="sm:w-auto w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for authentication
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Give your API key a name to help you identify it later.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Production API Key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a descriptive name for your API key.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Key"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Key className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No API keys found. Generate your first key to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-2 mb-4 md:mb-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {apiKey?.prefix?.startsWith("smm_guru_live")
                          ? "Production"
                          : "Development"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted/50 p-1 rounded">
                        {apiKey.key.substring(0, 10)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyApiKey(apiKey.key)}
                        className="h-7 px-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span>
                        Updated At:{" "}
                        {format(
                          apiKey.updatedAt || new Date(),
                          "yyyy-MMde-dd HH:mm"
                        )}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Last used:{" "}
                        {format(
                          apiKey.lastRequest || new Date(),
                          "yyyy-MM-dd HH:mm"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(apiKey)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyApiKey(apiKey.key)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy API Key
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(apiKey)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the name of your API key.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="font-medium">{selectedApiKey?.name}</p>
            <code className="text-sm font-mono">
              {selectedApiKey?.key.substring(0, 10)}...
            </code>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                selectedApiKey && deleteMutation.mutate(selectedApiKey.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete API Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
