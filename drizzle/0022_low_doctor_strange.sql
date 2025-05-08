ALTER TABLE "orders" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;