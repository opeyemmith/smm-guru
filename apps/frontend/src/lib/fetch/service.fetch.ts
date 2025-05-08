import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { axiosV1BaseInstance } from "../axios/config";
import { ApiResponse } from "@/@types/response.type";
import { TCategory } from "@/components/global/services-card";

export const getServicesWithCat = async (
  currency: string,
  cookies?: ReadonlyRequestCookies
) => {
  const cookieHeader = cookies?.toString();

  const res = await axiosV1BaseInstance.get<
    ApiResponse<{ services: TCategory[]; currency: string }>
  >("/services", {
    headers: {
      Cookie: cookieHeader || "",
    },
    params: {
      currency,
    },
  });

  return res.data.result;
};
