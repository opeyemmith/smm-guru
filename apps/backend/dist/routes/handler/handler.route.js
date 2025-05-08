import { Hono } from "hono";
import { db } from "../../lib/database/db.js";
import { CREATED, decrypt, INTERNAL_SERVER_ERROR, OK } from "@smm-guru/utils";
import { and, eq, orderSchema, providersSchema, servicesSchema, transaction, wallet, } from "@smm-guru/database";
import axios, {} from "axios";
import { AES_SECRET_KEY } from "../../lib/env.js";
const handlerRoute = new Hono();
handlerRoute.post("/", async (c) => {
    const userId = c.get("user-id");
    const body = (await c.req.json());
    if (body.action === "services") {
        const result = await db.query.servicesSchema.findMany({
            orderBy: (services, { asc }) => [asc(services.id)],
            columns: {
                id: true,
                cancel: true,
                category: true,
                currency: true,
                dripfeed: true,
                max: true,
                min: true,
                name: true,
                profit: true,
                rate: true,
                refill: true,
            },
        });
        // Calculate price by adding rate and profit for each service
        const calculatedResult = result.map((service) => ({
            service: service.id,
            cancel: service.cancel,
            category: service.category,
            currency: service.currency,
            dripfeed: service.dripfeed,
            max: service.max,
            min: service.min,
            name: service.name,
            refill: service.refill,
            rate: service.rate + (service.profit || 0),
        }));
        return c.json(calculatedResult, OK);
    }
    if (body.action === "add") {
        const serviceDetails = await db.query.servicesSchema.findFirst({
            where: and(eq(servicesSchema.id, Number(body.service)), eq(servicesSchema.userId, userId)),
            columns: {
                providerId: true,
            },
        });
        if (!serviceDetails) {
            return c.json({
                success: false,
                name: "SERVICE_NOT_FOUND",
                message: "Service not found or unauthorized",
                result: null,
            }, INTERNAL_SERVER_ERROR);
        }
        const providerDetails = await db.query.providersSchema.findFirst({
            where: and(eq(providersSchema.id, serviceDetails.providerId), eq(providersSchema.userId, userId)),
            columns: {
                id: true,
                apiKey: true,
                apiUrl: true,
                iv: true,
            },
        });
        if (!providerDetails) {
            return c.json({
                success: false,
                name: "PROVIDER_NOT_FOUND",
                message: "Provider not found or unauthorized",
                result: null,
            }, INTERNAL_SERVER_ERROR);
        }
        const decryptedApiKey = decrypt(providerDetails.apiKey, providerDetails.iv, AES_SECRET_KEY);
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
            return c.json({
                success: false,
                name: "SERVICE_NOT_FOUND",
                message: "Service not found or unauthorized",
                result: null,
            }, INTERNAL_SERVER_ERROR);
        }
        const orderPayload = {
            key: decryptedApiKey,
            action: "add",
            service: serviceInfo.service,
            link: body.link,
            quantity: body.quantity,
        };
        const calcPrice = ((serviceInfo.rate + (serviceInfo?.profit || 0)) / 1000) * body.quantity;
        // Start a database transaction to ensure atomicity
        const txnResponse = await db.transaction(async (tx) => {
            // 1. Fetch the user's wallet
            const userWallet = await tx.query.wallet.findFirst({
                where: eq(wallet.userId, userId),
            });
            if (!userWallet) {
                throw new Error("Wallet not found for the user.");
            }
            // 2. Check if the user has sufficient balance
            if (Number(userWallet.balance) < calcPrice) {
                throw new Error("Insufficient balance in wallet.");
            }
            let res;
            try {
                res = await axios.post(providerDetails.apiUrl, orderPayload);
            }
            catch (error) {
                console.log("Error in creating order: ", error);
                throw error;
            }
            if (res.data.error) {
                throw new Error(res.data.error);
            }
            // 3. Deduct the price from the wallet
            const newBalance = Number(userWallet.balance) - calcPrice;
            await tx
                .update(wallet)
                .set({ balance: newBalance.toString() })
                .where(eq(wallet.userId, userId));
            // 4. Create a transaction record for the debit
            await tx.insert(transaction).values({
                userId: userId,
                amount: calcPrice.toString(),
                type: "debit",
                status: "completed",
                reference: `ORDER-${res.data.order}`, // You can generate a more unique reference
                fromWalletId: userWallet.id,
            });
            // 5. Create the order record
            const order = await tx
                .insert(orderSchema)
                .values({
                link: body.link,
                service: Number(body.service),
                userId: userId,
                price: calcPrice,
                refill: serviceInfo.refill,
                providerOrderId: Number(res.data.order),
                serviceName: serviceInfo.name,
                created_at: new Date(),
            })
                .returning();
            return order;
        });
        return c.json({
            order: txnResponse[0].id,
        }, CREATED);
    }
    if (body.action === "status") {
        const orderRes = await db.query.orderSchema.findFirst({
            where: and(eq(orderSchema.userId, userId), eq(orderSchema.id, body.order)),
            columns: {
                price: true,
                status: true,
                currency: true,
            },
        });
        if (!orderRes) {
            return c.json({
                success: false,
                name: "ORDER_NOT_FOUND",
                message: "Order not found or unauthorized",
                result: null,
            }, INTERNAL_SERVER_ERROR);
        }
        const requiredOrderResponse = {
            charge: orderRes.price,
            status: orderRes.status,
            currency: orderRes.currency,
        };
        return c.json(requiredOrderResponse, OK);
    }
    if (body.action === "balance") {
        const walletRes = await db.query.wallet.findFirst({
            where: eq(wallet.userId, userId),
            columns: {
                balance: true,
                currency: true,
            },
        });
        if (!walletRes) {
            return c.json({
                success: false,
                name: "WALLET_NOT_FOUND",
                message: "Wallet not found or unauthorized",
                result: null,
            }, INTERNAL_SERVER_ERROR);
        }
        return c.json(walletRes, OK);
    }
});
export default handlerRoute;
