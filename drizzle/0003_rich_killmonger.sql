ALTER TABLE "providers_schema" ADD COLUMN "api_url" text;

-- Step 2: Update all rows with the value
UPDATE "providers_schema" SET "api_url" = '	https://cheappanel.com/api/v2';

-- Step 3: Make column not null again
ALTER TABLE "providers_schema" ALTER COLUMN "api_url" SET NOT NULL;