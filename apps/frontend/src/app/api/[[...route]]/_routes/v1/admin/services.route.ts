import { TServicesFromProvider } from "@smm-guru/database";
import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import { servicesCatSchema, servicesSchema } from "@smm-guru/database";
import { BAD_REQUEST, CREATED } from "@smm-guru/utils";
import { serviceFormSchema } from "@smm-guru/utils";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "@smm-guru/database";
import { Hono } from "hono";

const serviceRoute = new Hono<HonoAuthSession>();

serviceRoute.post("/", async (c) => {
  const body = (await c.req.json()) as TServicesFromProvider;
  const user = c.get("user")!;
  const providerId = Number(c.req.query("provider-id"));

  if (!providerId) {
    return c.json(
      {
        success: false,
        name: "PROVIDER_ID_REQUIRED",
        message: "Provider ID is required",
        result: null,
      },
      BAD_REQUEST
    );
  }

  const isServiceAvail = await db.query.servicesSchema.findFirst({
    where: and(eq(servicesSchema.service, body.service)),
  });

  if (isServiceAvail) {
    return c.json(
      {
        success: false,
        name: "SERVICE_ALREADY_EXIST",
        message: "Service already exist",
        result: null,
      },
      409
    );
  }

  const uncategorizedCategoryId = await db.query.servicesCatSchema.findFirst({
    where: eq(servicesCatSchema.name, "Uncategorized"),
    columns: {
      id: true,
    },
  });

  if (!uncategorizedCategoryId) {
    return c.json(
      {
        success: false,
        name: "UNCATEGORIZED_CATEGORY_NOT_FOUND",
        message: "Default category not found in the database",
        result: null,
      },
      BAD_REQUEST
    );
  }

  await db.insert(servicesSchema).values({
    ...body,
    userId: user?.id,
    category: "Uncategorized",
    categoryId: uncategorizedCategoryId.id,
    providerId: providerId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return c.json(
    {
      success: true,
      name: "SERVICE_ADDED",
      message: "Service added successfully",
      result: null,
    },
    CREATED
  );
});

serviceRoute.patch(
  "/:service-id",
  zValidator("json", serviceFormSchema),
  async (c) => {
    const body = c.req.valid("json");
    const serviceId = Number(c.req.param("service-id"));
    const categoryInfo = JSON.parse(body.category) as {
      name: string;
      id: number;
    };

    await db
      .update(servicesSchema)
      .set({
        name: body.name,
        profit: body.profit,
        categoryId: categoryInfo.id,
        category: categoryInfo.name,
      })
      .where(and(eq(servicesSchema.id, serviceId)));

    return c.json(
      {
        success: true,
        name: "SERVICE_ADDED",
        message: "Service added successfully",
        result: null,
      },
      CREATED
    );
  }
);

serviceRoute.get("/", async (c) => {
  const services = await db.query.servicesSchema.findMany();

  return c.json({
    success: true,
    message: "Services fetched successfully",
    name: "SERVICES_FETCHED",
    result: services,
  });
});

serviceRoute.delete("/:service-id", async (c) => {
  const serviceId = Number(c.req.param("service-id"));

  const services = await db
    .delete(servicesSchema)
    .where(and(eq(servicesSchema.id, serviceId)));

  return c.json({
    success: true,
    message: "Services deleted successfully",
    name: "SERVICES_DELETED",
    result: services,
  });
});

export default serviceRoute;
