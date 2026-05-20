-- CreateTable
CREATE TABLE "decks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_words" (
    "id" UUID NOT NULL,
    "deck_id" UUID NOT NULL,
    "vocabulary_entry_id" UUID NOT NULL,
    "source_reading_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decks_user_id_idx" ON "decks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "decks_user_id_name_key" ON "decks"("user_id", "name");

-- CreateIndex
CREATE INDEX "deck_words_deck_id_idx" ON "deck_words"("deck_id");

-- CreateIndex
CREATE UNIQUE INDEX "deck_words_deck_id_vocabulary_entry_id_key" ON "deck_words"("deck_id", "vocabulary_entry_id");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_words" ADD CONSTRAINT "deck_words_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_words" ADD CONSTRAINT "deck_words_vocabulary_entry_id_fkey" FOREIGN KEY ("vocabulary_entry_id") REFERENCES "vocabulary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_words" ADD CONSTRAINT "deck_words_source_reading_id_fkey" FOREIGN KEY ("source_reading_id") REFERENCES "readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
