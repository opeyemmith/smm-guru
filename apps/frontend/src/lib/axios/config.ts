import axios from "axios";
import { API_SERVER_ENDPOINT, CURRENCY_API_KEY } from "../env";

export const axiosV1DashboardInstance = axios.create({
  baseURL: `/api/v1/dashboard`, // Backend server URL
  withCredentials: true, // To send cookies with requests
});

export const axiosV1AdminInstance = axios.create({
  baseURL: `/api/v1/admin`, // Backend server URL
  withCredentials: true, // To send cookies with requests
});

export const axiosV1BaseInstance = axios.create({
  baseURL: `/api/v1/`, // Backend server URL
  withCredentials: true, // To send cookies with requests
});

export const axiosIpTrackInstance = axios.create({
  baseURL: "http://ip-api.com",
});

export const axiosPaytmInstance = axios.create({
  baseURL: "https://securegw.paytm.in/merchant-status/getTxnStatus",
});

export const axiosCurrencyInstance = axios.create({
  baseURL: "https://api.currencyapi.com/v3/",
  params: {
    value: 1,
  },
  headers: {
    apikey: CURRENCY_API_KEY,
  },
});

export const axiosMyApiServerInstance = axios.create({
  baseURL: API_SERVER_ENDPOINT, // Backend server URL
  withCredentials: true, // To send cookies with requests
});
