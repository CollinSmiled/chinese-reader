-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT,
    "original_text" TEXT NOT NULL,
    "analyzed_content" JSONB NOT NULL,
    "word_count" INTEGER NOT NULL,
    "estimated_hsk_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_entries" (
    "id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "pinyin" TEXT,
    "meaning" TEXT,
    "hsk_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabulary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_words" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vocabulary_entry_id" UUID NOT NULL,
    "source_reading_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "saved_words_user_id_vocabulary_entry_id_key" ON "saved_words"("user_id", "vocabulary_entry_id");

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_vocabulary_entry_id_fkey" FOREIGN KEY ("vocabulary_entry_id") REFERENCES "vocabulary_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_source_reading_id_fkey" FOREIGN KEY ("source_reading_id") REFERENCES "readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
