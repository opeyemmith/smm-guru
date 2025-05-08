import { Hono } from "hono";
import { db } from "../../lib/database/db.js";
const handlerRoute = new Hono();
handlerRoute.post("/", async (c) => {
    const body = (await c.req.json());
    if (body.action === "services") {
        const result = await db.query.servicesCatSchema.findMany({
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
                price: (Number(rate) + Number(profit))
            })),
        }));
    }
});
export default handlerRoute;
