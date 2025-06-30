CREATE TABLE "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"metadata" jsonb,
	"reference" text,
	"from_wallet_id" integer,
	"to_wallet_id" integer,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "transaction_fee" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"fee_type" text NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"recipient_wallet_id" integer,
	"user_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(20, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'active',
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_wallet_id_wallet_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_wallet_id_wallet_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_fee" ADD CONSTRAINT "transaction_fee_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_fee" ADD CONSTRAINT "transaction_fee_recipient_wallet_id_wallet_id_fk" FOREIGN KEY ("recipient_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_fee" ADD CONSTRAINT "transaction_fee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;