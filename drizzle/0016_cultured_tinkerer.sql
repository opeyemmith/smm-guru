ALTER TABLE "orders" ADD COLUMN "provider_order_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "status" text DEFAULT 'PENDING' NOT NULL;