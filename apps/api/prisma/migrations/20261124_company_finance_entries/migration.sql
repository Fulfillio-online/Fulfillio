-- Idempotent PostgreSQL migration for company_finance_entries ledger table

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinanceEntryType') THEN
        CREATE TYPE "FinanceEntryType" AS ENUM ('EXPENSE', 'INCOME');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinanceEntryCategory') THEN
        CREATE TYPE "FinanceEntryCategory" AS ENUM (
            'RENT',
            'SALARY',
            'COURIER_COST',
            'PACKAGING_PURCHASE',
            'UTILITY_MISC',
            'STORAGE_FEE',
            'OTHER_INCOME'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "company_finance_entries" (
    "id" TEXT NOT NULL,
    "entryCode" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "category" "FinanceEntryCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merchantId" TEXT,
    "paymentMethod" TEXT,
    "referenceNo" TEXT,
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "createdByAdminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_finance_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_finance_entries_entryCode_key"
    ON "company_finance_entries"("entryCode");

CREATE INDEX IF NOT EXISTS "company_finance_entries_type_entryDate_idx"
    ON "company_finance_entries"("type", "entryDate");

CREATE INDEX IF NOT EXISTS "company_finance_entries_category_entryDate_idx"
    ON "company_finance_entries"("category", "entryDate");

CREATE INDEX IF NOT EXISTS "company_finance_entries_merchantId_entryDate_idx"
    ON "company_finance_entries"("merchantId", "entryDate");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'company_finance_entries_merchantId_fkey'
          AND table_name = 'company_finance_entries'
    ) THEN
        ALTER TABLE "company_finance_entries"
            ADD CONSTRAINT "company_finance_entries_merchantId_fkey"
            FOREIGN KEY ("merchantId") REFERENCES "merchants"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
