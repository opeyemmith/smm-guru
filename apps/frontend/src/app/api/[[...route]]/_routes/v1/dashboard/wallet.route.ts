import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import { wallet } from "@smm-guru/database";
import { convertCurrency } from "@/lib/fetch/currency.fetch";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "@smm-guru/utils";
import { eq } from "@smm-guru/database";
import { Hono } from "hono";

const walletRoute = new Hono<HonoAuthSession>();

walletRoute.get("/", async (c) => {
  const user = c.get("user")!;
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

  const userBlc = await db.query.wallet.findFirst({
    where: eq(wallet.userId, user.id),
    columns: {
      balance: true,
    },
  });

  if (!userBlc) {
    return c.json(
      {
        success: false,
        name: "WALLET_NOT_FOUND",
        message:
          "User wallet not found. Please try signing out and signing in again.",
        result: null,
      },
      BAD_REQUEST
    );
  }

  return c.json({
    success: true,
    message: "User balance fetched successfully",
    name: "USER_BALANCE",
    result: {
      balance: (Number(userBlc.balance) * currencyRate).toFixed(2),
      currency,
    },
  });
});

export default walletRoute;
