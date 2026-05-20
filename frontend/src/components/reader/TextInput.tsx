interface Props {
  onAnalyze: (text: string) => void
  loading: boolean
  text: string
  onTextChange: (text: string) => void
  compact?: boolean
  stretch?: boolean
  resetKey?: number
}

const SAMPLE = '我昨天去超市买了很多东西，包括苹果、香蕉和牛奶。售货员非常友好，帮助我找到了我需要的所有东西。'

export default function TextInput({
  onAnalyze,
  loading,
  text,
  onTextChange,
  compact = false,
  stretch = false,
}: Props) {
  const handleSubmit = () => {
    if (text.trim()) onAnalyze(text)
  }

  const canSubmit = text.trim().length > 0 && !loading

  return (
    <div
      className={`bg-white border border-ink-50 rounded-lg p-5 flex flex-col gap-3 ${
        stretch ? 'h-full min-h-[420px]' : ''
      }`}
    >

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-ink-900">Paste Chinese text</h2>
        <button
          className="text-xs text-red-600 font-medium transition-colors duration-150 hover:text-red-800"
          onClick={() => onTextChange(SAMPLE)}
        >
          Try a sample →
        </button>
      </div>

      {/* Textarea */}
      <textarea
        className={`w-full flex-1 border border-ink-50 rounded-md px-4 py-3 font-display text-ink-900 bg-ink-0 resize-none outline-none leading-relaxed focus:border-ink-200 transition-colors ${
          compact ? 'text-base' : 'text-lg'
        }`}
        placeholder="粘贴中文文本…"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={compact && stretch ? 12 : compact ? 6 : 10}
      />

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-ink-400">
          {text.length > 0 ? `${text.length} characters` : 'No text yet'}
        </span>
        <button
          className="btn-primary rounded-md px-6 py-2.5 font-semibold text-sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? 'Analyzing…' : 'Analyze 分析'}
        </button>
      </div>

    </div>
  )
}
