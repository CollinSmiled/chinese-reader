import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiArrowDownSLine, RiDeleteBin6Line, RiEdit2Line, RiStackLine } from 'react-icons/ri'
import type { Reading, ReadingCollection } from '../types'
import { useAuth } from '../auth/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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

export default function Library() {
  const navigate = useNavigate()
  const { user, loading: authLoading, authenticatedFetch } = useAuth()
  const [collections, setCollections] = useState<ReadingCollection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [readings, setReadings] = useState<Reading[]>([])
  const [name, setName] = useState('')
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false)
  const [openMoveMenuReadingId, setOpenMoveMenuReadingId] = useState<string | null>(null)
  const [editingCollectionName, setEditingCollectionName] = useState('')
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updatingCollection, setUpdatingCollection] = useState(false)
  const [deletingCollection, setDeletingCollection] = useState(false)
  const [movingReadingId, setMovingReadingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingDeleteCollection, setPendingDeleteCollection] =
    useState<ReadingCollection | null>(null)
  const [pendingDeleteReading, setPendingDeleteReading] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const loadCollections = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await authenticatedFetch(`${API_URL}/api/v1/reading-collections`)
        if (!response.ok) throw new Error(await getErrorMessage(response))
        const data = (await response.json()) as ReadingCollection[]
        setCollections(data)
        setSelectedCollectionId((current) => current ?? data[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void loadCollections()
  }, [authLoading, authenticatedFetch, user])

  useEffect(() => {
    if (!selectedCollectionId) return

    const loadReadings = async () => {
      try {
        const params = new URLSearchParams({ collectionId: selectedCollectionId })
        const res = await authenticatedFetch(`${API_URL}/api/v1/readings?${params}`)
        if (!res.ok) throw new Error(await getErrorMessage(res))
        const data = (await res.json()) as Reading[]
        setReadings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    void loadReadings()
  }, [authenticatedFetch, selectedCollectionId])

  const handleCreateCollection = async () => {
    if (!name.trim()) return

    setCreating(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/reading-collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      const collection = (await response.json()) as ReadingCollection
      setCollections((current) => [...current, collection])
      setSelectedCollectionId(collection.id)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  const handleStartRenameCollection = () => {
    if (!selectedCollection) return
    setEditingCollectionId(selectedCollection.id)
    setEditingCollectionName(selectedCollection.name)
  }

  const handleRenameCollection = async () => {
    if (!selectedCollection || !editingCollectionName.trim()) return

    setUpdatingCollection(true)
    setError(null)

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/reading-collections/${selectedCollection.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingCollectionName.trim() }),
        },
      )
      if (!response.ok) throw new Error(await getErrorMessage(response))
      const updatedCollection = (await response.json()) as ReadingCollection
      setCollections((current) =>
        current.map((collection) =>
          collection.id === updatedCollection.id ? updatedCollection : collection,
        ),
      )
      setEditingCollectionId(null)
      setEditingCollectionName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdatingCollection(false)
    }
  }

  const handleDeleteCollection = async () => {
    const collectionToDelete = pendingDeleteCollection ?? selectedCollection
    if (!collectionToDelete || collectionToDelete.isDefault) return

    setDeletingCollection(true)
    setError(null)

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/v1/reading-collections/${collectionToDelete.id}`,
        { method: 'DELETE' },
      )
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const movedReadingCount = collectionToDelete.readingCount
      const nextCollections = collections
        .filter((collection) => collection.id !== collectionToDelete.id)
        .map((collection) =>
          collection.isDefault
            ? { ...collection, readingCount: collection.readingCount + movedReadingCount }
            : collection,
        )
      setCollections(nextCollections)
      setSelectedCollectionId(
        nextCollections.find((collection) => collection.isDefault)?.id ??
          nextCollections[0]?.id ??
          null,
      )
      setReadings([])
      setPendingDeleteCollection(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDeletingCollection(false)
    }
  }

  const handleMoveReading = async (readingId: string, targetCollectionId: string) => {
    if (!selectedCollectionId || targetCollectionId === selectedCollectionId) return

    setOpenMoveMenuReadingId(null)
    setMovingReadingId(readingId)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/readings/${readingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: targetCollectionId }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))

      setReadings((current) => current.filter((reading) => reading.id !== readingId))
      setCollections((current) =>
        current.map((collection) => {
          if (collection.id === selectedCollectionId) {
            return {
              ...collection,
              readingCount: Math.max(0, collection.readingCount - 1),
            }
          }
          if (collection.id === targetCollectionId) {
            return { ...collection, readingCount: collection.readingCount + 1 }
          }
          return collection
        }),
      )
      setPendingDeleteReading(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setMovingReadingId(null)
    }
  }

  const handleRemove = async (readingId: string) => {
    setRemovingId(readingId)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/readings/${readingId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      setReadings((current) => current.filter((reading) => reading.id !== readingId))
      setCollections((current) =>
        current.map((collection) =>
          collection.id === selectedCollectionId
            ? { ...collection, readingCount: Math.max(0, collection.readingCount - 1) }
            : collection,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRemovingId(null)
    }
  }

  const selectedCollection = collections.find(
    (collection) => collection.id === selectedCollectionId,
  )

  return (
    <div className="flex-1 p-9 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-ink-900 mb-1">Library</h1>
        <p className="text-sm text-ink-400">Saved readings organized into collections.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-800 rounded-md text-xs">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-ink-400">Loading library...</p>}

      {!loading && !error && !user && (
        <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 bg-white border-2 border-dashed border-ink-200 rounded-lg text-center p-8">
          <p className="text-sm font-medium text-ink-900">Sign in to view your library</p>
          <button
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
            onClick={() => navigate('/auth')}
          >
            Sign in
          </button>
        </div>
      )}

      {!loading && user && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-ink-50 rounded-lg p-5">
            <div className="flex items-end gap-4">
              <div className="relative flex-1 min-w-0">
                <div className="text-xs font-medium uppercase text-ink-400 mb-1.5">
                  Current collection
                </div>
                <button
                  className="w-full flex items-center gap-3 rounded-md border border-ink-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400"
                  onClick={() => setCollectionMenuOpen((value) => !value)}
                  type="button"
                >
                  <RiStackLine className="text-lg text-ink-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink-900 truncate">
                      {selectedCollection?.name ?? 'Select a collection'}
                    </div>
                    <div className="text-xs text-ink-400">
                      {selectedCollection
                        ? `${selectedCollection.readingCount} saved readings`
                        : 'Choose what to browse'}
                    </div>
                  </div>
                  <RiArrowDownSLine
                    className={`text-xl text-ink-400 transition-transform duration-150 ${
                      collectionMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {collectionMenuOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                    {collections.map((collection) => (
                      <button
                        key={collection.id}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                          collection.id === selectedCollectionId
                            ? 'bg-red-50 text-red-800'
                            : 'text-ink-900 hover:bg-ink-0'
                        }`}
                        onClick={() => {
                          setSelectedCollectionId(collection.id)
                          setCollectionMenuOpen(false)
                        }}
                        type="button"
                      >
                        <span className="text-sm font-medium truncate">{collection.name}</span>
                        <span className="text-xs opacity-70">
                          {collection.readingCount} readings
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-[360px] flex gap-2">
                <input
                  className="min-w-0 flex-1 px-3 py-2 rounded-md text-sm bg-ink-0 border border-ink-50 outline-none focus:border-ink-200"
                  placeholder="New collection"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <button
                  className="btn-primary px-3 py-2 rounded-md text-sm font-medium"
                  onClick={handleCreateCollection}
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
                {selectedCollection && editingCollectionId === selectedCollection.id ? (
                  <div className="flex max-w-xl gap-2">
                    <input
                      className="min-w-0 flex-1 px-3 py-2 rounded-md text-sm bg-ink-0 border border-ink-50 outline-none focus:border-ink-200"
                      value={editingCollectionName}
                      onChange={(event) => setEditingCollectionName(event.target.value)}
                    />
                    <button
                      className="btn-primary px-3 py-2 rounded-md text-sm font-medium"
                      onClick={handleRenameCollection}
                      disabled={updatingCollection || !editingCollectionName.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="btn-secondary px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setEditingCollectionId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">
                      {selectedCollection?.name ?? 'Select a collection'}
                    </h2>
                    {selectedCollection?.isDefault && (
                      <p className="text-xs text-ink-400 mt-1">Default collection</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedCollection && (
                  <span className="rounded-full bg-ink-0 px-3 py-1 text-xs font-medium text-ink-400">
                    {readings.length} readings
                  </span>
                )}
                {selectedCollection && editingCollectionId !== selectedCollection.id && (
                  <button
                    className="btn-quiet rounded-md px-2 py-1.5 text-xs inline-flex items-center gap-1"
                    onClick={handleStartRenameCollection}
                  >
                    <RiEdit2Line />
                    Rename
                  </button>
                )}
                {selectedCollection && !selectedCollection.isDefault && editingCollectionId !== selectedCollection.id && (
                  <button
                    className="btn-quiet rounded-md px-2 py-1.5 text-xs inline-flex items-center gap-1 hover:text-red-800"
                    onClick={() => setPendingDeleteCollection(selectedCollection)}
                    disabled={deletingCollection}
                  >
                    <RiDeleteBin6Line />
                    {deletingCollection ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            {selectedCollection && readings.length === 0 && (
              <p className="text-sm text-ink-400">No saved readings in this collection yet.</p>
            )}

            {readings.length > 0 && (
              <div className="flex flex-col divide-y divide-ink-50">
                {readings.map((reading) => (
                  <div
                    key={reading.id}
                    className="group -mx-3 grid grid-cols-[minmax(0,1fr)_auto] gap-5 items-start rounded-md px-3 py-4 transition-colors duration-150 hover:bg-ink-0"
                  >
                    <button
                      className="min-w-0 rounded-md text-left transition-transform duration-150 hover:translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
                      onClick={() => navigate('/', { state: { reading, focus: true } })}
                    >
                      <h3 className="text-base font-semibold text-ink-900 mb-1 transition-colors duration-150 group-hover:text-red-800">
                        {reading.title ?? 'Untitled reading'}
                      </h3>
                      <p className="text-sm text-ink-400 line-clamp-2 font-display">
                        {reading.originalText}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-400">
                        <span>{reading.wordCount} words</span>
                        <span>{formatDate(reading.createdAt)}</span>
                      </div>
                    </button>

                    <div className="flex items-start justify-end gap-2">
                      <div className="relative">
                        <button
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 text-xs font-medium text-ink-900 transition-colors duration-150 hover:bg-ink-0 hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() =>
                            setOpenMoveMenuReadingId((current) =>
                              current === reading.id ? null : reading.id,
                            )
                          }
                          disabled={movingReadingId === reading.id || collections.length <= 1}
                          type="button"
                        >
                          <RiStackLine className="text-sm text-ink-400" />
                          {movingReadingId === reading.id ? 'Moving...' : 'Move to'}
                          <RiArrowDownSLine
                            className={`text-base text-ink-400 transition-transform duration-150 ${
                              openMoveMenuReadingId === reading.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {openMoveMenuReadingId === reading.id && (
                          <div className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-md border border-ink-200 bg-white shadow-sm">
                            <div className="border-b border-ink-50 px-3 py-2 text-[11px] font-medium uppercase text-ink-400">
                              Move to collection
                            </div>
                            {collections
                              .filter((collection) => collection.id !== selectedCollectionId)
                              .map((collection) => (
                                <button
                                  key={collection.id}
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-ink-900 transition-colors duration-150 hover:bg-ink-0"
                                  onClick={() =>
                                    void handleMoveReading(reading.id, collection.id)
                                  }
                                  type="button"
                                >
                                  <span className="min-w-0 truncate text-sm font-medium">
                                    {collection.name}
                                  </span>
                                  <span className="shrink-0 text-xs text-ink-400">
                                    {collection.readingCount}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn-quiet rounded-md p-2 text-sm"
                        onClick={() => setPendingDeleteReading(reading)}
                        disabled={removingId === reading.id}
                        title="Remove reading"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(pendingDeleteCollection || pendingDeleteReading) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/20 px-4">
          <div className="w-full max-w-sm rounded-lg border border-ink-50 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-900">
              {pendingDeleteCollection ? 'Delete collection?' : 'Delete reading?'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              {pendingDeleteCollection
                ? `Readings in ${pendingDeleteCollection.name} will move back to Saved Readings.`
                : `This removes ${pendingDeleteReading?.title ?? 'this reading'} from your library.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="btn-secondary rounded-md px-3 py-2 text-sm font-medium"
                onClick={() => {
                  setPendingDeleteCollection(null)
                  setPendingDeleteReading(null)
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-md border border-red-600 bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-800 hover:border-red-800 disabled:opacity-60"
                onClick={() =>
                  pendingDeleteCollection
                    ? void handleDeleteCollection()
                    : pendingDeleteReading && void handleRemove(pendingDeleteReading.id)
                }
                disabled={deletingCollection || removingId === pendingDeleteReading?.id}
              >
                {deletingCollection || removingId === pendingDeleteReading?.id
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
