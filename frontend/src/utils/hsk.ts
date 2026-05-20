import type { HskBand, HskColor } from '../types'

export const HSK_COLORS: Record<HskBand, HskColor> = {
  1: { bg: '#E1F5EE', text: '#085041', label: 'HSK 1' },
  2: { bg: '#E6F1FB', text: '#0C447C', label: 'HSK 2' },
  3: { bg: '#FAEEDA', text: '#633806', label: 'HSK 3' },
  4: { bg: '#FCEBEB', text: '#791F1F', label: 'HSK 4' },
  5: { bg: '#FAECE7', text: '#712B13', label: 'HSK 5' },
  6: { bg: '#EEEDFE', text: '#3C3489', label: 'HSK 6' },
  advanced: { bg: '#E8EEF2', text: '#465560', label: 'HSK 7-9' },
}

export const HSK_BANDS: HskBand[] = [1, 2, 3, 4, 5, 6, 'advanced']

export const UNKNOWN_HSK_COLOR: HskColor = {
  bg: '#F1EFE8',
  text: '#5F5E5A',
  label: 'Unknown',
}

export function getHskBand(level: number | null): HskBand | null {
  if (!level) return null
  if (level >= 7 && level <= 9) return 'advanced'
  if (level >= 1 && level <= 6) return level as HskBand
  return null
}

export function getHskColor(level: number | null): HskColor {
  const band = getHskBand(level)
  return band ? HSK_COLORS[band] : UNKNOWN_HSK_COLOR
}

export function getHskLabel(level: number | null) {
  return getHskColor(level).label
}
