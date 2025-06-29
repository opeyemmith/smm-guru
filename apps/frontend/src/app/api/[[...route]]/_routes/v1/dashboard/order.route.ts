import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import {
  orderSchema,
  providersSchema,
  servicesSchema,
  transaction,
  wallet,
} from "@smm-guru/database";
import { AES_SECRET_KEY } from "@/lib/env";
import { convertCurrency } from "@/lib/fetch/currency.fetch";
import { CREATED, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from "@smm-guru/utils";
import { decrypt } from "@smm-guru/utils";
import { orderFormSchema } from "@smm-guru/utils";
import { zValidator } from "@hono/zod-validator";
import axios, { AxiosResponse } from "axios";
import { and, eq } from "@smm-guru/database";
import { Hono } from "hono";

const orderRoute = new Hono<HonoAuthSession>();

orderRoute.post("/", zValidator("json", orderFormSchema), async (c) => {
  const body = c.req.valid("json");
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        error: "Authentication required",
        name: "UNAUTHORIZED_ACCESS",
        message: "You must be signed in to create orders",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  const serviceDetails = await db.query.servicesSchema.findFirst({
    where: and(
      eq(servicesSchema.id, Number(body.service)),
      eq(servicesSchema.userId, user.id)
    ),
    columns: {
      providerId: true,
    },
  });

  if (!serviceDetails) {
    return c.json(
      {
        success: false,
        name: "SERVICE_NOT_FOUND",
        message: "Service not found or unauthorized",
        result: null,
      },
      INTERNAL_SERVER_ERROR
    );
  }

  const providerDetails = await db.query.providersSchema.findFirst({
    where: and(
      eq(providersSchema.id, serviceDetails.providerId),
      eq(providersSchema.userId, user.id)
    ),
    columns: {
      id: true,
      apiKey: true,
      apiUrl: true,
      iv: true,
    },
  });

  if (!providerDetails) {
    return c.json(
      {
        success: false,
        name: "PROVIDER_NOT_FOUND",
        message: "Provider not found or unauthorized",
        result: null,
      },
      INTERNAL_SERVER_ERROR
    );
  }

  const decryptedApiKey = decrypt(
    providerDetails.apiKey,
    providerDetails.iv,
    AES_SECRET_KEY
  );

  const serviceInfo = await db.query.servicesSchema.findFirst({
    where: eq(servicesSchema.id, Number(body.service)),
    columns: {
      service: true,
      refill: true,
      profit: true,
      rate: true,
      name: true,
    },
  });

  if (!serviceInfo) {
    return c.json(
      {
        success: false,
        name: "SERVICE_NOT_FOUND",
        message: "Service not found or unauthorized",
        result: null,
      },
      INTERNAL_SERVER_ERROR
    );
  }

  const orderPayload = {
    key: decryptedApiKey,
    action: "add",
    service: serviceInfo.service,
    link: body.link,
    quantity: body.quantity,
  };

  const calcPrice =
    ((serviceInfo.rate + (serviceInfo?.profit || 0)) / 1000) * body.quantity;

  // Start a database transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // 1. Fetch the user's wallet
    const userWallet = await tx.query.wallet.findFirst({
      where: eq(wallet.userId, user.id),
    });

    if (!userWallet) {
      throw new Error("Wallet not found for the user.");
    }

    // 2. Check if the user has sufficient balance
    if (Number(userWallet.balance) < calcPrice) {
      throw new Error("Insufficient balance in wallet.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: AxiosResponse<any, any>;

    try {
      res = await axios.post(providerDetails.apiUrl, orderPayload);
    } catch (error) {
      console.log("Error in creating order: ", error);

      throw error;
    }

    if (res.data.error) {
      return c.json(
        {
          success: false,
          name: "PROVIDER_ERROR",
          message: res.data.error,
          result: null,
        },
        INTERNAL_SERVER_ERROR
      );
    }

    // 3. Deduct the price from the wallet
    const newBalance = Number(userWallet.balance) - calcPrice;

    await tx
      .update(wallet)
      .set({ balance: newBalance.toString() })
      .where(eq(wallet.userId, user.id));

    // 4. Create a transaction record for the debit
    await tx.insert(transaction).values({
      userId: user.id,
      amount: calcPrice.toString(),
      type: "debit",
      status: "completed",
      reference: `ORDER-${res.data.order}`, // You can generate a more unique reference
      fromWalletId: userWallet.id,
    });

    // 5. Create the order record
    await tx.insert(orderSchema).values({
      link: body.link,
      service: Number(body.service),
      userId: user.id,
      price: calcPrice,
      refill: serviceInfo.refill,
      providerOrderId: Number(res.data.order),
      serviceName: serviceInfo.name,
      created_at: new Date(),
    });
  });

  return c.json(
    {
      success: true,
      message: "Order created successfully and price deducted from wallet",
      name: "ORDER_CREATED",
      result: null,
    },
    CREATED
  );
});

orderRoute.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        error: "Authentication required",
        name: "UNAUTHORIZED_ACCESS",
        message: "You must be signed in to view orders",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  const currency = c.req.query("currency") || "USD";

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

  const ordersFromDb = await db.query.orderSchema.findMany({
    where: eq(orderSchema.userId, user.id),
    columns: {
      id: true,
      link: true,
      price: true,
      status: true,
      refill: true,
      serviceName: true,
    },
  });

  if (!ordersFromDb) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch orders",
        name: "ORDER_FETCH_ERROR",
        result: null,
      },
      INTERNAL_SERVER_ERROR
    );
  }

  const convertedOrder = ordersFromDb.map((order) => ({
    ...order,
    price: order.price * currencyRate,
  }));

  return c.json(
    {
      success: true,
      message: "Order fetched successfully",
      name: "ORDER_FETCHED",
      result: { orders: convertedOrder, currency },
    },
    OK
  );
});

export default orderRoute;
