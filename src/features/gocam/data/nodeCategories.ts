import { Aspect, RootTypes } from '../models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { predicate } from './shapeTerms'
import type { NodeCategory } from '../models/formModels'

interface RelationConstraint {
  predicate: { id: string; label: string }
  range: string[]
  multivalued: boolean
  required: boolean
  excludeFromExtensions: boolean
}

const rel = (
  id: string,
  range: string[],
  opts?: { multivalued?: boolean; required?: boolean; excludeFromExtensions?: boolean }
): RelationConstraint => ({
  predicate: predicate(id),
  range,
  multivalued: opts?.multivalued ?? false,
  required: opts?.required ?? false,
  excludeFromExtensions: opts?.excludeFromExtensions ?? false,
})

// ── Node Categories ─────────────────────────────────────────────────

export const molecularFunction = {
  id: RootTypes.MOLECULAR_FUNCTION,
  label: 'Molecular Function',
  aspect: Aspect.MOLECULAR_FUNCTION as Aspect | null,
  searchClosureIds: [RootTypes.MOLECULAR_FUNCTION],
  enabledBy: rel(Relations.ENABLED_BY, [RootTypes.MOLECULAR_ENTITY, RootTypes.PROTEIN_CONTAINING_COMPLEX], { multivalued: true, excludeFromExtensions: true }),
  partOf: rel(Relations.PART_OF, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  occursIn: rel(Relations.OCCURS_IN, [RootTypes.CELLULAR_COMPONENT]),
  hasInput: rel(Relations.HAS_INPUT, [RootTypes.MOLECULAR_ENTITY, RootTypes.PROTEIN_CONTAINING_COMPLEX], { multivalued: true }),
  happensDuring: rel(Relations.HAPPENS_DURING, [RootTypes.BIOLOGICAL_PHASE, RootTypes.UBERON_STAGE, RootTypes.PLANT_STAGE], { multivalued: true }),
  causallyUpstreamOfOrWithin: rel(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  causallyUpstreamOf: rel(Relations.CAUSALLY_UPSTREAM_OF, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  causallyUpstreamOfPositiveEffect: rel(Relations.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  causallyUpstreamOfNegativeEffect: rel(Relations.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  causallyUpstreamOfOrWithinPositiveEffect: rel(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_POSITIVE_EFFECT, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
  causallyUpstreamOfOrWithinNegativeEffect: rel(Relations.CAUSALLY_UPSTREAM_OF_OR_WITHIN_NEGATIVE_EFFECT, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
}

export const biologicalProcess = {
  id: RootTypes.BIOLOGICAL_PROCESS,
  label: 'Biological Process',
  aspect: Aspect.BIOLOGICAL_PROCESS as Aspect | null,
  searchClosureIds: [RootTypes.BIOLOGICAL_PROCESS],
  partOf: rel(Relations.PART_OF, [RootTypes.BIOLOGICAL_PROCESS], { multivalued: true }),
}

export const cellularComponent = {
  id: RootTypes.CELLULAR_COMPONENT,
  label: 'Cellular Component',
  aspect: Aspect.CELLULAR_COMPONENT as Aspect | null,
  searchClosureIds: [RootTypes.CELLULAR_COMPONENT],
  // Protein-containing complex is a CC descendant in GO; exclude it from CC term search.
  excludeClosureIds: [RootTypes.PROTEIN_CONTAINING_COMPLEX],
  partOf: rel(Relations.PART_OF, [RootTypes.ANATOMICAL_ENTITY, RootTypes.ORGANISM]),
}

export const molecularEntity = {
  id: RootTypes.MOLECULAR_ENTITY,
  label: 'Gene Product',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.MOLECULAR_ENTITY],
  partOf: rel(Relations.PART_OF, [RootTypes.PROTEIN_CONTAINING_COMPLEX], { multivalued: true }),
}

export const chemicalEntity = {
  id: RootTypes.CHEMICAL_ENTITY,
  label: 'Chemical',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.CHEMICAL_ENTITY],
  // Gene products (MOLECULAR_ENTITY = CHEBI:33695) are descendants of chemical entity
  // (CHEBI:24431) in ChEBI; exclude them so a chemical search doesn't surface GPs.
  excludeClosureIds: [RootTypes.MOLECULAR_ENTITY],
  locatedIn: rel(Relations.LOCATED_IN, [RootTypes.CELLULAR_COMPONENT]),
}

export const proteinContainingComplex = {
  id: RootTypes.PROTEIN_CONTAINING_COMPLEX,
  label: 'Protein Complex',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.PROTEIN_CONTAINING_COMPLEX],
  hasPart: rel(Relations.HAS_PART, [RootTypes.MOLECULAR_ENTITY], { multivalued: true }),
}

export const anatomicalEntity = {
  id: RootTypes.ANATOMICAL_ENTITY,
  label: 'Anatomical Entity',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.ANATOMICAL_ENTITY],
  partOf: rel(Relations.PART_OF, [RootTypes.ANATOMICAL_ENTITY, RootTypes.ORGANISM]),
}

export const cellType = {
  id: RootTypes.CELL_TYPE,
  label: 'Cell Type',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.CELL_TYPE],
  partOf: rel(Relations.PART_OF, [RootTypes.ANATOMICAL_ENTITY, RootTypes.ORGANISM]),
}

export const organism = {
  id: RootTypes.ORGANISM,
  label: 'Organism',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.ORGANISM],
}

export const biologicalPhase = {
  id: RootTypes.BIOLOGICAL_PHASE,
  label: 'Biological Phase',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.BIOLOGICAL_PHASE],
}

export const uberonStage = {
  id: RootTypes.UBERON_STAGE,
  label: 'Life Stage',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.UBERON_STAGE],
}

export const plantStage = {
  id: RootTypes.PLANT_STAGE,
  label: 'Plant Stage',
  aspect: null as Aspect | null,
  searchClosureIds: [RootTypes.PLANT_STAGE],
}

// ── Lookup by ID ────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  molecularFunction,
  biologicalProcess,
  cellularComponent,
  molecularEntity,
  chemicalEntity,
  proteinContainingComplex,
  anatomicalEntity,
  cellType,
  organism,
  biologicalPhase,
  uberonStage,
  plantStage,
] as const

type AnyCategory = (typeof ALL_CATEGORIES)[number]

const CATEGORY_BY_ID = new Map<string, AnyCategory>(
  ALL_CATEGORIES.map(c => [c.id, c])
)

export const getNodeCategory = (id: string): (AnyCategory & NodeCategory) | undefined => {
  return CATEGORY_BY_ID.get(id) as (AnyCategory & NodeCategory) | undefined
}

// ── Helpers ─────────────────────────────────────────────────────────

// A node's root-type set can contain several categories at once because GO/ChEBI
// nest specific types under general ones: a protein-containing complex (GO:0032991)
// is also a cellular component (GO:0005575), and a gene product (CHEBI:33695) is also
// a chemical entity (CHEBI:24431). Resolve most-specific-first so a complex maps to
// the complex shape (allows `has part`) rather than CC (`part of`), and a gene product
// maps to GP rather than chemical.
const CATEGORY_PRIORITY: string[] = [
  RootTypes.MOLECULAR_FUNCTION,
  RootTypes.BIOLOGICAL_PROCESS,
  RootTypes.PROTEIN_CONTAINING_COMPLEX,
  RootTypes.CELLULAR_COMPONENT,
  RootTypes.CELL_TYPE,
  RootTypes.MOLECULAR_ENTITY,
  RootTypes.CHEMICAL_ENTITY,
  RootTypes.ANATOMICAL_ENTITY,
]

/**
 * Resolve a node's primary category id from its root-type set, most-specific-first.
 * Falls back to the first root type with a known category, then the first id, then null.
 */
export const getPrimaryRootType = (rootTypes: string[]): string | null => {
  for (const candidate of CATEGORY_PRIORITY) {
    if (rootTypes.includes(candidate)) return candidate
  }
  for (const id of rootTypes) {
    if (getNodeCategory(id)) return id
  }
  return rootTypes[0] ?? null
}

/**
 * Resolve the term-search closure filter (include + exclude) for a node from its
 * *primary* category — never the raw root-type set. Minerva returns a node's full
 * inferred type set, so a gene product carries both MOLECULAR_ENTITY (CHEBI:33695)
 * and its parent CHEMICAL_ENTITY (CHEBI:24431). Searching the raw set would include
 * chemicals; scoping to the primary category (gene product → search CHEBI:33695 only)
 * matches the activity-form template path and the legacy single-category behavior.
 * Falls back to the raw root types when the primary type has no known category.
 */
export const getSearchClosures = (
  rootTypes: string[]
): { closureIds: string[]; excludeClosureIds?: string[] } => {
  const primary = getPrimaryRootType(rootTypes)
  const category = primary ? getNodeCategory(primary) : undefined
  return {
    closureIds: category?.searchClosureIds ?? rootTypes,
    excludeClosureIds: category?.excludeClosureIds,
  }
}

