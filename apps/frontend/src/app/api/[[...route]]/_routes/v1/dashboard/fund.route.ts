import { PaytmTransactionResponse } from "@/@types/paytm.type";
import { axiosPaytmInstance } from "@/lib/axios/config";
import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import { transaction, wallet } from "@smm-guru/database";
import { PAYTM_MID } from "@/lib/env";
import { convertCurrency } from "@/lib/fetch/currency.fetch";
import { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "@smm-guru/utils";
import { paytmFormSchema } from "@smm-guru/utils";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "@smm-guru/database";
import { Hono } from "hono";

const fundRoute = new Hono<HonoAuthSession>();

fundRoute.post(
  "/add/paytm-qr",
  zValidator("json", paytmFormSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Authentication required",
          name: "UNAUTHORIZED_ACCESS",
          message: "You must be signed in to add funds",
          result: null,
        },
        UNAUTHORIZED
      );
    }

    const currencyList = await convertCurrency("INR");

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

    const currencyRate = currencyList.data["USD"].value as number;

    // Find user's wallet
    const userWallet = await db.query.wallet.findFirst({
      where: eq(wallet.userId, user.id),
    });

    if (!userWallet) {
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

    const amount = Number(body.amount) * currencyRate;

    const res = await axiosPaytmInstance.post<PaytmTransactionResponse>("/", {
      MID: PAYTM_MID,
      ORDERID: body.transactionId,
    });

    if (!res.data.TXNAMOUNT || !res.data.ORDERID) {
      return c.json(
        {
          success: false,
          name: "INTERNAL_SERVER_ERROR",
          message:
            "An error occurred while processing the transaction. Please try again later.",
          result: null,
        },
        INTERNAL_SERVER_ERROR
      );
    }

    if (res.data.STATUS !== "TXN_SUCCESS") {
      return c.json(
        {
          success: false,
          name: "TRANSACTION_FAILED",
          message: `Transaction failed with status: ${res.data.STATUS}. Please try again.`,
          result: null,
        },
        BAD_REQUEST
      );
    }

    if (Number(res.data.TXNAMOUNT) !== Number(body.amount)) {
      return c.json(
        {
          success: false,
          name: "AMOUNT_MISMATCH",
          message: `Transaction amount mismatch. Expected: ${body.amount}, Received: ${res.data.TXNAMOUNT}`,
          result: null,
        },
        BAD_REQUEST
      );
    }

    const isTranAlreadyDone = await db.query.transaction.findFirst({
      where: sql`${transaction.metadata}->>'paytmReference' = ${res.data.ORDERID}`,
    });

    if (isTranAlreadyDone) {
      return c.json(
        {
          success: false,
          name: "TRANSACTION_ALREADY_PROCESSED",
          message: `The transaction has already been processed with Transaction ID: ${res.data.ORDERID}.`,
          result: null,
        },
        BAD_REQUEST
      );
    }

    // Create a new transaction
    const newTransaction = await db.transaction(async (tx) => {
      const [createdTransaction] = await tx
        .insert(transaction)
        .values({
          amount: amount.toFixed(2),
          type: "deposit",
          status: "completed", // Assuming immediate completion; adjust as needed
          metadata: { paytmReference: body.transactionId }, // Store Paytm transaction ID in metadata
          toWalletId: userWallet.id,
          userId: user.id,
        })
        .returning();

      // Update wallet balance
      await tx
        .update(wallet)
        .set({
          balance: Number(Number(userWallet.balance) + amount).toFixed(2),
        })
        .where(eq(wallet.id, userWallet.id));

      return createdTransaction;
    });

    return c.json(
      {
        success: true,
        message: "Funds added successfully",
        name: "FUNDS_ADDED",
        result: {
          transactionId: newTransaction.id,
          amount: newTransaction.amount,
          newBalance: userWallet.balance + body.amount,
        },
      },
      CREATED
    );
  }
);

export default fundRoute;
