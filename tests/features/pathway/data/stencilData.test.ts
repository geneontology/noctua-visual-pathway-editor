import { describe, it, expect } from 'vitest'
import { camStencil } from '@/features/pathway/data/stencilData'
import { ActivityType } from '@/features/gocam/models/cam'

describe('camStencil — Activity Type group', () => {
  const group = camStencil.find(g => g.id === 'activity_unit')

  it('exposes a single "Activity Type" group with three nodes', () => {
    expect(group).toBeDefined()
    expect(group!.label).toBe('Activity Type')
    expect(group!.nodes).toHaveLength(3)
  })

  it('renames the default stencil to "ACTIVITY UNIT" while keeping the id stable', () => {
    const node = group!.nodes.find(n => n.id === 'default')
    expect(node).toBeDefined()
    expect(node!.label).toBe('ACTIVITY UNIT')
    expect(node!.type).toBe(ActivityType.ACTIVITY)
  })

  it('renames the molecule stencil to "CHEMICAL" while keeping the id stable', () => {
    const node = group!.nodes.find(n => n.id === 'molecule')
    expect(node).toBeDefined()
    expect(node!.label).toBe('CHEMICAL')
    expect(node!.type).toBe(ActivityType.MOLECULE)
  })

  it('leaves the protein complex stencil label as "PROTEIN COMPLEX"', () => {
    const node = group!.nodes.find(n => n.id === 'proteinComplex')
    expect(node).toBeDefined()
    expect(node!.label).toBe('PROTEIN COMPLEX')
    expect(node!.type).toBe(ActivityType.PROTEIN_COMPLEX)
  })
})
