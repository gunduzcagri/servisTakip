-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "branch_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sector_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sector_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "dynamic_fields" JSONB,
    "qr_code" TEXT,
    "barcode" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "devices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "devices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "sector_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tracking_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "branch_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "fault_description" TEXT,
    "estimated_cost" REAL,
    "customer_approved" BOOLEAN NOT NULL DEFAULT false,
    "estimated_delivery" DATETIME,
    "delivered_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "service_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_records_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_records_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "status_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "changed_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "status_logs_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "labor_cost" REAL,
    "time_spent_min" INTEGER,
    "technician_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_actions_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" REAL NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "critical_threshold" INTEGER NOT NULL DEFAULT 5,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "service_parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_at_time" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_parts_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_parts_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BEFORE',
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_photos_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "service_record_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" DATETIME,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_ratings_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_records_tracking_number_key" ON "service_records"("tracking_number");

-- CreateIndex
CREATE INDEX "service_records_customer_id_idx" ON "service_records"("customer_id");

-- CreateIndex
CREATE INDEX "service_records_technician_id_idx" ON "service_records"("technician_id");

-- CreateIndex
CREATE INDEX "service_records_status_idx" ON "service_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parts_sku_key" ON "parts"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ratings_service_record_id_key" ON "customer_ratings"("service_record_id");
