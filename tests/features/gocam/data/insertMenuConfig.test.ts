import { describe, it, expect } from 'vitest'
import { getInsertMenuItems } from '@/features/gocam/data/insertMenuConfig'
import { RootTypes } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'

describe('getInsertMenuItems — protein-complex recursion suppression', () => {
  it('hides "part of → Protein Complex" on a GP reached via has_part', () => {
    const items = getInsertMenuItems(RootTypes.MOLECULAR_ENTITY, [], Relations.HAS_PART)
    expect(items.some(i => i.targetType === RootTypes.PROTEIN_CONTAINING_COMPLEX)).toBe(false)
  })

  it('still offers "part of → Protein Complex" on a GP reached via enabled_by', () => {
    const items = getInsertMenuItems(RootTypes.MOLECULAR_ENTITY, [], Relations.ENABLED_BY)
    expect(items.some(i => i.targetType === RootTypes.PROTEIN_CONTAINING_COMPLEX)).toBe(true)
  })

  it('hides "has part → Gene Product" on a ProteinComplex reached via part_of', () => {
    const items = getInsertMenuItems(
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
      [],
      Relations.PART_OF
    )
    expect(items.some(i => i.targetType === RootTypes.MOLECULAR_ENTITY)).toBe(false)
  })

  it('still offers "has part → Gene Product" on a ProteinComplex reached via enabled_by', () => {
    const items = getInsertMenuItems(
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
      [],
      Relations.ENABLED_BY
    )
    expect(items.some(i => i.targetType === RootTypes.MOLECULAR_ENTITY)).toBe(true)
  })

  it('does not affect BP→BP nesting (legitimate recursion)', () => {
    const items = getInsertMenuItems(
      RootTypes.BIOLOGICAL_PROCESS,
      [],
      Relations.PART_OF
    )
    expect(items.some(i => i.targetType === RootTypes.BIOLOGICAL_PROCESS)).toBe(true)
  })
})
