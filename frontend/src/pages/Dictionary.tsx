import { useEffect, useState } from 'react'
import { RiArrowDownSLine, RiBookOpenLine, RiSearchLine, RiStackLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import type { Deck, DeckWord, DictionarySearchResult, ExampleSentence } from '../types'
import { useAuth } from '../auth/AuthContext'
import { getHskColor } from '../utils/hsk'
import { formatPinyin } from '../utils/pinyin'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getSavedWordKey(word: string, pinyin?: string | null) {
  return `${word.trim()}::${formatPinyin(pinyin).trim().toLowerCase()}`
}

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json()
    if (Array.isArray(data.message)) return data.message.join(', ')
    if (typeof data.message === 'string') return data.message
  } catch {
    // Fall through to status message.
  }

  return `Server error: ${response.status}`
}

export default function Dictionary() {
  const navigate = useNavigate()
  const { user, loading: authLoading, authenticatedFetch } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictionarySearchResult[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>()
  const [selectedDeckWordKeys, setSelectedDeckWordKeys] = useState<Set<string>>(new Set())
  const [isDeckMenuOpen, setIsDeckMenuOpen] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [examplesByKey, setExamplesByKey] = useState<Record<string, ExampleSentence[]>>({})
  const [selectedExampleByKey, setSelectedExampleByKey] = useState<Record<string, string | null>>({})
  const [loadingExamplesKey, setLoadingExamplesKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const loadDecks = async () => {
      if (!user) {
        setDecks([])
        setSelectedDeckId(undefined)
        return
      }

      const response = await authenticatedFetch(`${API_URL}/api/v1/decks`)
      if (!response.ok) return
      const data = (await response.json()) as Deck[]
      setDecks(data)
      setSelectedDeckId((current) => current ?? data.find((deck) => deck.isDefault)?.id ?? data[0]?.id)
    }

    void loadDecks()
  }, [authLoading, authenticatedFetch, user])

  useEffect(() => {
    const loadSelectedDeckWords = async () => {
      if (!user || !selectedDeckId) {
        setSelectedDeckWordKeys(new Set())
        return
      }

      const response = await authenticatedFetch(`${API_URL}/api/v1/decks/${selectedDeckId}/words`)
      if (!response.ok) return

      const words = (await response.json()) as DeckWord[]
      setSelectedDeckWordKeys(
        new Set(words.map((word) => getSavedWordKey(word.word, word.pinyin))),
      )
    }

    void loadSelectedDeckWords()
  }, [authenticatedFetch, selectedDeckId, user])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setError(null)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ q: trimmed, limit: '30' })
        const response = await fetch(`${API_URL}/api/v1/dictionary/search?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Server error: ${response.status}`)
        setResults((await response.json()) as DictionarySearchResult[])
        setExpandedKey(null)
        setExamplesByKey({})
        setSelectedExampleByKey({})
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query])

  const loadExamples = async (entry: DictionarySearchResult, resultKey: string) => {
    if (examplesByKey[resultKey]) return

    setLoadingExamplesKey(resultKey)

    try {
      const params = new URLSearchParams({ word: entry.word, limit: '5' })
      const response = await fetch(`${API_URL}/api/v1/examples?${params}`)
      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const examples = (await response.json()) as ExampleSentence[]
      setExamplesByKey((current) => ({ ...current, [resultKey]: examples }))
      setSelectedExampleByKey((current) => ({
        ...current,
        [resultKey]: current[resultKey] ?? examples[0]?.id ?? null,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingExamplesKey(null)
    }
  }

  const handleToggleResult = (entry: DictionarySearchResult, resultKey: string) => {
    setExpandedKey((current) => (current === resultKey ? null : resultKey))
    void loadExamples(entry, resultKey)
  }

  const handleSaveWord = async (entry: DictionarySearchResult, resultKey: string) => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!selectedDeckId) return

    const savedWordKey = getSavedWordKey(entry.word, entry.pinyin)
    const selectedExampleId = selectedExampleByKey[resultKey]
    setSavingKey(resultKey)
    setSaveMessage(null)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/decks/${selectedDeckId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: entry.word,
          pinyin: entry.pinyin,
          meaning: entry.definitions.join('; '),
          hskLevel: entry.hskLevel,
          exampleSentenceId: selectedExampleId,
        }),
      })

      const deck = decks.find((item) => item.id === selectedDeckId)

      if (response.status === 409) {
        setSaveMessage(`${entry.word} is already in ${deck?.name ?? 'this deck'}`)
        setSelectedDeckWordKeys((current) => new Set(current).add(savedWordKey))
        return
      }

      if (!response.ok) throw new Error(await getErrorMessage(response))

      setDecks((current) =>
        current.map((deckItem) =>
          deckItem.id === selectedDeckId
            ? { ...deckItem, wordCount: deckItem.wordCount + 1 }
            : deckItem,
        ),
      )
      setSelectedDeckWordKeys((current) => new Set(current).add(savedWordKey))
      setSaveMessage(`Saved ${entry.word}${deck ? ` to ${deck.name}` : ''}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSavingKey(null)
    }
  }

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId)
  const getResultKey = (entry: DictionarySearchResult, index: number) =>
    `${entry.word}-${entry.pinyin}-${index}`

  return (
    <div className="flex-1 p-9 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-ink-900 mb-1">Dictionary</h1>
        <p className="text-sm text-ink-400">Search CC-CEDICT entries by Chinese, pinyin, or meaning.</p>
      </div>

      <div className="bg-white border border-ink-50 rounded-lg p-5 mb-5">
        <div className="flex gap-4 items-end">
          <label className="relative block flex-1">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-ink-400" />
            <input
              className="w-full rounded-md border border-ink-50 bg-ink-0 py-3 pl-11 pr-4 text-base text-ink-900 outline-none transition-colors duration-150 placeholder:text-ink-400 hover:border-ink-200 focus:border-red-600"
              placeholder="Search Chinese, pinyin, or English..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {user && decks.length > 0 && (
            <div className="relative w-64">
              <div className="text-xs font-medium uppercase text-ink-400 mb-1.5">
                Save target
              </div>
              <button
                className="w-full inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white py-3 pl-3 pr-2 text-sm font-medium text-ink-900 outline-none transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400"
                type="button"
                onClick={() => setIsDeckMenuOpen((value) => !value)}
              >
                <RiStackLine className="text-base text-ink-400 shrink-0" />
                <span className="flex-1 truncate text-left">
                  {selectedDeck?.name ?? 'Choose deck'}
                </span>
                <RiArrowDownSLine
                  className={`text-lg text-ink-400 transition-transform duration-150 ${
                    isDeckMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDeckMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium transition-colors duration-150 ${
                        deck.id === selectedDeckId
                          ? 'bg-red-50 text-red-800'
                          : 'text-ink-900 hover:bg-ink-0'
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedDeckId(deck.id)
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
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-800 rounded-md text-xs">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-4 px-4 py-3 bg-teal-50 text-teal-800 rounded-md text-xs">
          {saveMessage}
        </div>
      )}

      {loading && <p className="text-sm text-ink-400">Searching dictionary...</p>}

      {!loading && query.trim() && results.length === 0 && !error && (
        <div className="min-h-[220px] flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-ink-200 rounded-lg text-center p-8">
          <p className="text-sm font-medium text-ink-900">No dictionary matches</p>
          <p className="text-xs text-ink-400">Try a shorter Chinese word or an English meaning.</p>
        </div>
      )}

      {!query.trim() && (
        <div className="min-h-[220px] flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-ink-200 rounded-lg text-center p-8">
          <p className="text-sm font-medium text-ink-900">Start with a word</p>
          <p className="text-xs text-ink-400">For example: 今天, shang dian, or store.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white border border-ink-50 rounded-lg divide-y divide-ink-50">
          {results.map((entry, index) => {
            const resultKey = getResultKey(entry, index)
            const alreadySaved = selectedDeckWordKeys.has(getSavedWordKey(entry.word, entry.pinyin))
            const isExpanded = expandedKey === resultKey
            const examples = examplesByKey[resultKey] ?? []
            const selectedExampleId = selectedExampleByKey[resultKey] ?? null

            return (
            <div
              key={resultKey}
              className={`p-5 transition-colors duration-150 ${
                isExpanded ? 'bg-white' : 'hover:bg-ink-0/70'
              }`}
            >
              <button
                className="group flex w-full items-start gap-5 rounded-md text-left transition-opacity duration-150 hover:opacity-95"
                type="button"
                onClick={() => handleToggleResult(entry, resultKey)}
              >
                <div className="min-w-28">
                  <div className="text-2xl font-display font-bold text-ink-900 transition-colors duration-150 group-hover:text-red-800">
                    {entry.word}
                  </div>
                  {entry.traditional && entry.traditional !== entry.word && (
                    <div className="text-xs text-ink-400 mt-1">{entry.traditional}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-red-600">
                      {formatPinyin(entry.pinyin)}
                    </span>
                    {entry.hskLevel && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: getHskColor(entry.hskLevel).bg,
                          color: getHskColor(entry.hskLevel).text,
                        }}
                      >
                        {getHskColor(entry.hskLevel).label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.definitions.map((definition) => (
                      <span
                        key={definition}
                        className="rounded-md bg-ink-0 px-2.5 py-1 text-sm text-ink-900"
                      >
                        {definition}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex w-36 shrink-0 items-start justify-end">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      isExpanded
                        ? 'bg-red-50 text-red-800'
                        : 'bg-ink-0 text-ink-400 group-hover:text-ink-900'
                    }`}
                  >
                    <RiBookOpenLine className="text-sm" />
                    Examples
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 ml-0 rounded-lg border border-ink-50 bg-ink-0 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-ink-400">
                        Example sentences
                      </p>
                      <p className="text-xs text-ink-400">
                        Choose one to attach when saving this word.
                      </p>
                    </div>
                    {user && decks.length > 0 ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {alreadySaved && (
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                            Already saved
                          </span>
                        )}
                        <button
                          className="btn-secondary h-9 rounded-md px-3 text-xs font-medium"
                          onClick={() => void handleSaveWord(entry, resultKey)}
                          disabled={savingKey === resultKey || !selectedDeckId || alreadySaved}
                        >
                          {savingKey === resultKey ? 'Saving...' : alreadySaved ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary h-9 rounded-md px-3 text-xs font-medium"
                        onClick={() => navigate('/auth')}
                      >
                        Sign in to save
                      </button>
                    )}
                  </div>

                  {loadingExamplesKey === resultKey && (
                    <p className="text-sm text-ink-400">Loading examples...</p>
                  )}

                  {loadingExamplesKey !== resultKey && examples.length === 0 && (
                    <p className="rounded-md border border-dashed border-ink-200 bg-white px-4 py-3 text-sm text-ink-400">
                      No examples found for this entry yet.
                    </p>
                  )}

                  {examples.length > 0 && (
                    <div className="grid gap-2">
                      {examples.map((example) => {
                        const selected = example.id === selectedExampleId
                        return (
                          <button
                            key={example.id}
                            className={`rounded-md border px-4 py-3 text-left transition-colors duration-150 ${
                              selected
                                ? 'border-red-600 bg-white'
                                : 'border-ink-50 bg-white hover:border-ink-200 hover:bg-red-50'
                            }`}
                            type="button"
                            onClick={() =>
                              setSelectedExampleByKey((current) => ({
                                ...current,
                                [resultKey]: example.id,
                              }))
                            }
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1 h-2.5 w-2.5 rounded-full border ${
                                  selected
                                    ? 'border-red-600 bg-red-600'
                                    : 'border-ink-200 bg-white'
                                }`}
                              />
                              <span className="min-w-0">
                                <span className="block font-display text-lg text-ink-900">
                                  {example.chinese}
                                </span>
                                {example.pinyin && (
                                  <span className="mt-1 block text-xs font-medium text-red-600">
                                    {formatPinyin(example.pinyin)}
                                  </span>
                                )}
                                <span className="mt-1 block text-sm text-ink-400">
                                  {example.english}
                                </span>
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
