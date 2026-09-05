import { describe, it, expect } from 'vitest'
import {
  layoutDetailOptions,
  spacingOptions,
  selectionPresetOptions,
} from '@/features/pathway/data/toolbarOptions'

describe('toolbarOptions — layoutDetailOptions', () => {
  it('mirrors the old VPE Detail menu order: Default / Simple View / Preview', () => {
    expect(layoutDetailOptions.map(o => o.label)).toEqual([
      'Default',
      'Simple View',
      'Preview',
    ])
  })

  it('keeps the camCanvas-consumed ids stable (detailed / activity / simple)', () => {
    expect(layoutDetailOptions.map(o => o.id)).toEqual([
      'detailed',
      'activity',
      'simple',
    ])
  })
})

describe('toolbarOptions — spacingOptions', () => {
  it('mirrors the old VPE Spacing menu order: Compact View / Expanded View', () => {
    expect(spacingOptions.map(o => o.label)).toEqual(['Compact View', 'Expanded View'])
  })

  it('keeps the camCanvas-consumed ids stable (compact / relaxed)', () => {
    expect(spacingOptions.map(o => o.id)).toEqual(['compact', 'relaxed'])
  })
})

describe('selectionPresetOptions', () => {
  it('offers every selection action the toolbar menu needs', () => {
    expect(selectionPresetOptions.map(o => o.id)).toEqual([
      'all',
      'invert',
      'activities',
      'chemicals',
      'complexes',
      'noEvidence',
    ])
  })

  it('has a unique id per action', () => {
    const ids = selectionPresetOptions.map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('labels every action', () => {
    expect(selectionPresetOptions.every(o => o.label.length > 0)).toBe(true)
  })

  it('starts a group at the type filters and the quality filter', () => {
    const grouped = selectionPresetOptions.filter(o => o.group)
    expect(grouped.map(o => [o.id, o.group])).toEqual([
      ['activities', 'By type'],
      ['noEvidence', 'Quality'],
    ])
  })

  it('advertises the Select all shortcut, matching the keyboard hook', () => {
    expect(selectionPresetOptions.find(o => o.id === 'all')?.shortcut).toBe('Ctrl+A')
  })
})
