import { axiosCurrencyInstance } from "../axios/config";
import { redisClient } from "../oiredis/oiredis.client";
import { AxiosError } from "axios";

// Default currency rates as fallback
const DEFAULT_CURRENCY_DATA = {
  meta: {
    last_updated_at: new Date().toISOString(),
  },
  data: {
    USD: { code: "USD", value: 1 },
    EUR: { code: "EUR", value: 0.93 },
    GBP: { code: "GBP", value: 0.79 },
    INR: { code: "INR", value: 83.38 },
    AUD: { code: "AUD", value: 1.53 },
    CAD: { code: "CAD", value: 1.38 },
    JPY: { code: "JPY", value: 157.84 },
    CNY: { code: "CNY", value: 7.25 },
  }
};

export const convertCurrency = async (currency = "USD") => {
  let infoFromRedis;
  const redisKey = `currency:${currency}`;

  try {
    // Try to get from Redis first
    const currencyData = await redisClient.get(redisKey);

    if (currencyData) {
      infoFromRedis = JSON.parse(currencyData);
      console.log("Using cached currency data from Redis");
      return infoFromRedis;
    } 
    
    // If not in Redis, try to fetch from API
    try {
      const res = await axiosCurrencyInstance.get("/latest", {
        params: {
          base_currency: currency,
        },
      });

      // Cache successful response in Redis
      await redisClient.set(redisKey, JSON.stringify(res.data), "EX", 86400); // Cache for 24 hours
      console.log("Fetched fresh currency data from API");
      
      return res.data;
    } catch (apiError) {
      const error = apiError as Error | AxiosError;
      console.error("Error fetching from currency API:", error.message);
      
      // Use default data as fallback
      console.log("Using fallback currency data");
      const fallbackData = { ...DEFAULT_CURRENCY_DATA };
      
      // Cache fallback data with shorter expiry
      await redisClient.set(redisKey, JSON.stringify(fallbackData), "EX", 3600); // Cache for 1 hour
      
      return fallbackData;
    }
  } catch (error) {
    console.error("Critical error in currency conversion:", error);
    return DEFAULT_CURRENCY_DATA; // Return fallback data in case of any error
  }
};
