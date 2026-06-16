import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRelationFormConfig } from '@/features/relations/hooks/useRelationFormConfig'
import { ActivityType } from '@/features/gocam/models/cam'
import {
  ConnectorType,
  ActivityRelationshipId,
  MoleculeActivityRelationshipId,
  ActivityMoleculeRelationshipId,
} from '@/features/relations/models/decisionTree'
import type { RelationshipInput } from '@/features/relations/slices/relationSlice'

const noSelection: RelationshipInput = {
  relationshipId: '',
  directionId: null,
  directnessId: null,
}

describe('useRelationFormConfig — connector type detection', () => {
  it('classifies activity → activity', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.ACTIVITY, noSelection)
    )
    expect(result.current.connectorType).toBe(ConnectorType.ACTIVITY_ACTIVITY)
  })

  it('classifies activity → molecule', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.MOLECULE, noSelection)
    )
    expect(result.current.connectorType).toBe(ConnectorType.ACTIVITY_MOLECULE)
  })

  it('classifies molecule → activity', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.MOLECULE, ActivityType.ACTIVITY, noSelection)
    )
    expect(result.current.connectorType).toBe(ConnectorType.MOLECULE_ACTIVITY)
  })
})

describe('useRelationFormConfig — relationship options', () => {
  it('returns the activity-activity option set for A→A connectors', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.ACTIVITY, noSelection)
    )
    expect(result.current.relationshipOptions).toEqual(Object.values(ActivityRelationshipId))
  })

  it('returns activity-molecule options for A→M connectors', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.MOLECULE, noSelection)
    )
    expect(result.current.relationshipOptions).toEqual(
      Object.values(ActivityMoleculeRelationshipId)
    )
  })

  it('returns molecule-activity options for M→A connectors', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.MOLECULE, ActivityType.ACTIVITY, noSelection)
    )
    expect(result.current.relationshipOptions).toEqual(
      Object.values(MoleculeActivityRelationshipId)
    )
  })
})

describe('useRelationFormConfig — conditional sub-fields', () => {
  it('shows direction + directness when REGULATION is selected (A→A)', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.ACTIVITY, {
        ...noSelection,
        relationshipId: ActivityRelationshipId.REGULATION,
      })
    )
    expect(result.current.shouldShowDirection).toBe(true)
    expect(result.current.shouldShowDirectness).toBe(true)
  })

  it('shows direction (but not directness) for M→A REGULATES', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.MOLECULE, ActivityType.ACTIVITY, {
        ...noSelection,
        relationshipId: MoleculeActivityRelationshipId.REGULATES,
      })
    )
    expect(result.current.shouldShowDirection).toBe(true)
    expect(result.current.shouldShowDirectness).toBe(false)
  })

  it('shows the chemical-intermediate toggle only on A→A PROVIDES_INPUT_FOR', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.ACTIVITY, {
        ...noSelection,
        relationshipId: ActivityRelationshipId.PROVIDES_INPUT_FOR,
      })
    )
    expect(result.current.shouldShowChemicalIntermediate).toBe(true)
    expect(result.current.shouldShowDirection).toBe(false)
    expect(result.current.shouldShowDirectness).toBe(false)
  })

  it('hides direction/directness/chemicalIntermediate when nothing is selected', () => {
    const { result } = renderHook(() =>
      useRelationFormConfig(ActivityType.ACTIVITY, ActivityType.ACTIVITY, noSelection)
    )
    expect(result.current.shouldShowDirection).toBe(false)
    expect(result.current.shouldShowDirectness).toBe(false)
    expect(result.current.shouldShowChemicalIntermediate).toBe(false)
  })
})
