import { axiosCurrencyInstance } from "../axios/config";
import { redisClient } from "../oiredis/oiredis.client";

export const convertCurrency = async (currency = "USD") => {
  let infoFromRedis;
  const redisKey = `currency:${currency}`;

  try {
    const currencyData = await redisClient.get(redisKey);

    if (currencyData) {
      infoFromRedis = JSON.parse(currencyData);
    } else {
      const res = await axiosCurrencyInstance.get("/latest", {
        params: {
          base_currency: currency,
        },
      });

      await redisClient.set(redisKey, JSON.stringify(res.data), "EX", 90000);

      infoFromRedis = res.data;

      return JSON.parse(infoFromRedis);
    }
  } catch (error) {
    console.error("Error fetching or processing currency data:", error);
    throw error;
  }

  return infoFromRedis;
};
