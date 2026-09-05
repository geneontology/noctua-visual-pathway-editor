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

/** Actions in the toolbar's Select menu. */
export type SelectionPreset =
  | 'all'
  | 'invert'
  | 'activities'
  | 'chemicals'
  | 'complexes'
  | 'noEvidence'

export interface SelectionPresetOption {
  id: SelectionPreset
  label: string
  /** Group heading rendered above this item; omitted for a continuation. */
  group?: string
  shortcut?: string
}

export const selectionPresetOptions: SelectionPresetOption[] = [
  { id: 'all', label: 'Select all', shortcut: 'Ctrl+A' },
  { id: 'invert', label: 'Invert selection' },
  { id: 'activities', label: 'Activities', group: 'By type' },
  { id: 'chemicals', label: 'Chemicals' },
  { id: 'complexes', label: 'Protein complexes' },
  { id: 'noEvidence', label: 'Without evidence', group: 'Quality' },
]
