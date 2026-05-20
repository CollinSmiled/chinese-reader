import type { AnalysisToken, AnalyzedWord, HskBand } from '../../types'
import { getHskBand, HSK_BANDS, HSK_COLORS } from '../../utils/hsk'

interface Props {
  results: AnalysisToken[]
}

function getWordTokens(results: AnalysisToken[]) {
  return results.filter((entry): entry is AnalyzedWord => entry.type === 'word')
}

function getText(results: AnalysisToken[]) {
  return results.map((entry) => (entry.type === 'word' ? entry.word : entry.text)).join('')
}

function getDifficultyLabel(estimatedHsk: number | null, unknownPercent: number) {
  if (!estimatedHsk) return 'Needs lookup'
  if (estimatedHsk <= 2 && unknownPercent < 20) return 'Comfortable'
  if (estimatedHsk <= 4 && unknownPercent < 35) return 'Stretch'
  return 'Challenging'
}

export default function ReadingProfile({ results }: Props) {
  const words = getWordTokens(results)
  const uniqueWords = new Set(words.map((entry) => entry.word)).size
  const unknownWords = words.filter((entry) => !getHskBand(entry.hsk_level)).length
  const knownHskWords = words.filter((entry) => entry.hsk_level)
  const estimatedHsk =
    knownHskWords.length > 0
      ? Math.max(...knownHskWords.map((entry) => entry.hsk_level ?? 0))
      : null
  const unknownPercent = words.length > 0 ? Math.round((unknownWords / words.length) * 100) : 0
  const text = getText(results)
  const sentenceCount = Math.max(1, (text.match(/[。！？!?]/g) ?? []).length)
  const averageSentenceLength = Math.round(words.length / sentenceCount)
  const difficultyLabel = getDifficultyLabel(estimatedHsk, unknownPercent)
  const hskCounts = words.reduce<Record<HskBand, number>>((acc, entry) => {
    const band = getHskBand(entry.hsk_level)
    if (!band) return acc
    acc[band] = (acc[band] ?? 0) + 1
    return acc
  }, {} as Record<HskBand, number>)

  return (
    <section className="mt-6 bg-white border border-ink-50 rounded-lg px-7 py-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold font-display text-ink-900">Reading profile</h2>
          <p className="text-sm text-ink-400 mt-1">
            A quick difficulty summary based on vocabulary level and sentence shape.
          </p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
          {difficultyLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="rounded-md bg-ink-0 px-4 py-3">
          <div className="text-xs text-ink-400 mb-1">Estimated level</div>
          <div className="text-lg font-semibold text-ink-900">
            {estimatedHsk ? (estimatedHsk >= 7 ? 'HSK 7-9' : `HSK ${estimatedHsk}`) : 'Unknown'}
          </div>
        </div>
        <div className="rounded-md bg-ink-0 px-4 py-3">
          <div className="text-xs text-ink-400 mb-1">Unknown vocab</div>
          <div className="text-lg font-semibold text-ink-900">{unknownPercent}%</div>
        </div>
        <div className="rounded-md bg-ink-0 px-4 py-3">
          <div className="text-xs text-ink-400 mb-1">Unique words</div>
          <div className="text-lg font-semibold text-ink-900">{uniqueWords}</div>
        </div>
        <div className="rounded-md bg-ink-0 px-4 py-3">
          <div className="text-xs text-ink-400 mb-1">Avg sentence</div>
          <div className="text-lg font-semibold text-ink-900">
            {averageSentenceLength} words
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {HSK_BANDS.map((band) => {
          const color = HSK_COLORS[band]
          const count = hskCounts[band] ?? 0
          const percent = words.length > 0 ? Math.round((count / words.length) * 100) : 0

          return (
            <div key={band} className="grid grid-cols-[70px_minmax(0,1fr)_48px] items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: color.text }}>
                {color.label}
              </span>
              <div className="h-2 rounded-full bg-ink-50 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, background: color.text }}
                />
              </div>
              <span className="text-xs text-ink-400 text-right">{count}</span>
            </div>
          )
        })}

        <div className="grid grid-cols-[70px_minmax(0,1fr)_48px] items-center gap-3">
          <span className="text-xs font-semibold text-ink-400">Unknown</span>
          <div className="h-2 rounded-full bg-ink-50 overflow-hidden">
            <div
              className="h-full rounded-full bg-ink-400"
              style={{ width: `${unknownPercent}%` }}
            />
          </div>
          <span className="text-xs text-ink-400 text-right">{unknownWords}</span>
        </div>
      </div>
    </section>
  )
}
