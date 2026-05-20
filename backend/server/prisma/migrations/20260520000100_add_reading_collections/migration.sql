CREATE TABLE "reading_collections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_collections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reading_collections"
ADD CONSTRAINT "reading_collections_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "reading_collections_user_id_name_key" ON "reading_collections"("user_id", "name");
CREATE INDEX "reading_collections_user_id_idx" ON "reading_collections"("user_id");

ALTER TABLE "readings" ADD COLUMN "collection_id" UUID;

ALTER TABLE "readings"
ADD CONSTRAINT "readings_collection_id_fkey"
FOREIGN KEY ("collection_id") REFERENCES "reading_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
