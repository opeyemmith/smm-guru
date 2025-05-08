"use client";

import { Eye, Loader2Icon, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiResponse } from "@/@types/response.type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { AddProviderForm } from "./add-provider";
import useProvider from "@/hooks/use-provider";
import { axiosV1AdminInstance } from "@/lib/axios/config";
import { displayError } from "@/lib/error/toast.error";
import PageLoader from "@/components/global/page-loader";

const ListProviders = () => {
  const queryClient = useQueryClient();

  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [keyOfFetchingProvider, setKeyOfFetchingProvider] = useState(-1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProviderId, setCurrentProviderId] = useState<number | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<number | null>(null);

  const { data, isLoading } = useProvider();

  const getKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      if (id <= 0) {
        throw new Error("Invalid provider ID");
      }

      const res = await axiosV1AdminInstance.get<
        ApiResponse<{
          id: number;
          apiKey: string;
          name: string;
          apiUrl: string;
        }>
      >(`/providers/key/${id}`);

      return res.data;
    },
    onSuccess: () => {
      setIsKeyDialogOpen(true);
    },
    onError: (e) => {
      displayError(true, e);
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      if (id <= 0) {
        throw new Error("Invalid provider ID");
      }

      const res = await axiosV1AdminInstance.delete<ApiResponse<null>>(
        `/providers/${id}`
      );

      return res.data;
    },
    onError: (e) => {
      displayError(true, e);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setIsDeleteDialogOpen(false);
      setProviderToDelete(null);

      toast.success(res.name, {
        description: res.message,
      });
    },
  });

  const handleEditClick = (providerId: number) => {
    setCurrentProviderId(providerId);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (providerId: number) => {
    setProviderToDelete(providerId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (providerToDelete) {
      deleteProviderMutation.mutateAsync(providerToDelete);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      {(data?.result || []).map((key) => (
        <div key={key.id}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {key.name}
                <div className="space-x-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={deleteProviderMutation.isPending}
                    onClick={() => handleDeleteClick(key.id as number)}
                  >
                    <Trash className="size-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditClick(key.id as number)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{key.apiUrl}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 w-fit h-fit">
                <p className="text-sm text-muted-foreground">
                  API Key: *****************
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={getKeyMutation.isPending}
                  onClick={() => {
                    setKeyOfFetchingProvider(key.id as number);
                    getKeyMutation.mutateAsync(key.id as number);
                  }}
                >
                  {getKeyMutation.isPending &&
                  key.id === keyOfFetchingProvider ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <Eye className="opacity-80" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Confirmation Dialog for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this provider? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProviderMutation.isPending}
            >
              {deleteProviderMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {currentProviderId !== null && (
        <AddProviderForm
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setIsEditing(false);
              setCurrentProviderId(null);
            }
          }}
          isEditing={isEditing}
          id={currentProviderId}
        />
      )}

      <KeyDisplayDialog
        apiKey={getKeyMutation.data?.result.apiKey as string}
        name={getKeyMutation.data?.result.name as string}
        isKeyDialogOpen={isKeyDialogOpen}
        setIsKeyDialogOpen={setIsKeyDialogOpen}
      />
    </>
  );
};

export const KeyDisplayDialog = ({
  apiKey,
  name,
  isKeyDialogOpen,
  setIsKeyDialogOpen,
}: {
  apiKey: string;
  name: string;
  isKeyDialogOpen: boolean;
  setIsKeyDialogOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <Dialog onOpenChange={setIsKeyDialogOpen} open={isKeyDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div>{apiKey}</div>
      </DialogContent>
    </Dialog>
  );
};

export default ListProviders;
