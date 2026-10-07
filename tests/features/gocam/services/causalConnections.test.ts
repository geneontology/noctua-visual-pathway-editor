import { describe, it, expect } from 'vitest'
import { activitiesWithoutCausalRelations } from '@/features/gocam/services/causalConnections'
import type { Activity, Edge, GraphModel, GraphNode } from '@/features/gocam/models/cam'
import { ActivityType, RootTypes } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import { buildActivity, buildModel, buildNode } from '@tests/fixtures/builders'

// ── Fixtures ────────────────────────────────────────────────────────

const node = (uid: string, rootTypes: string[] = []): GraphNode => ({
  ...buildNode(uid, uid, rootTypes),
  uid,
})

/** An activity unit `name`: MF node `name-mf` enabled by GP node `name-gp`. */
const unit = (name: string): Activity => {
  const mf = node(`${name}-mf`, [RootTypes.MOLECULAR_FUNCTION])
  const gp = node(`${name}-gp`, [RootTypes.MOLECULAR_ENTITY])
  return { ...buildActivity(name, [mf, gp]), molecularFunction: mf, enabledBy: gp }
}

/** A chemical node on the canvas; its one node's uid is `name`. */
const chemical = (name: string): Activity => ({
  ...buildActivity(name, [node(name, [RootTypes.CHEMICAL_ENTITY])]),
  type: ActivityType.MOLECULE,
})

const mf = (name: string) => `${name}-mf`

const link = (relation: string, sourceId: string, targetId: string): Edge => ({
  uid: `${sourceId} ${relation} ${targetId}`,
  id: relation,
  label: relation,
  sourceId,
  targetId,
  source: node(sourceId),
  target: node(targetId),
  contributors: [],
  groups: [],
  comments: [],
})

const modelOf = (activities: Activity[], connections: Edge[] = []): GraphModel => ({
  ...buildModel(activities),
  activityConnections: connections,
})

// ── Tests ───────────────────────────────────────────────────────────

describe('activitiesWithoutCausalRelations', () => {
  it('flags the units in the #305 example that only output a chemical', () => {
    // TMX1 directly negatively regulates TMEM68, which turns two phosphocholines
    // into triglyceride. DGAT1 and DGAT2 also output triglyceride, nothing more.
    const model = modelOf(
      [
        unit('TMX1'),
        unit('TMEM68'),
        unit('DGAT2'),
        unit('DGAT1'),
        chemical('PC1'),
        chemical('PC2'),
        chemical('TG'),
      ],
      [
        link(Relations.DIRECTLY_NEGATIVELY_REGULATES, mf('TMX1'), mf('TMEM68')),
        link(Relations.HAS_INPUT, mf('TMEM68'), 'PC1'),
        link(Relations.HAS_INPUT, mf('TMEM68'), 'PC2'),
        link(Relations.HAS_OUTPUT, mf('TMEM68'), 'TG'),
        link(Relations.HAS_OUTPUT, mf('DGAT2'), 'TG'),
        link(Relations.HAS_OUTPUT, mf('DGAT1'), 'TG'),
      ]
    )

    expect(activitiesWithoutCausalRelations(model)).toEqual(['DGAT2', 'DGAT1'])
  })

  it('flags a unit with no links at all', () => {
    expect(activitiesWithoutCausalRelations(modelOf([unit('A')]))).toEqual(['A'])
  })

  it('never flags a chemical, linked or not', () => {
    const model = modelOf(
      [unit('A'), unit('B'), chemical('X'), chemical('Y')],
      [
        link(Relations.PROVIDES_INPUT_FOR, mf('A'), mf('B')),
        link(Relations.HAS_OUTPUT, mf('A'), 'X'),
      ]
    )

    expect(activitiesWithoutCausalRelations(model)).toEqual([])
  })

  it.each([
    ['provides input for', Relations.PROVIDES_INPUT_FOR],
    ['causally upstream of', Relations.CAUSALLY_UPSTREAM_OF],
    ['positively regulates', Relations.POSITIVELY_REGULATES],
    ['constitutively upstream of', Relations.CONSTITUTIVELY_UPSTREAM_OF],
  ])('"%s" connects both ends', (_label, relation) => {
    const model = modelOf([unit('A'), unit('B')], [link(relation, mf('A'), mf('B'))])

    expect(activitiesWithoutCausalRelations(model)).toEqual([])
  })

  it('flags both ends of a non-causal relation between two units', () => {
    // A takes B's gene product as input — a link between units, but not a causal one.
    const model = modelOf(
      [unit('A'), unit('B')],
      [link(Relations.HAS_INPUT, mf('A'), 'B-gp')]
    )

    expect(activitiesWithoutCausalRelations(model)).toEqual(['A', 'B'])
  })

  describe('through a chemical', () => {
    it('connects a unit that outputs it to a unit that takes it as input', () => {
      const model = modelOf(
        [unit('A'), unit('B'), chemical('X')],
        [link(Relations.HAS_OUTPUT, mf('A'), 'X'), link(Relations.HAS_INPUT, mf('B'), 'X')]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual([])
    })

    it('does not connect two units that take the same chemical as input', () => {
      const model = modelOf(
        [unit('A'), unit('B'), chemical('X')],
        [link(Relations.HAS_INPUT, mf('A'), 'X'), link(Relations.HAS_INPUT, mf('B'), 'X')]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual(['A', 'B'])
    })

    it('does not connect a unit to itself when it outputs its own input', () => {
      const model = modelOf(
        [unit('A'), chemical('X')],
        [link(Relations.HAS_OUTPUT, mf('A'), 'X'), link(Relations.HAS_INPUT, mf('A'), 'X')]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual(['A'])
    })

    it.each([
      ['activates', Relations.IS_SMALL_MOLECULE_ACTIVATOR_OF],
      ['inhibits', Relations.IS_SMALL_MOLECULE_INHIBITOR_OF],
    ])('connects a unit to the one its output %s', (_label, relation) => {
      // A —has output→ X —regulates→ B: both links run the same way through X.
      const model = modelOf(
        [unit('A'), unit('B'), chemical('X')],
        [link(Relations.HAS_OUTPUT, mf('A'), 'X'), link(relation, 'X', mf('B'))]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual([])
    })

    it('does not connect a unit that takes it as input to one it activates', () => {
      // A ←input of— X —activates→ B: both links leave X.
      const model = modelOf(
        [unit('A'), unit('B'), chemical('X')],
        [
          link(Relations.HAS_INPUT, mf('A'), 'X'),
          link(Relations.IS_SMALL_MOLECULE_ACTIVATOR_OF, 'X', mf('B')),
        ]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual(['A', 'B'])
    })

    it('does not follow a link between two chemicals', () => {
      // A —has output→ X —?→ Y —input of→ B: chemical-to-chemical links aren't valid.
      const model = modelOf(
        [unit('A'), unit('B'), chemical('X'), chemical('Y')],
        [
          link(Relations.HAS_OUTPUT, mf('A'), 'X'),
          link(Relations.HAS_PART, 'X', 'Y'),
          link(Relations.HAS_INPUT, mf('B'), 'Y'),
        ]
      )

      expect(activitiesWithoutCausalRelations(model)).toEqual(['A', 'B'])
    })
  })
})
