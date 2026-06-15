import type { LayoutDetail, LayoutSpacing } from '../graph/camCanvas'

export const layoutDetailOptions: { id: LayoutDetail; label: string }[] = [
  { id: 'detailed', label: 'Default' },
  { id: 'activity', label: 'Simple View' },
  { id: 'simple', label: 'Preview' },
]

export const spacingOptions: { id: LayoutSpacing; label: string }[] = [
  { id: 'compact', label: 'Compact View' },
  { id: 'relaxed', label: 'Expanded View' },
]
