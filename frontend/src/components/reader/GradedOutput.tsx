import { useEffect, useState } from 'react'
import { RiArrowDownSLine, RiBookOpenLine, RiStackLine } from 'react-icons/ri'
import type { AnalysisToken, AnalyzedWord, Deck, ExampleSentence, HskBand } from '../../types'
import { getHskBand, getHskColor, HSK_BANDS, HSK_COLORS, UNKNOWN_HSK_COLOR } from '../../utils/hsk'
import { formatPinyin } from '../../utils/pinyin'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface Props {
  results: AnalysisToken[]
  showPinyin: boolean
  wordSpacing: boolean
  onShowPinyinChange: (value: boolean) => void
  onWordSpacingChange: (value: boolean) => void
  resetKey?: number
  decks?: Deck[]
  selectedDeckId?: string
  onSelectedDeckChange?: (deckId: string) => void
  onSaveWord?: (entry: AnalyzedWord, deckId: string, exampleSentence: string) => Promise<void>
  savingWord?: string | null
  canSaveWords?: boolean
  isWordSaved?: (entry: AnalyzedWord, deckId: string) => boolean
}

function WordChip({
  entry,
  isSelected,
  showPinyin,
  wordSpacing,
  onClick,
}: {
  entry: AnalyzedWord
  isSelected: boolean
  showPinyin: boolean
  wordSpacing: boolean
  onClick: (entry: AnalyzedWord) => void
}) {
  const colors = getHskColor(entry.hsk_level)
  const pinyin = formatPinyin(entry.dictionary[0]?.pinyin ?? entry.generated_pinyin)

  return (
    <span
      className={`inline-flex flex-col items-center py-0.5 rounded cursor-pointer transition-all duration-150 border border-transparent ${
        wordSpacing ? 'px-1.5' : 'px-0'
      }`}
      style={{
        background: isSelected ? colors.bg : 'transparent',
        borderColor: isSelected ? colors.text + '44' : 'transparent',
        verticalAlign: 'bottom',
      }}
      onClick={() => onClick(entry)}
    >
      {showPinyin && pinyin && (
        <span className="text-xs leading-none mb-0.5 font-body" style={{ color: colors.text }}>
          {pinyin}
        </span>
      )}
      <span className="text-2xl leading-tight font-display" style={{ color: colors.text }}>
        {entry.word}
      </span>
    </span>
  )
}

function DictPanel({
  entry,
  exampleSentence,
  decks = [],
  selectedDeckId,
  onSelectedDeckChange,
  onClose,
  onSaveWord,
  savingWord,
  canSaveWords = false,
  isWordSaved,
}: {
  entry: AnalyzedWord
  exampleSentence: string
  decks?: Deck[]
  selectedDeckId?: string
  onSelectedDeckChange?: (deckId: string) => void
  onClose: () => void
  onSaveWord?: (entry: AnalyzedWord, deckId: string, exampleSentence: string) => Promise<void>
  savingWord?: string | null
  canSaveWords?: boolean
  isWordSaved?: (entry: AnalyzedWord, deckId: string) => boolean
}) {
  const colors = getHskColor(entry.hsk_level)
  const canSaveToDeck = Boolean(canSaveWords && selectedDeckId)
  const [isDeckMenuOpen, setIsDeckMenuOpen] = useState(false)
  const [examples, setExamples] = useState<ExampleSentence[]>([])
  const [examplesLoading, setExamplesLoading] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [examplesError, setExamplesError] = useState<string | null>(null)
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId)
  const alreadySaved = Boolean(selectedDeckId && isWordSaved?.(entry, selectedDeckId))

  useEffect(() => {
    let cancelled = false

    const loadExamples = async () => {
      setExamples([])
      setExamplesError(null)
      setExamplesLoading(true)

      try {
        const params = new URLSearchParams({ word: entry.word, limit: '3' })
        const response = await fetch(`${API_URL}/api/v1/examples?${params}`)
        if (!response.ok) throw new Error(`Server error: ${response.status}`)
        const data = (await response.json()) as ExampleSentence[]
        if (!cancelled) setExamples(data)
      } catch (err) {
        if (!cancelled) setExamplesError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setExamplesLoading(false)
      }
    }

    void loadExamples()

    return () => {
      cancelled = true
    }
  }, [entry.word])

  return (
    <div className="mt-4 bg-ink-0 rounded-md px-4 py-3.5 border border-ink-50">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="text-2xl font-display font-bold text-ink-900">{entry.word}</span>
        {entry.hsk_level && (
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: colors.bg, color: colors.text }}
          >
            {colors.label}
          </span>
        )}
        <button
          className="btn-quiet ml-auto text-sm px-2 py-1 rounded-md bg-transparent border-none"
          onClick={onClose}
        >
          x
        </button>
      </div>

      {entry.dictionary.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {entry.dictionary.slice(0, 4).map((definition, index) => (
            <div key={index} className="flex gap-3 items-baseline text-sm">
              <span className="text-red-600 font-medium min-w-[80px] text-xs">
                {formatPinyin(definition.pinyin)}
              </span>
              <span className="text-ink-900">{definition.english}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-400">
          {formatPinyin(entry.generated_pinyin) || 'No dictionary entry found.'}
        </p>
      )}

      <div className="mt-4 rounded-md border border-ink-50 bg-white px-3 py-2.5">
        <div className="mb-1 text-[11px] font-semibold uppercase text-ink-400">
          Sentence from this reading
        </div>
        <p className="font-display text-base leading-relaxed text-ink-900">{exampleSentence}</p>
      </div>

      <div className="mt-3">
        <button
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-ink-400 transition-colors duration-150 hover:bg-white hover:text-ink-900"
          type="button"
          onClick={() => setExamplesOpen((value) => !value)}
        >
          <RiBookOpenLine className="text-sm" />
          {examplesOpen ? 'Hide examples' : 'More examples'}
          <RiArrowDownSLine
            className={`text-base transition-transform duration-150 ${
              examplesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {examplesOpen && (
          <div className="mt-2 grid gap-2">
            {examplesLoading && (
              <p className="rounded-md border border-dashed border-ink-200 bg-white px-3 py-2 text-xs text-ink-400">
                Loading examples...
              </p>
            )}

            {!examplesLoading && examplesError && (
              <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                {examplesError}
              </p>
            )}

            {!examplesLoading && !examplesError && examples.length === 0 && (
              <p className="rounded-md border border-dashed border-ink-200 bg-white px-3 py-2 text-xs text-ink-400">
                No extra examples found.
              </p>
            )}

            {!examplesLoading &&
              examples.map((example) => (
                <div
                  key={example.id}
                  className="rounded-md border border-ink-50 bg-white px-3 py-2.5"
                >
                  <p className="font-display text-base leading-relaxed text-ink-900">
                    {example.chinese}
                  </p>
                  {example.pinyin && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {formatPinyin(example.pinyin)}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink-400">{example.english}</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {onSaveWord && (
        <div className="mt-4 pt-3 border-t border-ink-50 flex flex-wrap items-end gap-2">
          {canSaveWords && decks.length > 0 && (
            <div className="relative flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium uppercase text-ink-400">Save to deck</span>
                {alreadySaved && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                    Already saved
                  </span>
                )}
              </div>
              <button
                className="min-w-48 inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-ink-900 outline-none transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400"
                type="button"
                onClick={() => setIsDeckMenuOpen((value) => !value)}
              >
                <RiStackLine className="text-sm text-ink-400" />
                <span className="flex-1 text-left truncate">{selectedDeck?.name ?? 'Choose deck'}</span>
                <RiArrowDownSLine
                  className={`text-base text-ink-400 transition-transform duration-150 ${
                    isDeckMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDeckMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors duration-150 ${
                        deck.id === selectedDeckId
                          ? 'bg-red-50 text-red-800'
                          : 'text-ink-900 hover:bg-ink-0'
                      }`}
                      type="button"
                      onClick={() => {
                        onSelectedDeckChange?.(deck.id)
                        setIsDeckMenuOpen(false)
                      }}
                    >
                      <span className="truncate">{deck.name}</span>
                      <span className="text-[11px] opacity-60">{deck.wordCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="btn-secondary px-3 py-1.5 rounded-md text-xs font-medium"
            onClick={() =>
              selectedDeckId && void onSaveWord(entry, selectedDeckId, exampleSentence)
            }
            disabled={!canSaveToDeck || alreadySaved || savingWord === entry.word}
          >
            {savingWord === entry.word
              ? 'Saving...'
              : alreadySaved
                ? 'Saved'
              : canSaveWords
                ? 'Save word'
                : 'Sign in to save words'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function GradedOutput({
  results,
  showPinyin,
  wordSpacing,
  onShowPinyinChange,
  onWordSpacingChange,
  resetKey = 0,
  decks = [],
  selectedDeckId,
  onSelectedDeckChange,
  onSaveWord,
  savingWord,
  canSaveWords,
  isWordSaved,
}: Props) {
  const [selected, setSelected] = useState<{ entry: AnalyzedWord; index: number } | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [resetKey])

  const wordResults = results.filter(
    (entry): entry is AnalyzedWord => entry.type === 'word',
  )

  const counts = wordResults.reduce<Record<HskBand | 'none', number>>((acc, entry) => {
    const key = getHskBand(entry.hsk_level) ?? 'none'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<HskBand | 'none', number>)

  const getTokenText = (entry: AnalysisToken) => (entry.type === 'word' ? entry.word : entry.text)

  const getExampleSentence = (index: number) => {
    const boundary = /[。！？!?；;\n]/
    let before = ''
    let after = ''

    for (let i = index - 1; i >= 0; i -= 1) {
      const text = getTokenText(results[i])
      const boundaryIndex = Math.max(
        text.lastIndexOf('。'),
        text.lastIndexOf('！'),
        text.lastIndexOf('？'),
        text.lastIndexOf('!'),
        text.lastIndexOf('?'),
        text.lastIndexOf('；'),
        text.lastIndexOf(';'),
        text.lastIndexOf('\n'),
      )

      if (boundaryIndex >= 0) {
        before = text.slice(boundaryIndex + 1) + before
        break
      }

      before = text + before
    }

    for (let i = index + 1; i < results.length; i += 1) {
      const text = getTokenText(results[i])
      const boundaryIndex = text.search(boundary)

      if (boundaryIndex >= 0) {
        after += text.slice(0, boundaryIndex + 1)
        break
      }

      after += text
    }

    return `${before}${getTokenText(results[index])}${after}`.replace(/\s+/g, ' ').trim()
  }

  return (
    <div className="bg-white border border-ink-50 rounded-lg px-7 py-6 min-h-[420px]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-medium text-ink-400">{wordResults.length} words</span>
          <div className="flex gap-1.5 flex-wrap">
            {HSK_BANDS.map((band) => {
              const color = HSK_COLORS[band]
              const count = counts[band] ?? 0
              return count ? (
                <span
                  key={band}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: color.bg, color: color.text }}
                >
                  {color.label}: {count}
                </span>
              ) : null
            })}
            {counts.none ? (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: UNKNOWN_HSK_COLOR.bg, color: UNKNOWN_HSK_COLOR.text }}
              >
                Unknown: {counts.none}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-ink-0 rounded-md p-1">
            <button
              className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                showPinyin ? 'bg-red-600 text-white' : 'text-ink-400 hover:bg-white hover:text-ink-900'
              }`}
              onClick={() => onShowPinyinChange(true)}
            >
              Pinyin on
            </button>
            <button
              className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                !showPinyin ? 'bg-red-600 text-white' : 'text-ink-400 hover:bg-white hover:text-ink-900'
              }`}
              onClick={() => onShowPinyinChange(false)}
            >
              Off
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
              wordSpacing
                ? 'bg-red-600 text-white border-red-600'
                : 'text-ink-400 border-ink-200 hover:bg-ink-0 hover:text-ink-900 hover:border-ink-400'
            }`}
            onClick={() => onWordSpacingChange(!wordSpacing)}
          >
            Spacing {wordSpacing ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div className="leading-loose font-display whitespace-pre-wrap" style={{ fontSize: 22 }}>
        {results.map((entry, index) =>
          entry.type === 'word' ? (
            <span key={index} className={wordSpacing ? 'mx-1' : ''}>
              <WordChip
                entry={entry}
                isSelected={selected?.index === index}
                showPinyin={showPinyin}
                wordSpacing={wordSpacing}
                onClick={(word) =>
                  setSelected((current) => (current?.index === index ? null : { entry: word, index }))
                }
              />
            </span>
          ) : (
            <span key={index} className="text-2xl text-ink-900 font-display">
              {entry.text}
            </span>
          ),
        )}
      </div>

      {selected && (
        <DictPanel
          entry={selected.entry}
          exampleSentence={getExampleSentence(selected.index)}
          decks={decks}
          selectedDeckId={selectedDeckId}
          onSelectedDeckChange={onSelectedDeckChange}
          onClose={() => setSelected(null)}
          onSaveWord={onSaveWord}
          savingWord={savingWord}
          canSaveWords={canSaveWords}
          isWordSaved={isWordSaved}
        />
      )}

      <div className="flex gap-3 mt-5 pt-3 border-t border-ink-50 flex-wrap">
        {HSK_BANDS.map((band) => {
          const color = HSK_COLORS[band]
          return (
          <span
            key={band}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: color.text }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color.text }} />
            {color.label}
          </span>
          )
        })}
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: UNKNOWN_HSK_COLOR.text }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: UNKNOWN_HSK_COLOR.text }} />
          Unknown
        </span>
      </div>
    </div>
  )
}
