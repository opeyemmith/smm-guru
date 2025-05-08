import { Hono } from "hono";
import { AES_SECRET_KEY, CRON_JOB_SEC_KEY } from "../../lib/env.js";
import { db } from "../../lib/database/db.js";
import { decrypt, OK } from "@smm-guru/utils";
import { eq, orderSchema } from "@smm-guru/database";
import axios from "axios";

const orderCronRoute = new Hono();

orderCronRoute.get("/:sec-key", async (c) => {
  const secKey = c.req.param("sec-key");

  if (secKey !== CRON_JOB_SEC_KEY) {
    return c.json({
      success: false,
      name: "UNAUTHORIZED",
      message: "Unauthorized",
      result: null,
    });
  }

  const providers = await db.query.providersSchema.findMany({
    columns: {
      id: true,
      name: true,
      apiKey: true,
      apiUrl: true,
      iv: true,
    },
  });

  if (!providers) {
    return c.json({
      success: false,
      name: "PROVIDERS_NOT_FOUND",
      message: "Providers not found",
      result: null,
    });
  }

  Promise.all([
    providers.map(async (provider) => {
      const decryptedApiKey = decrypt(
        provider.apiKey,
        provider.iv,
        AES_SECRET_KEY
      );

      const txn = await db.transaction(async (tx) => {
        const orders = await tx.query.orderSchema.findMany({
          where: eq(orderSchema.status, "PENDING"),
        });

        if (!orders) throw new Error("Orders not found");

        Promise.all([
          orders.map(async (order) => {
            const orderPayload = {
              key: decryptedApiKey,
              action: "status",
              order: order.providerOrderId,
            };

            const res = await axios.post(provider.apiUrl, orderPayload);

            if ((res.data.status as string).toLowerCase() === "completed") {
              tx.update(orderSchema).set({ status: "COMPLETED" });
            }
          }),
        ]);
      });
    }),
  ]);

  return c.json({}, OK);
});

export default orderCronRoute;
