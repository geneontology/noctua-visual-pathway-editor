import { describe, it, expect } from 'vitest'
import {
  createActivityTemplate,
  activityToFormTree,
} from '@/features/gocam/data/activityTemplates'
import { RootTypes, Aspect } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { smallBaselineModel } from '@tests/fixtures/models'

describe('createActivityTemplate("activity") — default activity form', () => {
  const root = createActivityTemplate('activity')

  it('roots on Molecular Function with the MF aspect', () => {
    expect(root.category).toBe(RootTypes.MOLECULAR_FUNCTION)
    expect(root.aspect).toBe(Aspect.MOLECULAR_FUNCTION)
  })

  it('marks the root as required and visible', () => {
    expect(root.required).toBe(true)
    expect(root.visible).toBe(true)
  })

  it('has three relations: enabled_by, part_of, occurs_in', () => {
    expect(root.relations.map(r => r.predicate.id).sort()).toEqual(
      [Relations.ENABLED_BY, Relations.PART_OF, Relations.OCCURS_IN].sort()
    )
  })

  it('does not populate excludeRootTypes on MF (no exclusions configured)', () => {
    expect(root.excludeRootTypes).toBeUndefined()
  })

  it('seeds every relation with one empty evidence form', () => {
    for (const rel of root.relations) {
      expect(rel.evidence).toHaveLength(1)
      expect(rel.evidence[0].evidenceCode.id).toBe('')
    }
  })
})

describe('createActivityTemplate("molecule") — chemical activity', () => {
  const root = createActivityTemplate('molecule')

  it('roots on Chemical Entity (CHEBI:24431) with null aspect', () => {
    expect(root.category).toBe(RootTypes.CHEMICAL_ENTITY)
    expect(root.aspect).toBeNull()
  })

  it('populates excludeRootTypes with MOLECULAR_ENTITY (so GP terms are excluded from search)', () => {
    expect(root.excludeRootTypes).toEqual([RootTypes.MOLECULAR_ENTITY])
  })

  it('hides evidence on the root (showEvidence=false) and skips evidence checks', () => {
    expect(root.showEvidence).toBe(false)
    expect(root.skipEvidenceCheck).toBe(true)
  })

  it('has one relation: located_in → CC', () => {
    expect(root.relations).toHaveLength(1)
    expect(root.relations[0].predicate.id).toBe(Relations.LOCATED_IN)
    expect(root.relations[0].target.category).toBe(RootTypes.CELLULAR_COMPONENT)
  })

  it('the CC child gets the CC exclusion (excludeRootTypes = [PROTEIN_CONTAINING_COMPLEX])', () => {
    expect(root.relations[0].target.excludeRootTypes).toEqual([
      RootTypes.PROTEIN_CONTAINING_COMPLEX,
    ])
  })
})

describe('createActivityTemplate("proteinComplex")', () => {
  const root = createActivityTemplate('proteinComplex')

  it('roots on Molecular Function and is visible (since the protein-complex form fix)', () => {
    expect(root.category).toBe(RootTypes.MOLECULAR_FUNCTION)
    expect(root.visible).toBe(true)
  })

  it('has enabled_by, part_of, occurs_in at the top level', () => {
    expect(root.relations.map(r => r.predicate.id).sort()).toEqual(
      [Relations.ENABLED_BY, Relations.PART_OF, Relations.OCCURS_IN].sort()
    )
  })

  it('the enabled_by target is a ProteinComplex with a has_part GP child', () => {
    const enabledBy = root.relations.find(r => r.predicate.id === Relations.ENABLED_BY)!
    expect(enabledBy.target.category).toBe(RootTypes.PROTEIN_CONTAINING_COMPLEX)
    expect(enabledBy.target.relations).toHaveLength(1)
    expect(enabledBy.target.relations[0].predicate.id).toBe(Relations.HAS_PART)
    expect(enabledBy.target.relations[0].target.category).toBe(RootTypes.MOLECULAR_ENTITY)
    expect(enabledBy.target.relations[0].target.canDelete).toBe(true)
  })
})

describe('createActivityTemplate — uid uniqueness across calls', () => {
  it('produces different uids on each call (no shared mutable state)', () => {
    const a = createActivityTemplate('activity')
    const b = createActivityTemplate('activity')
    expect(a.uid).not.toBe(b.uid)
    expect(a.relations[0].uid).not.toBe(b.relations[0].uid)
  })
})

describe('activityToFormTree — converts an Activity into a TermNode tree', () => {
  it('builds a tree rooted at the activity rootNode', () => {
    const activity = smallBaselineModel.activities[0]
    const tree = activityToFormTree(activity)
    expect(tree.uid).toBe(activity.rootNode.uid)
    expect(tree.required).toBe(true)
    expect(tree.canDelete).toBe(false)
  })

  it('child nodes have canDelete=true, required=false', () => {
    const activity = smallBaselineModel.activities[0]
    const tree = activityToFormTree(activity)
    for (const rel of tree.relations) {
      expect(rel.target.canDelete).toBe(true)
      expect(rel.target.required).toBe(false)
    }
  })

  it('infers category + aspect from the GraphNode rootTypes', () => {
    const activity = smallBaselineModel.activities.find(a =>
      a.rootNode.rootTypes.includes(RootTypes.MOLECULAR_FUNCTION)
    )!
    const tree = activityToFormTree(activity)
    expect(tree.category).toBe(RootTypes.MOLECULAR_FUNCTION)
    expect(tree.aspect).toBe(Aspect.MOLECULAR_FUNCTION)
  })

  it('does not revisit nodes (avoids infinite recursion on cycles)', () => {
    const activity = smallBaselineModel.activities[0]
    const tree = activityToFormTree(activity)
    // Walk the tree and collect uids; each should appear at most once.
    const seen = new Set<string>()
    let dup = 0
    const walk = (node: { uid: string; relations: { target: { uid: string; relations: unknown } }[] }) => {
      if (seen.has(node.uid)) {
        dup++
        return
      }
      seen.add(node.uid)
      for (const rel of node.relations) walk(rel.target as never)
    }
    walk(tree as never)
    expect(dup).toBe(0)
  })
})
