import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import { convertCurrency } from "@/lib/fetch/currency.fetch";
import { INTERNAL_SERVER_ERROR, OK } from "@smm-guru/utils";
import { Hono } from "hono";

const publicServiceRoute = new Hono<HonoAuthSession>();

publicServiceRoute.get("/", async (c) => {
  const currency = c.req.query("currency")!;

  const currencyList = await convertCurrency();

  if (!currencyList) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch currency rates",
        name: "CURRENCY_FETCH_ERROR",
      },
      INTERNAL_SERVER_ERROR
    );
  }

  const currencyRate = currencyList.data[currency].value as number;

  const result = await db.query.servicesCatSchema.findMany({
    where: (servicesCat, { ne }) => ne(servicesCat.name, "Uncategorized"),
    columns: {
      id: true,
      name: true,
    },
    with: {
      services: {
        orderBy: (services, { asc }) => [asc(services.id)],
        columns: {
          id: true,
          dripfeed: true,
          cancel: true,
          max: true,
          min: true,
          name: true,
          rate: true,
          profit: true,
          refill: true,
          type: true,
        },
      },
    },
  });

  // Calculate price by adding rate and profit for each service
  const calculatedResult = result.map((category) => ({
    ...category,
    services: category.services.map(({ rate, profit, ...service }) => ({
      ...service,
      price: ((Number(rate) + Number(profit)) * currencyRate).toFixed(2),
    })),
  }));

  return c.json(
    {
      success: true,
      message: "Services fetched successfully",
      name: "SERVICES_FETCHED",
      result: { services: calculatedResult, currency },
    },
    OK
  );
});

export default publicServiceRoute;
