import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { db } from "@/lib/database/db";
import { servicesCatSchema } from "@smm-guru/database";
import { CREATED, INTERNAL_SERVER_ERROR, OK } from "@smm-guru/utils";
import { categoryFormSchema } from "@smm-guru/utils";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "@smm-guru/database";
import { Hono } from "hono";

const categoriesRoute = new Hono<HonoAuthSession>();

categoriesRoute.get("/", async (c) => {
  const results = await db.query.servicesCatSchema.findMany();

  if (!results) {
    return c.json(
      {
        success: false,
        name: "SERVER_ERROR",
        message: "Failed to fetch categories",
        result: null,
      },
      INTERNAL_SERVER_ERROR
    );
  }

  return c.json({
    success: true,
    name: "CATEGORIES_FETCHED",
    message: "Categories fetched successfully",
    result: results,
  });
});

categoriesRoute.patch(
  "/:category-id",
  zValidator("json", categoryFormSchema),
  async (c) => {
    const categoryId = Number(c.req.param("category-id"));
    const body = c.req.valid("json");

    await db
      .update(servicesCatSchema)
      .set({
        name: body.name,
      })
      .where(and(eq(servicesCatSchema.id, categoryId)));

    return c.json(
      {
        success: true,
        name: "CATEGORY_UPDATED",
        message: "Category updated successfully",
        result: null,
      },
      OK
    );
  }
);

categoriesRoute.post("/", zValidator("json", categoryFormSchema), async (c) => {
  const body = c.req.valid("json")!;
  const user = c.get("user")!;

  const isCateAvail = await db.query.servicesCatSchema.findFirst({
    where: and(eq(servicesCatSchema.name, body.name)),
  });

  if (isCateAvail) {
    return c.json(
      {
        success: false,
        name: "CATEGORY_EXISTS",
        message: "Category with this name already exists",
        result: null,
      },
      OK
    );
  }

  await db.insert(servicesCatSchema).values({
    ...body,
    userId: user.id,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return c.json(
    {
      success: true,
      name: "CATEGORY_ADDED",
      message: "Category added successfully",
      result: null,
    },
    CREATED
  );
});

categoriesRoute.delete("/:category-id", async (c) => {
  const categoryId = Number(c.req.param("category-id"));

  await db
    .delete(servicesCatSchema)
    .where(and(eq(servicesCatSchema.id, categoryId)));

  return c.json(
    {
      success: true,
      name: "CATEGORY_DELETED",
      message: "Category deleted successfully",
      result: null,
    },
    OK
  );
});

export default categoriesRoute;
