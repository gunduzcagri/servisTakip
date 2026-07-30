-- CreateTable
CREATE TABLE "cargo_shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tracking_number" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "service_record_id" TEXT,
    "invoice_id" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "sender_address" TEXT NOT NULL,
    "sender_city" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "recipient_city" TEXT NOT NULL,
    "package_count" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL,
    "dimensions" TEXT,
    "cargo_code" TEXT,
    "barcode" TEXT,
    "notes" TEXT,
    "price" REAL,
    "tracking_history" JSONB,
    "delivered_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cargo_shipments_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cargo_shipments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cargo_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "api_key" TEXT,
    "api_secret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "base_url" TEXT,
    "sender_name" TEXT,
    "sender_phone" TEXT,
    "sender_city" TEXT,
    "config" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "cargo_shipments_tracking_number_key" ON "cargo_shipments"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_shipments_service_record_id_key" ON "cargo_shipments"("service_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_shipments_invoice_id_key" ON "cargo_shipments"("invoice_id");

-- CreateIndex
CREATE INDEX "cargo_shipments_tracking_number_idx" ON "cargo_shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "cargo_shipments_company_idx" ON "cargo_shipments"("company");

-- CreateIndex
CREATE INDEX "cargo_shipments_status_idx" ON "cargo_shipments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_configs_company_key" ON "cargo_configs"("company");
