ALTER TABLE "providers_schema" ADD COLUMN "iv" text;

-- Step 2: Update all rows with the value
UPDATE "providers_schema" SET "iv" = 'ewtyv46u';

-- Step 3: Make column not null again
ALTER TABLE "providers_schema" ALTER COLUMN "iv" SET NOT NULL;