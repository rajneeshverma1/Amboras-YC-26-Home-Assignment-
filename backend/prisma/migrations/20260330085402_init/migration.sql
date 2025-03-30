-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_page_views" INTEGER NOT NULL DEFAULT 0,
    "total_add_to_cart" INTEGER NOT NULL DEFAULT 0,
    "total_remove_from_cart" INTEGER NOT NULL DEFAULT 0,
    "total_checkout_started" INTEGER NOT NULL DEFAULT 0,
    "total_purchases" INTEGER NOT NULL DEFAULT 0,
    "unique_products_sold" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_metrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "product_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_event_id_key" ON "events"("event_id");

-- CreateIndex
CREATE INDEX "events_store_id_timestamp_idx" ON "events"("store_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_event_type_idx" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "events_store_id_event_type_idx" ON "events"("store_id", "event_type");

-- CreateIndex
CREATE INDEX "daily_metrics_store_id_date_idx" ON "daily_metrics"("store_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_store_id_date_key" ON "daily_metrics"("store_id", "date");

-- CreateIndex
CREATE INDEX "product_metrics_store_id_date_idx" ON "product_metrics"("store_id", "date");

-- CreateIndex
CREATE INDEX "product_metrics_store_id_product_id_idx" ON "product_metrics"("store_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_metrics_store_id_product_id_date_key" ON "product_metrics"("store_id", "product_id", "date");
