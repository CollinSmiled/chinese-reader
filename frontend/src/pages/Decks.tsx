import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiArrowDownSLine, RiDeleteBin6Line, RiEdit2Line, RiStackLine } from 'react-icons/ri'
import { useAuth } from '../auth/AuthContext'
import type { Deck, DeckWord } from '../types'
import { formatPinyin } from '../utils/pinyin'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

export default function Decks() {
  const navigate = useNavigate()
  const { user, loading: authLoading, authenticatedFetch } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [words, setWords] = useState<DeckWord[]>([])
  const [name, setName] = useState('')
  const [deckMenuOpen, setDeckMenuOpen] = useState(false)
  const [editingDeckName, setEditingDeckName] = useState('')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updatingDeck, setUpdatingDeck] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState(false)
  const [removingWordId, setRemovingWordId] = useState<string | null>(null)
  const [movingWordId, setMovingWordId] = useState<string | null>(null)
  const [openMoveMenuWordId, setOpenMoveMenuWordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const loadDecks = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await authenticatedFetch(`${API_URL}/api/v1/decks`)
        if (!response.ok) throw new Error(await getErrorMessage(response))
        const data = (await response.json()) as Deck[]
        setDecks(data)
        setSelectedDeckId((current) => current ?? data[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void loadDecks()
  }, [authLoading, authenticatedFetch, user])

  useEffect(() => {
    if (!selectedDeckId) return

    const loadWords = async () => {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/decks/${selectedDeckId}/words`,
      )
      if (!response.ok) return
      setWords((await response.json()) as DeckWord[])
    }

    void loadWords()
  }, [authenticatedFetch, selectedDeckId])

  const handleCreateDeck = async () => {
    if (!name.trim()) return

    setCreating(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      const deck = (await response.json()) as Deck
      setDecks((current) => [...current, deck])
      setSelectedDeckId(deck.id)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  const handleStartRename = () => {
    if (!selectedDeck) return
    setEditingDeckId(selectedDeck.id)
    setEditingDeckName(selectedDeck.name)
  }

  const handleRenameDeck = async () => {
    if (!selectedDeck || !editingDeckName.trim()) return

    setUpdatingDeck(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/decks/${selectedDeck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingDeckName.trim() }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const updatedDeck = (await response.json()) as Deck
      setDecks((current) =>
        current.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)),
      )
      setEditingDeckId(null)
      setEditingDeckName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdatingDeck(false)
    }
  }

  const handleDeleteDeck = async () => {
    if (!selectedDeck || selectedDeck.isDefault) return

    setDeletingDeck(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/decks/${selectedDeck.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const nextDecks = decks.filter((deck) => deck.id !== selectedDeck.id)
      setDecks(nextDecks)
      setSelectedDeckId(nextDecks[0]?.id ?? null)
      setWords([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDeletingDeck(false)
    }
  }

  const handleMoveWord = async (wordId: string, targetDeckId: string) => {
    if (!selectedDeckId || targetDeckId === selectedDeckId) return

    setOpenMoveMenuWordId(null)
    setMovingWordId(wordId)
    setError(null)

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/decks/${selectedDeckId}/words/${wordId}/move`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetDeckId }),
        },
      )
      if (!response.ok) throw new Error(await getErrorMessage(response))

      setWords((current) => current.filter((word) => word.id !== wordId))
      setDecks((current) =>
        current.map((deck) => {
          if (deck.id === selectedDeckId) {
            return { ...deck, wordCount: Math.max(0, deck.wordCount - 1) }
          }
          if (deck.id === targetDeckId) {
            return { ...deck, wordCount: deck.wordCount + 1 }
          }
          return deck
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setMovingWordId(null)
    }
  }

  const handleRemoveWord = async (wordId: string) => {
    if (!selectedDeckId) return

    setRemovingWordId(wordId)
    setError(null)

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/decks/${selectedDeckId}/words/${wordId}`,
        { method: 'DELETE' },
      )
      if (!response.ok) throw new Error(await getErrorMessage(response))

      setWords((current) => current.filter((word) => word.id !== wordId))
      setDecks((current) =>
        current.map((deck) =>
          deck.id === selectedDeckId
            ? { ...deck, wordCount: Math.max(0, deck.wordCount - 1) }
            : deck,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRemovingWordId(null)
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="flex-1 p-9 overflow-y-auto">
        <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 bg-white border-2 border-dashed border-ink-200 rounded-lg text-center p-8">
          <p className="text-sm font-medium text-ink-900">Sign in to use decks</p>
          <button
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
            onClick={() => navigate('/auth')}
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId)

  return (
    <div className="flex-1 p-9 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-ink-900 mb-1">Decks</h1>
        <p className="text-sm text-ink-400">Organize saved words into focused study decks.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-800 rounded-md text-xs">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="bg-white border border-ink-50 rounded-lg p-5">
          <div className="flex items-end gap-4">
            <div className="relative flex-1 min-w-0">
              <div className="text-xs font-medium uppercase text-ink-400 mb-1.5">
                Current deck
              </div>
              <button
                className="w-full flex items-center gap-3 rounded-md border border-ink-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400"
                onClick={() => setDeckMenuOpen((value) => !value)}
                type="button"
              >
                <RiStackLine className="text-lg text-ink-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900 truncate">
                    {selectedDeck?.name ?? 'Select a deck'}
                  </div>
                  <div className="text-xs text-ink-400">
                    {selectedDeck ? `${selectedDeck.wordCount} saved words` : 'Choose where to browse'}
                  </div>
                </div>
                <RiArrowDownSLine
                  className={`text-xl text-ink-400 transition-transform duration-150 ${
                    deckMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {deckMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                  {loading && <p className="px-4 py-3 text-sm text-ink-400">Loading decks...</p>}
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                        deck.id === selectedDeckId
                          ? 'bg-red-50 text-red-800'
                          : 'text-ink-900 hover:bg-ink-0'
                      }`}
                      onClick={() => {
                        setSelectedDeckId(deck.id)
                        setDeckMenuOpen(false)
                      }}
                      type="button"
                    >
                      <span className="text-sm font-medium truncate">{deck.name}</span>
                      <span className="text-xs opacity-70">{deck.wordCount} words</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[360px] flex gap-2">
            <input
              className="min-w-0 flex-1 px-3 py-2 rounded-md text-sm bg-ink-0 border border-ink-50 outline-none focus:border-ink-200"
              placeholder="New deck"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              className="btn-primary px-3 py-2 rounded-md text-sm font-medium"
              onClick={handleCreateDeck}
              disabled={creating || !name.trim()}
            >
              Add
            </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-50 rounded-lg p-6 min-h-[320px]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {selectedDeck && editingDeckId === selectedDeck.id ? (
                <div className="flex max-w-xl gap-2">
                  <input
                    className="min-w-0 flex-1 px-3 py-2 rounded-md text-sm bg-ink-0 border border-ink-50 outline-none focus:border-ink-200"
                    value={editingDeckName}
                    onChange={(event) => setEditingDeckName(event.target.value)}
                  />
                  <button
                    className="btn-primary px-3 py-2 rounded-md text-sm font-medium"
                    onClick={handleRenameDeck}
                    disabled={updatingDeck || !editingDeckName.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="btn-secondary px-3 py-2 rounded-md text-sm font-medium"
                    onClick={() => setEditingDeckId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">
                    {selectedDeck?.name ?? 'Select a deck'}
                  </h2>
                  {selectedDeck?.isDefault && (
                    <p className="text-xs text-ink-400 mt-1">Default deck</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedDeck && (
                <span className="rounded-full bg-ink-0 px-3 py-1 text-xs font-medium text-ink-400">
                  {words.length} words
                </span>
              )}
              {selectedDeck && editingDeckId !== selectedDeck.id && (
                <button
                  className="btn-quiet rounded-md px-2 py-1.5 text-xs inline-flex items-center gap-1"
                  onClick={handleStartRename}
                >
                  <RiEdit2Line />
                  Rename
                </button>
              )}
              {selectedDeck && !selectedDeck.isDefault && editingDeckId !== selectedDeck.id && (
                <button
                  className="btn-quiet rounded-md px-2 py-1.5 text-xs inline-flex items-center gap-1 hover:text-red-800"
                  onClick={() => void handleDeleteDeck()}
                  disabled={deletingDeck}
                >
                  <RiDeleteBin6Line />
                  {deletingDeck ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {selectedDeck && words.length === 0 && (
            <p className="text-sm text-ink-400">No saved words yet.</p>
          )}

          {words.length > 0 && (
            <div className="flex flex-col divide-y divide-ink-50">
              {words.map((word) => (
                <div key={word.id} className="py-4 grid grid-cols-[220px_minmax(0,1fr)_auto] gap-5 items-start">
                  <div className="min-w-0">
                    <div className="text-lg font-display text-ink-900">{word.word}</div>
                    <div className="text-xs text-red-600 mt-0.5">{formatPinyin(word.pinyin)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-ink-900 leading-relaxed">
                      {word.meaning ?? 'No definition'}
                    </div>
                    {word.exampleSentence && (
                      <div className="mt-3 rounded-md border border-ink-50 bg-ink-0 px-3 py-2.5">
                        <div className="text-[11px] font-medium uppercase text-ink-400 mb-1">
                          Source sentence
                        </div>
                        <p className="text-sm text-ink-900 font-display leading-relaxed">
                          {word.exampleSentence}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-end gap-2">
                    <div className="relative">
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 text-xs font-medium text-ink-900 transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          setOpenMoveMenuWordId((current) =>
                            current === word.id ? null : word.id,
                          )
                        }
                        disabled={movingWordId === word.id || decks.length <= 1}
                        type="button"
                      >
                        <RiStackLine className="text-sm text-ink-400" />
                        {movingWordId === word.id ? 'Moving...' : 'Move to'}
                        <RiArrowDownSLine
                          className={`text-base text-ink-400 transition-transform duration-150 ${
                            openMoveMenuWordId === word.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {openMoveMenuWordId === word.id && (
                        <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                          <div className="border-b border-ink-50 px-3 py-2 text-[11px] font-medium uppercase text-ink-400">
                            Move to deck
                          </div>
                          {decks
                            .filter((deck) => deck.id !== selectedDeckId)
                            .map((deck) => (
                              <button
                                key={deck.id}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-ink-900 transition-colors duration-150 hover:bg-ink-0"
                                onClick={() => void handleMoveWord(word.id, deck.id)}
                                type="button"
                              >
                                <span className="min-w-0 truncate text-sm font-medium">
                                  {deck.name}
                                </span>
                                <span className="shrink-0 text-xs text-ink-400">
                                  {deck.wordCount}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-quiet rounded-md px-2 py-1 text-xs"
                      onClick={() => void handleRemoveWord(word.id)}
                      disabled={removingWordId === word.id}
                    >
                      {removingWordId === word.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
