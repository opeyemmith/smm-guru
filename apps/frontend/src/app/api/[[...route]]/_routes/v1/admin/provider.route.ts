import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { addProviderFormSchema } from "@smm-guru/utils";
import { db } from "@/lib/database/db";
import { providersSchema } from "@smm-guru/database";
import { CREATED, OK, UNAUTHORIZED } from "@smm-guru/utils";
import { HonoAuthSession } from "@/lib/better-auth/type.auth";
import { decrypt, encrypt } from "@smm-guru/utils";
import { AES_SECRET_KEY } from "@/lib/env";
import { and, eq } from "@smm-guru/database";
import axios from "axios";

const addProviderRoute = new Hono<HonoAuthSession>();

addProviderRoute.post(
  "/",
  zValidator("json", addProviderFormSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Authentication required",
          name: "UNAUTHORIZED_ACCESS",
          message: "You must be signed in to add providers",
          result: null,
        },
        UNAUTHORIZED
      );
    }

    const encryptedApiKey = encrypt(body.apiKey, AES_SECRET_KEY);

    await db.insert(providersSchema).values({
      ...body,
      apiKey: encryptedApiKey.encryptedKeys,
      iv: encryptedApiKey.iv,
      apiUrl: body.apiUrl,
      created_at: new Date(),
      updated_at: new Date(),
      userId: user.id,
    });

    return c.json(
      {
        success: true,
        name: "PROVIDER_ADDED",
        message: "Provider added successfully",
        result: null,
      },
      CREATED
    );
  }
);

addProviderRoute.patch(
  "/:provider-id",
  zValidator("json", addProviderFormSchema),
  async (c) => {
    // CRITICAL: Check authentication and admin role
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Authentication required",
          name: "UNAUTHORIZED_ACCESS",
          message: "You must be signed in to update providers",
          result: null,
        },
        UNAUTHORIZED
      );
    }

    if (user.role !== "admin") {
      return c.json(
        {
          success: false,
          error: "Admin access required",
          name: "FORBIDDEN_ACCESS",
          message: "You must have admin privileges to update providers",
          result: null,
        },
        UNAUTHORIZED
      );
    }

    const body = c.req.valid("json");
    const providerId = Number(c.req.param("provider-id"));

    const encryptedApiKey = encrypt(body.apiKey, AES_SECRET_KEY);

    await db
      .update(providersSchema)
      .set({
        ...body,
        apiKey: encryptedApiKey.encryptedKeys,
        iv: encryptedApiKey.iv,
        updated_at: new Date(),
      })
      .where(and(eq(providersSchema.id, providerId)));

    return c.json(
      {
        success: true,
        name: "PROVIDER_EDITED",
        message: "Provider edited successfully",
        result: null,
      },
      OK
    );
  }
);

addProviderRoute.get("/", async (c) => {
  // CRITICAL: Check authentication and admin role
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        error: "Authentication required",
        name: "UNAUTHORIZED_ACCESS",
        message: "You must be signed in to access admin resources",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  if (user.role !== "admin") {
    return c.json(
      {
        success: false,
        error: "Admin access required",
        name: "FORBIDDEN_ACCESS",
        message: "You must have admin privileges to access provider data",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  const providers = await db.query.providersSchema.findMany({
    columns: {
      id: true,
      name: true,
      apiUrl: true,
    },
    orderBy: (providersSchema, { desc }) => [desc(providersSchema.id)],
  });

  return c.json(
    {
      success: true,
      name: "PROVIDERS_FETCHED",
      message: "Providers fetched successfully",
      result: providers,
    },
    OK
  );
});

addProviderRoute.get("/key/:provider-id", async (c) => {
  // CRITICAL: Check authentication and admin role
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        error: "Authentication required",
        name: "UNAUTHORIZED_ACCESS",
        message: "You must be signed in to access admin resources",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  if (user.role !== "admin") {
    return c.json(
      {
        success: false,
        error: "Admin access required",
        name: "FORBIDDEN_ACCESS",
        message: "You must have admin privileges to access provider keys",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  const providerId = Number(c.req.param("provider-id"));

  const provider = await db.query.providersSchema.findFirst({
    where: and(eq(providersSchema.id, providerId)),
    columns: {
      id: true,
      apiKey: true,
      apiUrl: true,
      iv: true,
      name: true,
    },
  });

  if (!provider) {
    return c.json(
      {
        success: true,
        name: "PROVIDER_NOT_FOUND",
        message: "Provider not found",
        result: null,
      },
      OK
    );
  }

  const openApiKey = decrypt(provider.apiKey, provider.iv, AES_SECRET_KEY);

  const result = {
    id: provider.id,
    apiKey: openApiKey,
    name: provider.name,
    apiUrl: provider.apiUrl,
  };

  return c.json(
    {
      success: true,
      name: "PROVIDER_KEY_FETCHED",
      message: "Provider key fetched successfully",
      result,
    },
    OK
  );
});

addProviderRoute.delete("/:provider-id", async (c) => {
  const providerId = Number(c.req.param("provider-id"));

  await db
    .delete(providersSchema)
    .where(and(eq(providersSchema.id, providerId)));

  return c.json(
    {
      success: true,
      name: "PROVIDER_DELETED",
      message: "Provider deleted successfully",
      result: null,
    },
    OK
  );
});

addProviderRoute.get("/services/:provider-id", async (c) => {
  // CRITICAL: Check authentication and admin role
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        error: "Authentication required",
        name: "UNAUTHORIZED_ACCESS",
        message: "You must be signed in to access admin resources",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  if (user.role !== "admin") {
    return c.json(
      {
        success: false,
        error: "Admin access required",
        name: "FORBIDDEN_ACCESS",
        message: "You must have admin privileges to access provider services",
        result: null,
      },
      UNAUTHORIZED
    );
  }

  const providerId = Number(c.req.param("provider-id"));

  const provider = await db.query.providersSchema.findFirst({
    where: and(eq(providersSchema.id, providerId)),
    columns: {
      id: true,
      apiUrl: true,
      apiKey: true,
      iv: true,
    },
  });

  if (!provider) {
    return c.json(
      {
        success: false,
        name: "FAILED_TO_FETCH_PROVIDER",
        message: "Failed to fetch provider data",
        result: null,
      },
      OK
    );
  }

  const originalApiKey = decrypt(provider.apiKey, provider.iv, AES_SECRET_KEY);

  let res;

  try {
    res = await axios.post(provider.apiUrl, {
      key: originalApiKey,
      action: "services",
    });
  } catch (error) {
    console.error("Failed to fetch provider services:", error);
    return c.json(
      {
        success: false,
        name: "FAILED_TO_FETCH_SERVICES",
        message: "Failed to fetch services from provider",
        result: null,
      },
      OK
    );
  }

  return c.json(
    {
      success: true,
      name: "SERVICES_FETCHED",
      message: "Services fetched successfully",
      result: res.data,
    },
    OK
  );
});

export default addProviderRoute;
