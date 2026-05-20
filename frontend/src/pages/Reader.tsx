import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RiArrowDownSLine, RiStackLine } from 'react-icons/ri'
import TextInput from '../components/reader/TextInput'
import GradedOutput from '../components/reader/GradedOutput'
import ReadingProfile from '../components/reader/ReadingProfile'
import type { AnalysisToken, AnalyzedWord, Deck, Reading, ReadingCollection } from '../types'
import { useAuth } from '../auth/AuthContext'
import { formatPinyin } from '../utils/pinyin'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const READER_DRAFT_KEY = 'hanzipath.readerDraft'

interface ReaderDraft {
  currentReadingId?: string
  originalText: string
  title: string
  results: AnalysisToken[] | null
  showPinyin: boolean
  wordSpacing: boolean
}

function readReaderDraft(): ReaderDraft | null {
  try {
    const value = window.sessionStorage.getItem(READER_DRAFT_KEY)
    if (!value) return null
    return JSON.parse(value) as ReaderDraft
  } catch {
    return null
  }
}

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json()
    if (Array.isArray(data.message)) return data.message.join(', ')
    if (typeof data.message === 'string') return data.message
  } catch {
    // Fall through to the generic status message.
  }

  return `Server error: ${response.status}`
}

export default function Reader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authenticatedFetch } = useAuth()
  const [initialDraft] = useState(() => readReaderDraft())
  const [results, setResults] = useState<AnalysisToken[] | null>(initialDraft?.results ?? null)
  const [currentReadingId, setCurrentReadingId] = useState<string | undefined>(
    initialDraft?.currentReadingId,
  )
  const [originalText, setOriginalText] = useState(initialDraft?.originalText ?? '')
  const [title, setTitle] = useState(initialDraft?.title ?? '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showPinyin, setShowPinyin] = useState(initialDraft?.showPinyin ?? true)
  const [wordSpacing, setWordSpacing] = useState(initialDraft?.wordSpacing ?? true)
  const [resetKey, setResetKey] = useState(0)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>()
  const [collections, setCollections] = useState<ReadingCollection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>()
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false)
  const [savingWord, setSavingWord] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    const state = location.state as
      | {
          reading?: Reading
          focus?: boolean
          readerDraft?: {
            currentReadingId?: string
            originalText: string
            title: string
            results: AnalysisToken[]
          }
        }
      | null
    const reading = state?.reading
    const readerDraft = state?.readerDraft

    if (readerDraft) {
      setOriginalText(readerDraft.originalText)
      setTitle(readerDraft.title)
      setResults(readerDraft.results)
      setCurrentReadingId(readerDraft.currentReadingId)
      setSaveMessage(null)
      return
    }

    if (!reading) return

    setOriginalText(reading.originalText)
    setTitle(reading.title ?? '')
    setResults(reading.analyzedContent)
    setCurrentReadingId(reading.id)
    setSelectedCollectionId(reading.collectionId ?? undefined)
    setFocusMode(Boolean(state?.focus))
    setSaveMessage(null)
  }, [location.state])

  useEffect(() => {
    const hasDraft =
      originalText.length > 0 ||
      title.length > 0 ||
      results !== null ||
      showPinyin !== true ||
      wordSpacing !== true

    if (!hasDraft) {
      window.sessionStorage.removeItem(READER_DRAFT_KEY)
      return
    }

    const draft: ReaderDraft = {
      currentReadingId,
      originalText,
      title,
      results,
      showPinyin,
      wordSpacing,
    }

    window.sessionStorage.setItem(READER_DRAFT_KEY, JSON.stringify(draft))
  }, [currentReadingId, originalText, results, showPinyin, title, wordSpacing])

  useEffect(() => {
    const loadUserResources = async () => {
      if (!user) {
        setDecks([])
        setSelectedDeckId(undefined)
        setCollections([])
        setSelectedCollectionId(undefined)
        return
      }

      const [decksResponse, collectionsResponse] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/v1/decks`),
        authenticatedFetch(`${API_URL}/api/v1/reading-collections`),
      ])

      if (decksResponse.ok) {
        const data = (await decksResponse.json()) as Deck[]
        setDecks(data)
        setSelectedDeckId((current) => current ?? data.find((deck) => deck.isDefault)?.id ?? data[0]?.id)
      }

      if (collectionsResponse.ok) {
        const data = (await collectionsResponse.json()) as ReadingCollection[]
        setCollections(data)
        setSelectedCollectionId(
          (current) => current ?? data.find((collection) => collection.isDefault)?.id ?? data[0]?.id,
        )
      }
    }

    void loadUserResources()
  }, [authenticatedFetch, user])

  const handleAnalyze = async (text: string) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setOriginalText(text)
    setTitle('')
    setSaveMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/v1/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(await getErrorMessage(res))
      const data: AnalysisToken[] = await res.json()
      setResults(data)
      setFocusMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!results || !originalText) return

    if (!user) {
      navigate('/auth', {
        state: {
          returnTo: '/',
          readerDraft: {
            originalText,
            title,
            results,
            currentReadingId,
          },
        },
      })
      return
    }

    setSaving(true)
    setError(null)
    setSaveMessage(null)

    try {
      const res = await authenticatedFetch(
        currentReadingId
          ? `${API_URL}/api/v1/readings/${currentReadingId}`
          : `${API_URL}/api/v1/readings`,
        {
        method: currentReadingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          title: title.trim(),
          analyzedContent: results,
          collectionId: selectedCollectionId,
        }),
      })
      if (!res.ok) throw new Error(await getErrorMessage(res))
      const savedReading = (await res.json()) as Reading
      setCurrentReadingId(savedReading.id)
      setSelectedCollectionId(savedReading.collectionId ?? undefined)
      const collection = collections.find((item) => item.id === selectedCollectionId)
      setSaveMessage(
        `Reading ${currentReadingId ? 'updated' : 'saved'}${
          collection ? ` in ${collection.name}` : ''
        }`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setOriginalText('')
    setTitle('')
    setResults(null)
    setCurrentReadingId(undefined)
    setError(null)
    setSaveMessage(null)
    setResetKey((value) => value + 1)
    setFocusMode(false)
    window.sessionStorage.removeItem(READER_DRAFT_KEY)
  }

  const handleSaveWord = async (
    entry: AnalyzedWord,
    deckId: string,
    exampleSentence: string,
  ) => {
    if (!user) {
      navigate('/auth')
      return
    }

    setSavingWord(entry.word)
    setError(null)

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/decks/${deckId}/words`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: entry.word,
            pinyin: formatPinyin(entry.dictionary[0]?.pinyin ?? entry.generated_pinyin),
            meaning: entry.dictionary[0]?.english,
            hskLevel: entry.hsk_level,
            sourceReadingId: currentReadingId,
            exampleSentence,
          }),
        },
      )

      if (response.status === 409) {
        setSaveMessage(`${entry.word} is already in this deck`)
        return
      }

      if (!response.ok) throw new Error(await getErrorMessage(response))
      const deck = decks.find((item) => item.id === deckId)
      setDecks((current) =>
        current.map((item) =>
          item.id === deckId ? { ...item, wordCount: item.wordCount + 1 } : item,
        ),
      )
      setSaveMessage(`Saved ${entry.word}${deck ? ` to ${deck.name}` : ''}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSavingWord(null)
    }
  }

  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId)

  return (
    <div className="flex-1 p-9 overflow-y-auto">

      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink-900 mb-1">Graded Reader</h1>
          <p className="text-sm text-ink-400 leading-relaxed">
            Paste any Chinese text. Words are colored by HSK level.
            Click a word to see its definition.
          </p>
        </div>

        {results && (
          <div className="flex items-start gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-white border border-ink-50 rounded-lg p-1.5">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                focusMode
                  ? 'bg-red-600 text-white border-red-600'
                  : 'text-ink-400 border-ink-200 hover:bg-ink-0 hover:text-ink-900 hover:border-ink-400'
              }`}
              onClick={() => setFocusMode((value) => !value)}
            >
              {focusMode ? 'Edit text' : 'Focus'}
            </button>
            </div>

            {user && (
              <div className="flex items-center gap-2 bg-white border border-ink-50 rounded-lg p-1.5">
                <input
                  className="w-48 px-3 py-2 rounded-md text-sm bg-white text-ink-900 border border-ink-200 outline-none focus:border-ink-400"
                  placeholder="Reading title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <div className="relative">
                  <button
                    className="w-44 inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 outline-none transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400"
                    type="button"
                    onClick={() => setIsCollectionMenuOpen((value) => !value)}
                    disabled={collections.length === 0}
                  >
                    <RiStackLine className="text-base text-ink-400 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {selectedCollection?.name ?? 'Collection'}
                    </span>
                    <RiArrowDownSLine
                      className={`text-lg text-ink-400 transition-transform duration-150 ${
                        isCollectionMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCollectionMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                      <div className="border-b border-ink-50 px-3 py-2 text-[11px] font-medium uppercase text-ink-400">
                        Save to collection
                      </div>
                      {collections.map((collection) => (
                        <button
                          key={collection.id}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
                            collection.id === selectedCollectionId
                              ? 'bg-red-50 text-red-800'
                              : 'text-ink-900 hover:bg-ink-0'
                          }`}
                          type="button"
                          onClick={() => {
                            setSelectedCollectionId(collection.id)
                            setIsCollectionMenuOpen(false)
                          }}
                        >
                          <span className="min-w-0 truncate text-sm font-medium">
                            {collection.name}
                          </span>
                          <span className="shrink-0 text-xs opacity-60">
                            {collection.readingCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn-secondary px-4 py-2 rounded-md text-sm font-medium"
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                >
                  {saving ? 'Saving...' : currentReadingId ? 'Update reading' : 'Save reading'}
                </button>
              </div>
            )}
            {!user && (
              <div className="bg-white border border-ink-50 rounded-lg p-1.5">
                <button
                  className="btn-secondary px-4 py-2 rounded-md text-sm font-medium"
                  onClick={handleSave}
                >
                  Sign in to save
                </button>
              </div>
            )}

            <div className="bg-white border border-ink-50 rounded-lg p-1.5">
            <button
              className="btn-secondary px-4 py-2 rounded-md text-sm font-medium text-ink-400 hover:text-ink-900"
              onClick={handleClear}
            >
              Clear
            </button>
            </div>
          </div>
        )}
      </div>

      <div
        className={`grid gap-6 items-start ${
          results && focusMode
            ? 'grid-cols-1'
            : results
              ? 'grid-cols-[300px_minmax(0,1fr)] items-stretch'
              : 'grid-cols-[380px_minmax(0,1fr)]'
        }`}
      >

        {/* Left — input */}
        <div className={`flex flex-col gap-3 ${focusMode ? 'hidden' : ''}`}>
          <div className="flex flex-col">
            <TextInput
              onAnalyze={handleAnalyze}
              loading={loading}
              text={originalText}
              onTextChange={setOriginalText}
              compact={Boolean(results)}
              stretch={Boolean(results)}
              resetKey={resetKey}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-800 rounded-md text-xs">
              ⚠️ {error} — is your backend running at <code>{API_URL}</code>?
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2.5 text-ink-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
              <span>Segmenting and looking up words…</span>
            </div>
          )}

          {saveMessage && (
            <div className="px-4 py-3 bg-teal-50 text-teal-800 rounded-md text-xs">
              {saveMessage}
            </div>
          )}
        </div>

        {/* Right — output or empty state */}
        <div className="min-w-0">
          {results ? (
            <GradedOutput
              results={results}
              showPinyin={showPinyin}
              wordSpacing={wordSpacing}
              onShowPinyinChange={setShowPinyin}
              onWordSpacingChange={setWordSpacing}
              resetKey={resetKey}
              decks={decks}
              selectedDeckId={selectedDeckId}
              onSelectedDeckChange={setSelectedDeckId}
              onSaveWord={handleSaveWord}
              savingWord={savingWord}
              canSaveWords={Boolean(user && decks.length > 0)}
            />
          ) : (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center gap-2.5 bg-white border-2 border-dashed border-ink-200 rounded-lg text-center p-10">
              <span className="text-4xl">📖</span>
              <p className="text-sm font-medium text-ink-900">Your graded text will appear here</p>
              <p className="text-xs text-ink-400">Paste Chinese text on the left and hit Analyze</p>
            </div>
          )}
        </div>

      </div>

      {results && <ReadingProfile results={results} />}
    </div>
  )
}
