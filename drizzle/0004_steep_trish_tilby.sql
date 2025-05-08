CREATE TABLE "services_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"rate" real NOT NULL,
	"min" integer NOT NULL,
	"max" integer NOT NULL,
	"dripfeed" boolean NOT NULL,
	"refill" boolean NOT NULL,
	"cancel" boolean NOT NULL,
	"category" text NOT NULL,
	"category_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "services_category" ADD CONSTRAINT "services_category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_services_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."services_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;