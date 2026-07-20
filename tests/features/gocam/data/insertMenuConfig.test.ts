import { describe, it, expect } from 'vitest'
import {
  getInsertMenuItems,
  getDisplayGroup,
  getInsertWeight,
  getRelationRowLabel,
  DisplayGroup,
} from '@/features/gocam/data/insertMenuConfig'
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

describe('has input — Gene Product or Protein Complex (#270)', () => {
  it('shows a single has input menu item whose search spans gene product + protein complex', () => {
    const hasInput = getInsertMenuItems(RootTypes.MOLECULAR_FUNCTION).filter(
      i => i.predicate.id === Relations.HAS_INPUT
    )
    expect(hasInput).toHaveLength(1)
    expect(hasInput[0].searchRootTypes).toEqual([
      RootTypes.MOLECULAR_ENTITY,
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
    ])
  })

  it('groups a protein-complex has input under the has-input card (MF_INPUT), not GP', () => {
    expect(
      getDisplayGroup(
        RootTypes.MOLECULAR_FUNCTION,
        Relations.HAS_INPUT,
        RootTypes.PROTEIN_CONTAINING_COMPLEX
      )
    ).toBe(DisplayGroup.MF_INPUT)
    // parity with the gene-product input
    expect(
      getDisplayGroup(RootTypes.MOLECULAR_FUNCTION, Relations.HAS_INPUT, RootTypes.MOLECULAR_ENTITY)
    ).toBe(DisplayGroup.MF_INPUT)
  })

  it('weights a protein-complex has input the same as a gene-product has input', () => {
    const gp = getInsertWeight(
      RootTypes.MOLECULAR_FUNCTION,
      Relations.HAS_INPUT,
      RootTypes.MOLECULAR_ENTITY
    )
    const complex = getInsertWeight(
      RootTypes.MOLECULAR_FUNCTION,
      Relations.HAS_INPUT,
      RootTypes.PROTEIN_CONTAINING_COMPLEX
    )
    expect(complex).toBe(gp)
    expect(complex).toBeLessThan(Number.POSITIVE_INFINITY)
  })

  it('labels a protein-complex has input row as a has input', () => {
    expect(
      getRelationRowLabel(
        RootTypes.MOLECULAR_FUNCTION,
        Relations.HAS_INPUT,
        RootTypes.PROTEIN_CONTAINING_COMPLEX
      )
    ).toBe('has input (Gene Product/Protein Complex)')
  })

  // pgaudet on #270: proteins and protein complexes are allowed, not chemicals
  // (chemicals go via the chemical form); inputs cannot be nested.
  it('never targets a chemical — its search spans only proteins and complexes', () => {
    const hasInput = getInsertMenuItems(RootTypes.MOLECULAR_FUNCTION).filter(
      i => i.predicate.id === Relations.HAS_INPUT
    )
    for (const item of hasInput) {
      const roots = item.searchRootTypes ?? [item.targetType]
      expect(roots).not.toContain(RootTypes.CHEMICAL_ENTITY)
      expect(roots).toEqual([RootTypes.MOLECULAR_ENTITY, RootTypes.PROTEIN_CONTAINING_COMPLEX])
    }
  })

  it('does not let a has input value (protein or complex) take another has input — inputs cannot be nested', () => {
    const fromGeneProduct = getInsertMenuItems(RootTypes.MOLECULAR_ENTITY)
    const fromComplex = getInsertMenuItems(RootTypes.PROTEIN_CONTAINING_COMPLEX)
    expect(fromGeneProduct.some(i => i.predicate.id === Relations.HAS_INPUT)).toBe(false)
    expect(fromComplex.some(i => i.predicate.id === Relations.HAS_INPUT)).toBe(false)
  })
})
