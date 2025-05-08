import * as s from "../lib/schema";

export type TProvider = typeof s.providersSchema.$inferInsert;

export type TServices = typeof s.servicesSchema.$inferInsert;

export type TCategory = typeof s.servicesCatSchema.$inferInsert;

export type TServicesFromProvider = Omit<
  typeof s.servicesSchema.$inferInsert,
  "userId" | "id" | "deleted_at" | "updated_at" | "created_at"
>;
