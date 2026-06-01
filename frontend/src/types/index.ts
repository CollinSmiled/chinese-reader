export interface DictionaryEntry {
  pinyin: string
  english: string
}

export interface AnalyzedWord {
  type: 'word'
  word: string
  hsk_level: number | null
  dictionary: DictionaryEntry[]
  generated_pinyin?: string
}

export interface TextToken {
  type: 'text'
  text: string
}

export type AnalysisToken = AnalyzedWord | TextToken

export interface Reading {
  id: string
  userId: string | null
  collectionId: string | null
  collectionName: string | null
  title: string | null
  originalText: string
  analyzedContent: AnalysisToken[]
  wordCount: number
  estimatedHskLevel: number | null
  createdAt: string
  updatedAt: string
}

export interface ReadingCollection {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  readingCount: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface Deck {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface DeckWord {
  id: string
  word: string
  pinyin: string | null
  meaning: string | null
  hskLevel: number | null
  sourceReadingId: string | null
  exampleSentenceId: string | null
  exampleSentence: string | null
  example: {
    id: string
    chinese: string
    chineseOriginal: string
    english: string
    pinyin: string | null
    source: string
  } | null
  createdAt: string
}

export interface DictionarySearchResult {
  word: string
  traditional: string | null
  pinyin: string
  definitions: string[]
  hskLevel: number | null
}

export interface ExampleSentence {
  id: string
  chinese: string
  chineseOriginal: string
  english: string
  pinyin: string | null
  source: string
  sourceSentenceId: string
  translationSentenceId: string
  charCount: number
  wordCount: number
  estimatedHskLevel: number | null
}

export type HskBand = 1 | 2 | 3 | 4 | 5 | 6 | 'advanced'

export interface HskColor {
  bg: string
  text: string
  label: string
}
