ALTER TABLE "services" ADD COLUMN "price" real;

-- Step 2: Set default value
UPDATE "services" SET "price" = 2;

-- Step 3: Make it not null again
ALTER TABLE "services" ALTER COLUMN "price" SET NOT NULL