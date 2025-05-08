import { ApiResponse } from "@/@types/response.type";
import { axiosV1DashboardInstance } from "../axios/config";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { IOrders } from "@/app/(dashboard)/dashboard/orders/_components/order-list";

export const getAllOrder = async (
  currency: string,
  cookies?: ReadonlyRequestCookies
) => {
  const cookieHeader = cookies?.toString();

  const res = await axiosV1DashboardInstance.get<
    ApiResponse<{ orders: IOrders[]; currency: string }>
  >("/orders", {
    headers: {
      Cookie: cookieHeader || "",
    },
    params: {
      currency,
    },
  });

  return res.data.result;
};
