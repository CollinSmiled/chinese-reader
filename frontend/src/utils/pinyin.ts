  const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
}

function convertSyllable(value: string) {
  const match = value.match(/^([a-züv:]+)([1-5])$/i)
  if (!match) return value

  const [, rawSyllable, rawTone] = match
  const tone = Number(rawTone)
  let syllable = rawSyllable.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü')

  if (tone === 5) return syllable

  const markAt = (vowel: string) => {
    const index = syllable.indexOf(vowel)
    if (index < 0) return false
    syllable =
      syllable.slice(0, index) +
      TONE_MARKS[vowel][tone - 1] +
      syllable.slice(index + vowel.length)
    return true
  }

  if (markAt('a') || markAt('e')) return syllable
  if (syllable.includes('ou')) return markAt('o') ? syllable : value

  for (let index = syllable.length - 1; index >= 0; index -= 1) {
    const char = syllable[index]
    if (TONE_MARKS[char]) {
      syllable =
        syllable.slice(0, index) +
        TONE_MARKS[char][tone - 1] +
        syllable.slice(index + 1)
      return syllable
    }
  }

  return value
}

export function formatPinyin(value?: string | null) {
  if (!value) return ''

  return value
    .split(/(\s+)/)
    .map((part) => (/\s+/.test(part) ? part : convertSyllable(part)))
    .join('')
}
