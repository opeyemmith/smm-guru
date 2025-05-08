CREATE TABLE "providers_schema" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_key" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "providers_schema" ADD CONSTRAINT "providers_schema_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;