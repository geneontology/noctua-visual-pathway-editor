import { describe, it, expect } from 'vitest'
import {
  getNodeCategory,
  getPrimaryRootType,
  molecularFunction,
  biologicalProcess,
  cellularComponent,
  molecularEntity,
  chemicalEntity,
  proteinContainingComplex,
  biologicalPhase,
} from '@/features/gocam/data/nodeCategories'
import { Aspect, RootTypes } from '@/features/gocam/models/cam'

describe('getNodeCategory', () => {
  it('looks up every aspect-carrying root type', () => {
    expect(getNodeCategory(RootTypes.MOLECULAR_FUNCTION)?.aspect).toBe(Aspect.MOLECULAR_FUNCTION)
    expect(getNodeCategory(RootTypes.BIOLOGICAL_PROCESS)?.aspect).toBe(Aspect.BIOLOGICAL_PROCESS)
    expect(getNodeCategory(RootTypes.CELLULAR_COMPONENT)?.aspect).toBe(Aspect.CELLULAR_COMPONENT)
  })

  it('returns aspect=null for non-aspect categories (GP, chemical, complex, phase)', () => {
    expect(getNodeCategory(RootTypes.MOLECULAR_ENTITY)?.aspect).toBeNull()
    expect(getNodeCategory(RootTypes.CHEMICAL_ENTITY)?.aspect).toBeNull()
    expect(getNodeCategory(RootTypes.PROTEIN_CONTAINING_COMPLEX)?.aspect).toBeNull()
    expect(getNodeCategory(RootTypes.BIOLOGICAL_PHASE)?.aspect).toBeNull()
  })

  it('returns undefined for an unknown id', () => {
    expect(getNodeCategory('GO:00000-not-real')).toBeUndefined()
    expect(getNodeCategory('')).toBeUndefined()
  })

  it('every returned category exposes searchClosureIds containing its own id', () => {
    for (const rt of [
      RootTypes.MOLECULAR_FUNCTION,
      RootTypes.BIOLOGICAL_PROCESS,
      RootTypes.CELLULAR_COMPONENT,
      RootTypes.MOLECULAR_ENTITY,
      RootTypes.CHEMICAL_ENTITY,
    ]) {
      const cat = getNodeCategory(rt)
      expect(cat?.searchClosureIds).toContain(rt)
    }
  })
})

describe('excludeClosureIds (closure-exclusion clauses)', () => {
  it('chemicalEntity excludes gene products (MOLECULAR_ENTITY)', () => {
    expect(chemicalEntity.excludeClosureIds).toEqual([RootTypes.MOLECULAR_ENTITY])
  })

  it('cellularComponent excludes protein-containing complexes', () => {
    expect(cellularComponent.excludeClosureIds).toEqual([RootTypes.PROTEIN_CONTAINING_COMPLEX])
  })

  it('other categories do not have excludeClosureIds (no exclusions to apply)', () => {
    expect(molecularFunction.excludeClosureIds).toBeUndefined()
    expect(biologicalProcess.excludeClosureIds).toBeUndefined()
    expect(molecularEntity.excludeClosureIds).toBeUndefined()
    expect(proteinContainingComplex.excludeClosureIds).toBeUndefined()
    expect(biologicalPhase.excludeClosureIds).toBeUndefined()
  })

  it('getNodeCategory exposes excludeClosureIds via the lookup', () => {
    expect(getNodeCategory(RootTypes.CHEMICAL_ENTITY)?.excludeClosureIds).toEqual([
      RootTypes.MOLECULAR_ENTITY,
    ])
    expect(getNodeCategory(RootTypes.CELLULAR_COMPONENT)?.excludeClosureIds).toEqual([
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
    ])
  })
})

describe('getPrimaryRootType (most-specific-first resolution)', () => {
  it('resolves a protein complex to the complex, not its CC parent', () => {
    // Minerva tags a complex with both root types, CC listed first.
    expect(
      getPrimaryRootType([RootTypes.CELLULAR_COMPONENT, RootTypes.PROTEIN_CONTAINING_COMPLEX])
    ).toBe(RootTypes.PROTEIN_CONTAINING_COMPLEX)
  })

  it('is order-independent (resolves the complex regardless of root-type order)', () => {
    expect(
      getPrimaryRootType([RootTypes.PROTEIN_CONTAINING_COMPLEX, RootTypes.CELLULAR_COMPONENT])
    ).toBe(RootTypes.PROTEIN_CONTAINING_COMPLEX)
  })

  it('resolves a gene product to the gene product, not its chemical-entity parent', () => {
    expect(getPrimaryRootType([RootTypes.MOLECULAR_ENTITY, RootTypes.CHEMICAL_ENTITY])).toBe(
      RootTypes.MOLECULAR_ENTITY
    )
  })

  it('leaves a plain cellular component as CC', () => {
    expect(getPrimaryRootType([RootTypes.CELLULAR_COMPONENT])).toBe(RootTypes.CELLULAR_COMPONENT)
  })

  it('falls back to the first known-category id when no priority type matches', () => {
    expect(getPrimaryRootType([RootTypes.BIOLOGICAL_PHASE])).toBe(RootTypes.BIOLOGICAL_PHASE)
  })

  it('falls back to the first id when nothing is a known category', () => {
    expect(getPrimaryRootType(['XYZ:1', 'XYZ:2'])).toBe('XYZ:1')
  })

  it('returns null for an empty root-type set', () => {
    expect(getPrimaryRootType([])).toBeNull()
  })
})
