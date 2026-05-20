import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DictionaryResultDto } from './dto/dictionary-result.dto';

interface CedictEntry {
  traditional?: string;
  pinyin: string;
  definitions: string[];
}

type CedictIndex = Record<string, CedictEntry[]>;
type HskIndex = Record<string, number>;

interface NormalizedPinyin {
  compact: string;
  numbered: string;
  syllables: string[];
  numberedSyllables: string[];
}

interface IndexedEntry extends DictionaryResultDto {
  id: number;
  sourceOrder: number;
  normalizedWord: string;
  normalizedTraditional: string;
  normalizedPinyin: NormalizedPinyin;
  meaning: string;
  definitionTokens: string[];
}

interface SearchCandidate extends IndexedEntry {
  score: number;
}

interface DictionaryIndex {
  entries: IndexedEntry[];
  exactChinese: Map<string, number[]>;
  prefixChinese: Map<string, number[]>;
  pinyinCompact: Map<string, number[]>;
  pinyinNumbered: Map<string, number[]>;
  pinyinSyllable: Map<string, number[]>;
  pinyinNumberedSyllable: Map<string, number[]>;
  pinyinSyllablePrefix: Map<string, number[]>;
  englishToken: Map<string, number[]>;
  englishPrefix: Map<string, number[]>;
}

@Injectable()
export class DictionaryService implements OnModuleInit {
  private index?: DictionaryIndex;
  private indexPromise?: Promise<DictionaryIndex>;

  async onModuleInit(): Promise<void> {
    await this.loadIndex();
  }

  async search(query: string, limit = 20): Promise<DictionaryResultDto[]> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const index = await this.loadIndex();
    const queryPinyin = this.normalizePinyin(normalizedQuery);
    const hasLatin = /[a-z]/i.test(normalizedQuery);
    const queryHasTone = /\d/.test(queryPinyin.numbered);
    const candidateIds = new Set<number>();

    this.addCandidates(candidateIds, index.exactChinese.get(normalizedQuery));
    this.addCandidates(candidateIds, index.prefixChinese.get(normalizedQuery));

    if (hasLatin) {
      this.addCandidates(candidateIds, index.pinyinCompact.get(queryPinyin.compact));
      if (queryHasTone) {
        this.addCandidates(candidateIds, index.pinyinNumbered.get(queryPinyin.numbered));
      }

      for (const syllable of queryPinyin.syllables) {
        this.addCandidates(candidateIds, index.pinyinSyllable.get(syllable));
        this.addCandidates(candidateIds, index.pinyinSyllablePrefix.get(syllable));
      }

      for (const syllable of queryPinyin.numberedSyllables) {
        this.addCandidates(candidateIds, index.pinyinNumberedSyllable.get(syllable));
      }

      this.addCandidates(candidateIds, index.englishToken.get(normalizedQuery));
      this.addCandidates(candidateIds, index.englishPrefix.get(normalizedQuery));
    }

    const scored: SearchCandidate[] = [];

    for (const id of candidateIds) {
      const entry = index.entries[id];
      const score = this.scoreEntry(normalizedQuery, queryPinyin, hasLatin, entry);
      if (score === null) continue;
      scored.push({ ...entry, score });
    }

    const seen = new Set<string>();
    return scored
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.word.length !== b.word.length) return a.word.length - b.word.length;
        if (Boolean(a.hskLevel) !== Boolean(b.hskLevel)) return a.hskLevel ? -1 : 1;
        if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
        if ((a.hskLevel ?? 99) !== (b.hskLevel ?? 99)) {
          return (a.hskLevel ?? 99) - (b.hskLevel ?? 99);
        }
        return a.word.localeCompare(b.word);
      })
      .filter((entry) => {
        const key = `${entry.word}-${entry.pinyin}-${entry.definitions.join('|')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit)
      .map(
        ({
          id: _id,
          sourceOrder: _sourceOrder,
          normalizedWord: _normalizedWord,
          normalizedTraditional: _normalizedTraditional,
          normalizedPinyin: _normalizedPinyin,
          meaning: _meaning,
          definitionTokens: _definitionTokens,
          score: _score,
          ...entry
        }) => entry,
      );
  }

  private scoreEntry(
    query: string,
    queryPinyin: NormalizedPinyin,
    hasLatin: boolean,
    entry: IndexedEntry,
  ): number | null {
    if (entry.normalizedWord === query || entry.normalizedTraditional === query) return 0;
    if (
      entry.normalizedWord.startsWith(query) ||
      entry.normalizedTraditional.startsWith(query)
    ) {
      return 10;
    }

    if (!hasLatin) return null;

    const queryHasTone = /\d/.test(queryPinyin.numbered);
    const querySyllableCount = queryPinyin.syllables.length;

    if (queryHasTone && entry.normalizedPinyin.numbered === queryPinyin.numbered) return 30;
    if (!queryHasTone && entry.normalizedPinyin.compact === queryPinyin.compact) return 32;

    if (
      queryHasTone &&
      this.hasSyllableSequence(
        entry.normalizedPinyin.numberedSyllables,
        queryPinyin.numberedSyllables,
      )
    ) {
      return querySyllableCount === entry.normalizedPinyin.syllables.length ? 34 : 36;
    }

    if (this.hasSyllableSequence(entry.normalizedPinyin.syllables, queryPinyin.syllables)) {
      return querySyllableCount === entry.normalizedPinyin.syllables.length ? 38 : 42;
    }

    if (this.startsWithSyllableSequence(entry.normalizedPinyin.syllables, queryPinyin.syllables)) {
      return 48;
    }

    if (entry.definitionTokens.includes(query)) return 80;
    if (entry.meaning.includes(query)) return 90;

    return null;
  }

  private async loadIndex(): Promise<DictionaryIndex> {
    if (this.index) return this.index;
    if (this.indexPromise) return this.indexPromise;

    this.indexPromise = this.buildIndex();
    this.index = await this.indexPromise;
    return this.index;
  }

  private async buildIndex(): Promise<DictionaryIndex> {
    const [cedict, hsk] = await Promise.all([this.loadCedict(), this.loadHsk()]);
    const index: DictionaryIndex = {
      entries: [],
      exactChinese: new Map(),
      prefixChinese: new Map(),
      pinyinCompact: new Map(),
      pinyinNumbered: new Map(),
      pinyinSyllable: new Map(),
      pinyinNumberedSyllable: new Map(),
      pinyinSyllablePrefix: new Map(),
      englishToken: new Map(),
      englishPrefix: new Map(),
    };

    for (const [sourceOrder, [word, entries]] of Object.entries(cedict).entries()) {
      for (const entry of entries) {
        const id = index.entries.length;
        const meaning = entry.definitions.join(' / ').toLowerCase();
        const normalizedPinyin = this.normalizePinyin(entry.pinyin);
        const indexedEntry: IndexedEntry = {
          id,
          sourceOrder,
          word,
          traditional: entry.traditional ?? null,
          pinyin: this.formatPinyin(entry.pinyin),
          definitions: entry.definitions,
          hskLevel: hsk[word] ?? null,
          normalizedWord: word.toLowerCase(),
          normalizedTraditional: entry.traditional?.toLowerCase() ?? '',
          normalizedPinyin,
          meaning,
          definitionTokens: this.tokenizeEnglish(meaning),
        };

        index.entries.push(indexedEntry);
        this.indexChinese(index, indexedEntry);
        this.indexPinyin(index, indexedEntry);
        this.indexEnglish(index, indexedEntry);
      }
    }

    return index;
  }

  private indexChinese(index: DictionaryIndex, entry: IndexedEntry): void {
    const values = [entry.normalizedWord, entry.normalizedTraditional].filter(Boolean);

    for (const value of values) {
      this.addToIndex(index.exactChinese, value, entry.id);

      for (let length = 1; length <= value.length; length += 1) {
        this.addToIndex(index.prefixChinese, value.slice(0, length), entry.id);
      }
    }
  }

  private indexPinyin(index: DictionaryIndex, entry: IndexedEntry): void {
    const pinyin = entry.normalizedPinyin;
    this.addToIndex(index.pinyinCompact, pinyin.compact, entry.id);
    this.addToIndex(index.pinyinNumbered, pinyin.numbered, entry.id);

    for (const syllable of pinyin.syllables) {
      this.addToIndex(index.pinyinSyllable, syllable, entry.id);

      for (let length = 1; length <= syllable.length; length += 1) {
        this.addToIndex(index.pinyinSyllablePrefix, syllable.slice(0, length), entry.id);
      }
    }

    for (const syllable of pinyin.numberedSyllables) {
      this.addToIndex(index.pinyinNumberedSyllable, syllable, entry.id);
    }
  }

  private indexEnglish(index: DictionaryIndex, entry: IndexedEntry): void {
    for (const token of entry.definitionTokens) {
      this.addToIndex(index.englishToken, token, entry.id);

      for (let length = 2; length <= token.length; length += 1) {
        this.addToIndex(index.englishPrefix, token.slice(0, length), entry.id);
      }
    }
  }

  private addToIndex(map: Map<string, number[]>, key: string, id: number): void {
    if (!key) return;

    const existing = map.get(key);
    if (existing) {
      if (existing[existing.length - 1] !== id) existing.push(id);
      return;
    }

    map.set(key, [id]);
  }

  private addCandidates(target: Set<number>, ids?: number[]): void {
    if (!ids) return;
    for (const id of ids) target.add(id);
  }

  private tokenizeEnglish(value: string): string[] {
    return Array.from(new Set(value.match(/[a-z0-9]+/g) ?? []));
  }

  private hasSyllableSequence(syllables: string[], querySyllables: string[]): boolean {
    if (querySyllables.length === 0) return false;

    for (let index = 0; index <= syllables.length - querySyllables.length; index += 1) {
      const slice = syllables.slice(index, index + querySyllables.length);
      if (slice.every((syllable, sliceIndex) => syllable === querySyllables[sliceIndex])) {
        return true;
      }
    }

    return false;
  }

  private startsWithSyllableSequence(
    syllables: string[],
    querySyllables: string[],
  ): boolean {
    if (querySyllables.length === 0) return false;
    if (querySyllables.length > syllables.length) return false;

    return querySyllables.every((querySyllable, index) =>
      syllables[index].startsWith(querySyllable),
    );
  }

  private normalizePinyin(value: string): NormalizedPinyin {
    const tokens = value
      .toLowerCase()
      .replace(/u:/g, 'v')
      .replace(/ü/g, 'v')
      .split(/[^a-z0-9:\u00c0-\u024f\u0300-\u036f]+/i)
      .filter(Boolean);
    const numberedSyllables = tokens.map((token) => this.normalizePinyinSyllable(token));
    const syllables = numberedSyllables.map((token) => token.replace(/[1-5]/g, ''));

    return {
      compact: syllables.join(''),
      numbered: numberedSyllables.join(''),
      syllables,
      numberedSyllables,
    };
  }

  private normalizePinyinSyllable(value: string): string {
    let tone = '';
    const decomposed = value.normalize('NFD');
    let syllable = '';

    for (const char of decomposed) {
      if (/[1-5]/.test(char)) {
        tone = char;
        continue;
      }

      if (char === '\u0304') tone = '1';
      else if (char === '\u0301') tone = '2';
      else if (char === '\u030c') tone = '3';
      else if (char === '\u0300') tone = '4';
      else if (/[a-z]/.test(char)) syllable += char;
    }

    return `${syllable}${tone}`;
  }

  private formatPinyin(value: string): string {
    return value
      .split(/(\s+)/)
      .map((part) => (/\s+/.test(part) ? part : this.formatPinyinSyllable(part)))
      .join('');
  }

  private formatPinyinSyllable(value: string): string {
    const match = value.match(/^([a-züv:]+)([1-5])$/i);
    if (!match) return value;

    const rawSyllable = match[1];
    const tone = Number(match[2]);
    let syllable = rawSyllable.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü');

    if (tone === 5) return syllable;

    const toneMarks: Record<string, string[]> = {
      a: ['ā', 'á', 'ǎ', 'à', 'a'],
      e: ['ē', 'é', 'ě', 'è', 'e'],
      i: ['ī', 'í', 'ǐ', 'ì', 'i'],
      o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
      u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
      ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    };

    const markAt = (vowel: string): boolean => {
      const index = syllable.indexOf(vowel);
      if (index < 0) return false;
      syllable =
        syllable.slice(0, index) +
        toneMarks[vowel][tone - 1] +
        syllable.slice(index + vowel.length);
      return true;
    };

    if (markAt('a') || markAt('e')) return syllable;
    if (syllable.includes('ou')) return markAt('o') ? syllable : value;

    for (let index = syllable.length - 1; index >= 0; index -= 1) {
      const char = syllable[index];
      if (toneMarks[char]) {
        syllable =
          syllable.slice(0, index) +
          toneMarks[char][tone - 1] +
          syllable.slice(index + 1);
        return syllable;
      }
    }

    return value;
  }

  private async loadCedict(): Promise<CedictIndex> {
    const filePath = resolve(
      process.cwd(),
      '..',
      'analyzer',
      'data',
      'processed',
      'cc_cedict.json',
    );
    return JSON.parse(await readFile(filePath, 'utf8')) as CedictIndex;
  }

  private async loadHsk(): Promise<HskIndex> {
    const filePath = resolve(
      process.cwd(),
      '..',
      'analyzer',
      'data',
      'processed',
      'hsk30_vocabulary.json',
    );
    return JSON.parse(await readFile(filePath, 'utf8')) as HskIndex;
  }
}
