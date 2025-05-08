import { AxiosError } from "axios";
import { toast } from "sonner";

export const displayError = (isError: boolean, error: Error | null) => {
  if (isError) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data?.name, {
        description: error.response?.data?.message,
      });
    } else {
      toast.error(error?.name, {
        description: error?.message,
      });
    }
  }
};
