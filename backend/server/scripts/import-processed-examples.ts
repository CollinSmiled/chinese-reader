import 'dotenv/config';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const DATA_PATH = resolve(
  process.env.EXAMPLES_JSONL_PATH ??
    '../analyzer/data/processed/tatoeba_examples.jsonl',
);
const RESET_BEFORE_IMPORT = process.env.EXAMPLES_RESET === 'true';
const BATCH_SIZE = Number(process.env.EXAMPLES_IMPORT_BATCH_SIZE ?? '1000');

interface ProcessedExample {
  source: string;
  sourceSentenceId: string;
  translationSentenceId: string;
  chineseOriginal: string;
  chineseSimplified: string;
  english: string;
  pinyin: string | null;
  charCount: number;
  wordCount: number;
  estimatedHskLevel: number | null;
  terms: Array<{
    term: string;
    pinyin: string | null;
    hskLevel: number | null;
  }>;
}

async function importExample(example: ProcessedExample) {
  const saved = await prisma.exampleSentence.upsert({
    where: {
      source_sourceSentenceId_translationSentenceId: {
        source: example.source,
        sourceSentenceId: example.sourceSentenceId,
        translationSentenceId: example.translationSentenceId,
      },
    },
    update: {
      chineseOriginal: example.chineseOriginal,
      chineseSimplified: example.chineseSimplified,
      english: example.english,
      pinyin: example.pinyin,
      charCount: example.charCount,
      wordCount: example.wordCount,
      estimatedHskLevel: example.estimatedHskLevel,
    },
    create: {
      source: example.source,
      sourceSentenceId: example.sourceSentenceId,
      translationSentenceId: example.translationSentenceId,
      chineseOriginal: example.chineseOriginal,
      chineseSimplified: example.chineseSimplified,
      english: example.english,
      pinyin: example.pinyin,
      charCount: example.charCount,
      wordCount: example.wordCount,
      estimatedHskLevel: example.estimatedHskLevel,
    },
  });

  await prisma.exampleSentenceTerm.deleteMany({
    where: {
      exampleSentenceId: saved.id,
    },
  });

  await prisma.exampleSentenceTerm.createMany({
    data: example.terms.map((term) => ({
      exampleSentenceId: saved.id,
      term: term.term,
      pinyin: term.pinyin,
      hskLevel: term.hskLevel,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  if (RESET_BEFORE_IMPORT) {
    console.log('Resetting existing imported examples...');
    await prisma.exampleSentence.deleteMany();
  }

  const lines = createInterface({
    input: createReadStream(DATA_PATH, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let imported = 0;
  let batch: ProcessedExample[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    if (RESET_BEFORE_IMPORT) {
      await prisma.exampleSentence.createMany({
        data: batch.map((example) => ({
          source: example.source,
          sourceSentenceId: example.sourceSentenceId,
          translationSentenceId: example.translationSentenceId,
          chineseOriginal: example.chineseOriginal,
          chineseSimplified: example.chineseSimplified,
          english: example.english,
          pinyin: example.pinyin,
          charCount: example.charCount,
          wordCount: example.wordCount,
          estimatedHskLevel: example.estimatedHskLevel,
        })),
        skipDuplicates: true,
      });

      const savedExamples = await prisma.exampleSentence.findMany({
        where: {
          OR: batch.map((example) => ({
            source: example.source,
            sourceSentenceId: example.sourceSentenceId,
            translationSentenceId: example.translationSentenceId,
          })),
        },
        select: {
          id: true,
          source: true,
          sourceSentenceId: true,
          translationSentenceId: true,
        },
      });

      const idByKey = new Map(
        savedExamples.map((example) => [
          `${example.source}:${example.sourceSentenceId}:${example.translationSentenceId}`,
          example.id,
        ]),
      );

      await prisma.exampleSentenceTerm.createMany({
        data: batch.flatMap((example) => {
          const exampleSentenceId = idByKey.get(
            `${example.source}:${example.sourceSentenceId}:${example.translationSentenceId}`,
          );

          if (!exampleSentenceId) return [];

          return example.terms.map((term) => ({
            exampleSentenceId,
            term: term.term,
            pinyin: term.pinyin,
            hskLevel: term.hskLevel,
          }));
        }),
        skipDuplicates: true,
      });
    } else {
      for (const example of batch) await importExample(example);
    }

    imported += batch.length;
    console.log(`Imported ${imported} processed examples...`);
    batch = [];
  };

  for await (const line of lines) {
    if (!line.trim()) continue;
    batch.push(JSON.parse(line) as ProcessedExample);

    if (batch.length >= BATCH_SIZE) await flushBatch();
  }

  await flushBatch();

  console.log(`Done. Imported ${imported} processed examples.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
