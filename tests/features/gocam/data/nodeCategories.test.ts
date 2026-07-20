import { describe, it, expect } from 'vitest'
import {
  getNodeCategory,
  getPrimaryRootType,
  getSearchClosures,
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

describe('getSearchClosures (term-search closure resolution)', () => {
  it('unions gene product + protein complex for a has-input target (#270)', () => {
    const { closureIds, excludeClosureIds } = getSearchClosures([
      RootTypes.MOLECULAR_ENTITY,
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
    ])
    // Neither category excludes the other, so both closures are searched (OR'd downstream).
    expect(new Set(closureIds)).toEqual(
      new Set([RootTypes.MOLECULAR_ENTITY, RootTypes.PROTEIN_CONTAINING_COMPLEX])
    )
    expect(closureIds).toHaveLength(2)
    expect(excludeClosureIds).toBeUndefined()
  })

  it('narrows a Minerva gene-product set to gene product only, dropping the parent chemical (#267)', () => {
    const { closureIds, excludeClosureIds } = getSearchClosures([
      RootTypes.MOLECULAR_ENTITY,
      RootTypes.CHEMICAL_ENTITY,
    ])
    expect(closureIds).toEqual([RootTypes.MOLECULAR_ENTITY])
    expect(excludeClosureIds).toBeUndefined()
  })

  it('excludes gene products from a bare chemical search', () => {
    const { closureIds, excludeClosureIds } = getSearchClosures([RootTypes.CHEMICAL_ENTITY])
    expect(closureIds).toEqual([RootTypes.CHEMICAL_ENTITY])
    expect(excludeClosureIds).toEqual([RootTypes.MOLECULAR_ENTITY])
  })

  it('narrows a Minerva complex set to complex only, dropping the parent cellular component', () => {
    const { closureIds } = getSearchClosures([
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
      RootTypes.CELLULAR_COMPONENT,
    ])
    expect(closureIds).toEqual([RootTypes.PROTEIN_CONTAINING_COMPLEX])
  })

  it('excludes protein complexes from a bare cellular-component search', () => {
    const { closureIds, excludeClosureIds } = getSearchClosures([RootTypes.CELLULAR_COMPONENT])
    expect(closureIds).toEqual([RootTypes.CELLULAR_COMPONENT])
    expect(excludeClosureIds).toEqual([RootTypes.PROTEIN_CONTAINING_COMPLEX])
  })

  it('returns a single-category closure unchanged', () => {
    const { closureIds, excludeClosureIds } = getSearchClosures([RootTypes.MOLECULAR_ENTITY])
    expect(closureIds).toEqual([RootTypes.MOLECULAR_ENTITY])
    expect(excludeClosureIds).toBeUndefined()
  })

  it('falls back to the raw root types when none map to a known category', () => {
    const { closureIds } = getSearchClosures(['XYZ:999'])
    expect(closureIds).toEqual(['XYZ:999'])
  })
})

describe('has input range — proteins and protein complexes, not chemicals (#270)', () => {
  // pgaudet on #270: "Proteins and protein complexes are allowed, not chemicals, these
  // should be added via the chemical form" and "there can be multiple inputs".
  it('accepts a gene product (a protein, not a complex) and a protein complex, but not a chemical', () => {
    const range = molecularFunction.hasInput.range
    expect(range).toContain(RootTypes.MOLECULAR_ENTITY) // gene product = a protein, not a complex
    expect(range).toContain(RootTypes.PROTEIN_CONTAINING_COMPLEX)
    expect(range).not.toContain(RootTypes.CHEMICAL_ENTITY)
  })

  it('allows multiple inputs (multivalued, not nested)', () => {
    expect(molecularFunction.hasInput.multivalued).toBe(true)
  })

  it('search spans the protein closure (non-complex) and the complex closure, never chemicals', () => {
    const { closureIds } = getSearchClosures(molecularFunction.hasInput.range)
    // a protein that is NOT a protein complex still resolves — gene products are searchable
    expect(closureIds).toContain(RootTypes.MOLECULAR_ENTITY)
    expect(closureIds).toContain(RootTypes.PROTEIN_CONTAINING_COMPLEX)
    // chemicals are added via the chemical form, so they must never be in the has-input search
    expect(closureIds).not.toContain(RootTypes.CHEMICAL_ENTITY)
  })
})
