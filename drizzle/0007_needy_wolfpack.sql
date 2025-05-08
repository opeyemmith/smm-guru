CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"link" text NOT NULL,
	"price" real,
	"service" integer NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_services_id_fk" FOREIGN KEY ("service") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers_schema" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "services_category" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "deleted_at";