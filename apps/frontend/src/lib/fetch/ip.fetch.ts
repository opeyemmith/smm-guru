import { LocationData } from "@/@types/location.type";
import { axiosIpTrackInstance } from "../axios/config";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "../localstorage/functions";

/**
 * Retrieves location information based on the client's IP address.
 *
 * @remarks
 * This function should only be used on the client side and avoided in server-side operations.
 * It first checks localStorage for cached location data before making an API request.
 *
 * @returns Promise resolving to an object containing:
 * - success: boolean indicating if the operation was successful
 * - info: LocationData object if successful, error message string if failed
 *
 * @example
 * ```typescript
 * // Client-side usage only
 * const { success, info } = await getLocationByIp();
 * if (success) {
 *   const locationData = info as LocationData;
 *   console.log(locationData);
 * }
 * ```
 *
 * @throws Error if attempted to run on server-side
 * @public
 */
export const getLocationByIp = async (): Promise<{
  success: boolean;
  info: LocationData | null;
}> => {
  if (typeof window === "undefined") {
    throw new Error(
      "Fetching location from IP is not allowed on the server side"
    );
  }

  try {
    const locationFromLocal = getFromLocalStorage("ip-info");

    if (locationFromLocal) {
      return { success: true, info: JSON.parse(locationFromLocal) };
    }

    const res = await axiosIpTrackInstance.get("/json");

    setToLocalStorage("ip-info", JSON.stringify(res.data));

    return { success: true, info: res.data };
  } catch (error) {
    console.log("Error in Getting Location by IP: ", error);

    return { success: false, info: null };
  }
};
