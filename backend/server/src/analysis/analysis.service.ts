import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { AnalysisTokenDto } from './dto/analysis-token.dto';

interface AnalyzerDictionaryEntry {
  pinyin: string;
  definitions: string[];
}

interface AnalyzerWord {
  type: 'word';
  word: string;
  hsk_level: number | null;
  dictionary: AnalyzerDictionaryEntry[];
  generated_pinyin?: string;
}

interface AnalyzerText {
  type: 'text';
  text: string;
}

@Injectable()
export class AnalysisService {
  private readonly analyzerUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.analyzerUrl =
      this.configService.get<string>('ANALYZER_URL') ?? 'http://localhost:8000';
  }

  async analyze(payload: AnalyzeTextDto): Promise<AnalysisTokenDto[]> {
    try {
      const response = await fetch(`${this.analyzerUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Analyzer responded with ${response.status}`);
      }

      const analyzerWords = (await response.json()) as Array<
        AnalyzerWord | AnalyzerText
      >;

      return analyzerWords.map((entry) =>
        entry.type === 'text'
          ? {
              type: 'text',
              text: entry.text,
            }
          : {
              type: 'word',
              word: entry.word,
              hsk_level: entry.hsk_level,
              dictionary: entry.dictionary.map((dictionaryEntry) => ({
                pinyin: dictionaryEntry.pinyin,
                english: dictionaryEntry.definitions.join('; '),
              })),
              generated_pinyin: entry.generated_pinyin,
            },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown analyzer error';
      throw new BadGatewayException(`Analyzer service unavailable: ${message}`);
    }
  }
}
