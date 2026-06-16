import { describe, it, expect } from 'vitest'
import {
  layoutDetailOptions,
  spacingOptions,
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
