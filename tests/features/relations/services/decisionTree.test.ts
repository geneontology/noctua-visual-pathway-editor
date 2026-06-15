import { describe, it, expect } from 'vitest'
import {
  determineRelation,
  getConnectorType,
  getDefaultSelection,
  reverseLookup,
} from '@/features/relations/services/decisionTree'
import {
  ActivityRelationshipId,
  ActivityMoleculeRelationshipId,
  MoleculeActivityRelationshipId,
  EffectDirectionId,
  DirectnessId,
  ConnectorType,
  RelationId,
} from '@/features/relations/models/decisionTree'
import { ActivityType } from '@/features/gocam/models/cam'

describe('getConnectorType', () => {
  it('activity → activity returns ACTIVITY_ACTIVITY', () => {
    expect(getConnectorType(ActivityType.ACTIVITY, ActivityType.ACTIVITY)).toBe(
      ConnectorType.ACTIVITY_ACTIVITY
    )
  })

  it('activity → molecule returns ACTIVITY_MOLECULE', () => {
    expect(getConnectorType(ActivityType.ACTIVITY, ActivityType.MOLECULE)).toBe(
      ConnectorType.ACTIVITY_MOLECULE
    )
  })

  it('molecule → activity returns MOLECULE_ACTIVITY', () => {
    expect(getConnectorType(ActivityType.MOLECULE, ActivityType.ACTIVITY)).toBe(
      ConnectorType.MOLECULE_ACTIVITY
    )
  })

  it('molecule → molecule (rare) falls into MOLECULE_ACTIVITY by current branching', () => {
    // Documenting current behavior: source-is-molecule wins over target-is-not-molecule check.
    expect(getConnectorType(ActivityType.MOLECULE, ActivityType.MOLECULE)).toBe(
      ConnectorType.MOLECULE_ACTIVITY
    )
  })

  it('proteinComplex (non-molecule) → activity returns ACTIVITY_ACTIVITY', () => {
    expect(getConnectorType(ActivityType.PROTEIN_COMPLEX, ActivityType.ACTIVITY)).toBe(
      ConnectorType.ACTIVITY_ACTIVITY
    )
  })
})

describe('getDefaultSelection', () => {
  it('activity↔activity defaults to positive direct regulation', () => {
    expect(getDefaultSelection(ConnectorType.ACTIVITY_ACTIVITY)).toEqual({
      relationshipId: ActivityRelationshipId.REGULATION,
      directionId: EffectDirectionId.POSITIVE,
      directnessId: DirectnessId.DIRECT,
    })
  })

  it('activity→molecule defaults to product (no direction/directness)', () => {
    expect(getDefaultSelection(ConnectorType.ACTIVITY_MOLECULE)).toEqual({
      relationshipId: ActivityMoleculeRelationshipId.PRODUCT,
    })
  })

  it('molecule→activity defaults to positive regulation (no directness)', () => {
    expect(getDefaultSelection(ConnectorType.MOLECULE_ACTIVITY)).toEqual({
      relationshipId: MoleculeActivityRelationshipId.REGULATES,
      directionId: EffectDirectionId.POSITIVE,
    })
  })
})

describe('determineRelation — activity → activity', () => {
  it('regulation positive direct → directly_positively_regulates', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.POSITIVE,
        directnessId: DirectnessId.DIRECT,
      })
    ).toBe(RelationId.DIRECTLY_POSITIVELY_REGULATES)
  })

  it('regulation positive indirect → indirectly_positively_regulates', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.POSITIVE,
        directnessId: DirectnessId.INDIRECT,
      })
    ).toBe(RelationId.INDIRECTLY_POSITIVELY_REGULATES)
  })

  it('regulation negative direct → directly_negatively_regulates', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.NEGATIVE,
        directnessId: DirectnessId.DIRECT,
      })
    ).toBe(RelationId.DIRECTLY_NEGATIVELY_REGULATES)
  })

  it('regulation negative indirect → indirectly_negatively_regulates', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.NEGATIVE,
        directnessId: DirectnessId.INDIRECT,
      })
    ).toBe(RelationId.INDIRECTLY_NEGATIVELY_REGULATES)
  })

  it('constitutively_upstream resolves at the top level (no direction needed)', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.CONSTITUTIVELY_UPSTREAM,
      })
    ).toBe(RelationId.CONSTITUTIVELY_UPSTREAM_OF)
  })

  it('provides_input_for resolves at the top level', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.PROVIDES_INPUT_FOR,
      })
    ).toBe(RelationId.DIRECTLY_PROVIDES_INPUT)
  })

  it('removes_input_for resolves at the top level', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REMOVES_INPUT_FOR,
      })
    ).toBe(RelationId.REMOVES_INPUT_FOR)
  })

  it('undetermined positive → causally_upstream_positive', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.UNDETERMINED,
        directionId: EffectDirectionId.POSITIVE,
      })
    ).toBe(RelationId.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT)
  })

  it('undetermined negative → causally_upstream_negative', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.UNDETERMINED,
        directionId: EffectDirectionId.NEGATIVE,
      })
    ).toBe(RelationId.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT)
  })

  it('regulation without direction → null (cannot resolve)', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
      })
    ).toBeNull()
  })

  it('regulation with direction but no directness → null', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.POSITIVE,
      })
    ).toBeNull()
  })
})

describe('determineRelation — activity → molecule', () => {
  it('product resolves at top level', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.MOLECULE,
        relationshipId: ActivityMoleculeRelationshipId.PRODUCT,
      })
    ).toBe(RelationId.PRODUCT)
  })
})

describe('determineRelation — molecule → activity', () => {
  it('regulates positive → small_molecule_activator', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.MOLECULE,
        targetType: ActivityType.ACTIVITY,
        relationshipId: MoleculeActivityRelationshipId.REGULATES,
        directionId: EffectDirectionId.POSITIVE,
      })
    ).toBe(RelationId.SMALL_MOLECULE_ACTIVATOR)
  })

  it('regulates negative → small_molecule_inhibitor', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.MOLECULE,
        targetType: ActivityType.ACTIVITY,
        relationshipId: MoleculeActivityRelationshipId.REGULATES,
        directionId: EffectDirectionId.NEGATIVE,
      })
    ).toBe(RelationId.SMALL_MOLECULE_INHIBITOR)
  })

  it('substrate resolves at top level', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.MOLECULE,
        targetType: ActivityType.ACTIVITY,
        relationshipId: MoleculeActivityRelationshipId.SUBSTRATE,
      })
    ).toBe(RelationId.SUBSTRATE)
  })
})

describe('determineRelation — unsupported combinations', () => {
  it('molecule → molecule returns null (no branch)', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.MOLECULE,
        targetType: ActivityType.MOLECULE,
        relationshipId: ActivityRelationshipId.REGULATION,
        directionId: EffectDirectionId.POSITIVE,
        directnessId: DirectnessId.DIRECT,
      })
    ).toBeNull()
  })

  it('proteinComplex → activity returns null (no branch — only ACTIVITY/MOLECULE source/target handled)', () => {
    expect(
      determineRelation({
        sourceType: ActivityType.PROTEIN_COMPLEX,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityRelationshipId.CONSTITUTIVELY_UPSTREAM,
      })
    ).toBeNull()
  })

  it('still resolves when the relationshipId belongs to a different branch (no source/target guard)', () => {
    // Documenting current behavior: determineRelation looks up the relationshipId on the same
    // decisionTree map regardless of source/target. Passing PRODUCT with activity→activity still
    // resolves to PRODUCT — callers are expected to pair source/target with a valid id.
    expect(
      determineRelation({
        sourceType: ActivityType.ACTIVITY,
        targetType: ActivityType.ACTIVITY,
        relationshipId: ActivityMoleculeRelationshipId.PRODUCT as unknown as ActivityRelationshipId,
      })
    ).toBe(RelationId.PRODUCT)
  })
})

describe('reverseLookup', () => {
  it('finds a top-level relation (constitutively_upstream_of)', () => {
    const result = reverseLookup(RelationId.CONSTITUTIVELY_UPSTREAM_OF)
    expect(result).toEqual({
      relationshipId: ActivityRelationshipId.CONSTITUTIVELY_UPSTREAM,
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
    })
  })

  it('finds a direction-only relation (small_molecule_activator)', () => {
    const result = reverseLookup(RelationId.SMALL_MOLECULE_ACTIVATOR)
    expect(result).toEqual({
      relationshipId: MoleculeActivityRelationshipId.REGULATES,
      directionId: EffectDirectionId.POSITIVE,
      sourceType: ActivityType.MOLECULE,
      targetType: ActivityType.ACTIVITY,
    })
  })

  it('finds a causally_upstream_positive (undetermined + positive)', () => {
    const result = reverseLookup(RelationId.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT)
    expect(result).toEqual({
      relationshipId: ActivityRelationshipId.UNDETERMINED,
      directionId: EffectDirectionId.POSITIVE,
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
    })
  })

  it('finds a direction+directness relation (directly_negatively_regulates)', () => {
    const result = reverseLookup(RelationId.DIRECTLY_NEGATIVELY_REGULATES)
    expect(result).toEqual({
      relationshipId: ActivityRelationshipId.REGULATION,
      directionId: EffectDirectionId.NEGATIVE,
      directnessId: DirectnessId.DIRECT,
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
    })
  })

  it('finds a direction+directness relation (indirectly_positively_regulates)', () => {
    const result = reverseLookup(RelationId.INDIRECTLY_POSITIVELY_REGULATES)
    expect(result).toEqual({
      relationshipId: ActivityRelationshipId.REGULATION,
      directionId: EffectDirectionId.POSITIVE,
      directnessId: DirectnessId.INDIRECT,
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
    })
  })

  it('returns null for an unknown relation', () => {
    expect(reverseLookup('RO:9999999')).toBeNull()
  })
})

describe('round-trip: determineRelation ↔ reverseLookup', () => {
  // For each input that has a non-null relation, reverseLookup should recover the
  // same relationshipId and (when applicable) direction/directness.
  const inputs = [
    {
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
      relationshipId: ActivityRelationshipId.REGULATION,
      directionId: EffectDirectionId.POSITIVE,
      directnessId: DirectnessId.DIRECT,
    },
    {
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.ACTIVITY,
      relationshipId: ActivityRelationshipId.UNDETERMINED,
      directionId: EffectDirectionId.NEGATIVE,
    },
    {
      sourceType: ActivityType.ACTIVITY,
      targetType: ActivityType.MOLECULE,
      relationshipId: ActivityMoleculeRelationshipId.PRODUCT,
    },
    {
      sourceType: ActivityType.MOLECULE,
      targetType: ActivityType.ACTIVITY,
      relationshipId: MoleculeActivityRelationshipId.SUBSTRATE,
    },
  ]

  for (const input of inputs) {
    it(`round-trips ${input.relationshipId}`, () => {
      const rel = determineRelation(input)
      expect(rel).not.toBeNull()
      const back = reverseLookup(rel as string)
      expect(back).not.toBeNull()
      expect(back?.relationshipId).toBe(input.relationshipId)
      if ('directionId' in input) expect(back?.directionId).toBe(input.directionId)
      if ('directnessId' in input) expect(back?.directnessId).toBe(input.directnessId)
    })
  }
})
