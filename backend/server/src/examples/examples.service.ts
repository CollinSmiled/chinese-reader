import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExampleSentenceDto } from './dto/example-sentence.dto';

@Injectable()
export class ExamplesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(word: string, limit = 5): Promise<ExampleSentenceDto[]> {
    const normalizedWord = word.trim();
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    if (!normalizedWord) return [];

    const matches = await this.prisma.exampleSentenceTerm.findMany({
      where: {
        term: normalizedWord,
      },
      include: {
        sentence: true,
      },
      take: 80,
    });

    return matches
      .map((match) => this.toDto(match.sentence))
      .sort((left, right) => this.score(left) - this.score(right))
      .slice(0, safeLimit);
  }

  private score(example: ExampleSentenceDto): number {
    const hskPenalty = example.estimatedHskLevel ?? 10;

    return example.charCount + hskPenalty * 2 + example.wordCount;
  }

  private toDto(sentence: {
    id: string;
    chineseSimplified: string;
    chineseOriginal: string;
    english: string;
    pinyin: string | null;
    source: string;
    sourceSentenceId: string;
    translationSentenceId: string;
    charCount: number;
    wordCount: number;
    estimatedHskLevel: number | null;
  }): ExampleSentenceDto {
    return {
      id: sentence.id,
      chinese: sentence.chineseSimplified,
      chineseOriginal: sentence.chineseOriginal,
      english: sentence.english,
      pinyin: sentence.pinyin,
      source: sentence.source,
      sourceSentenceId: sentence.sourceSentenceId,
      translationSentenceId: sentence.translationSentenceId,
      charCount: sentence.charCount,
      wordCount: sentence.wordCount,
      estimatedHskLevel: sentence.estimatedHskLevel,
    };
  }
}
