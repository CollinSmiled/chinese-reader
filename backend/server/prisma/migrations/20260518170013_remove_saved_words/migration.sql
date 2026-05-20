/*
  Warnings:

  - You are about to drop the `saved_words` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "saved_words" DROP CONSTRAINT "saved_words_source_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_words" DROP CONSTRAINT "saved_words_user_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_words" DROP CONSTRAINT "saved_words_vocabulary_entry_id_fkey";

-- DropTable
DROP TABLE "saved_words";
