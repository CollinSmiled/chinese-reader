ALTER TABLE "deck_words"
  ADD COLUMN "example_sentence_id" UUID;

CREATE INDEX "deck_words_example_sentence_id_idx"
  ON "deck_words"("example_sentence_id");

ALTER TABLE "deck_words"
  ADD CONSTRAINT "deck_words_example_sentence_id_fkey"
  FOREIGN KEY ("example_sentence_id") REFERENCES "example_sentences"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
