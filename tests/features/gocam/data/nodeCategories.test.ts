import { describe, it, expect } from 'vitest'
import {
  getNodeCategory,
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
