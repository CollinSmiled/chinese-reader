CREATE TABLE "example_sentences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source" TEXT NOT NULL DEFAULT 'tatoeba',
  "source_sentence_id" TEXT NOT NULL,
  "translation_sentence_id" TEXT NOT NULL,
  "chinese_original" TEXT NOT NULL,
  "chinese_simplified" TEXT NOT NULL,
  "english" TEXT NOT NULL,
  "pinyin" TEXT,
  "char_count" INTEGER NOT NULL,
  "word_count" INTEGER NOT NULL,
  "estimated_hsk_level" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "example_sentences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "example_sentence_terms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "example_sentence_id" UUID NOT NULL,
  "term" TEXT NOT NULL,
  "pinyin" TEXT,
  "hsk_level" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "example_sentence_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "example_sentences_source_source_sentence_id_translation_sentence_id_key"
  ON "example_sentences"("source", "source_sentence_id", "translation_sentence_id");

CREATE INDEX "example_sentences_source_sentence_id_idx"
  ON "example_sentences"("source_sentence_id");

CREATE INDEX "example_sentences_char_count_idx"
  ON "example_sentences"("char_count");

CREATE INDEX "example_sentences_estimated_hsk_level_idx"
  ON "example_sentences"("estimated_hsk_level");

CREATE UNIQUE INDEX "example_sentence_terms_example_sentence_id_term_key"
  ON "example_sentence_terms"("example_sentence_id", "term");

CREATE INDEX "example_sentence_terms_term_idx"
  ON "example_sentence_terms"("term");

CREATE INDEX "example_sentence_terms_hsk_level_idx"
  ON "example_sentence_terms"("hsk_level");

ALTER TABLE "example_sentence_terms"
  ADD CONSTRAINT "example_sentence_terms_example_sentence_id_fkey"
  FOREIGN KEY ("example_sentence_id") REFERENCES "example_sentences"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
