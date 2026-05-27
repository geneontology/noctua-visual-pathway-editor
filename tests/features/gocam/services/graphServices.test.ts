import { describe, it, expect } from 'vitest'
import { transformGraphData } from '@/features/gocam/services/graphServices'
import { Relations } from '@/@noctua.core/models/relations'
import { RootTypes } from '@/features/gocam/models/cam'

const enabledByEdge = (subjectId: string, objectId: string, annotations: any[] = []) => ({
  subject: subjectId,
  object: objectId,
  property: Relations.ENABLED_BY,
  'property-label': 'enabled by',
  annotations,
})

const individual = (id: string, typeId: string, rootTypes: string[]) => ({
  id,
  type: [{ type: 'class', id: typeId, label: typeId }],
  'root-type': rootTypes.map(rt => ({ id: rt, label: rt })),
  annotations: [],
})

describe('transformGraphData — comments', () => {
  it('parses comment annotations on facts into edge.comments', () => {
    const data = {
      id: 'gomodel:test',
      individuals: [
        individual('mf', 'GO:0003674', [RootTypes.MOLECULAR_FUNCTION]),
        individual('gp', 'UniProtKB:P1', [RootTypes.PROTEIN_CONTAINING_COMPLEX]),
      ],
      facts: [
        enabledByEdge('mf', 'gp', [
          { key: 'comment', value: 'first comment' },
          { key: 'comment', value: 'second comment' },
        ]),
      ],
      annotations: [],
    }

    const model = transformGraphData(data)

    expect(model.edges).toHaveLength(1)
    expect(model.edges[0].comments).toEqual(['first comment', 'second comment'])
  })

  it('defaults edge.comments to [] when no comment annotations are present', () => {
    const data = {
      id: 'gomodel:test',
      individuals: [
        individual('mf', 'GO:0003674', [RootTypes.MOLECULAR_FUNCTION]),
        individual('gp', 'UniProtKB:P1', [RootTypes.PROTEIN_CONTAINING_COMPLEX]),
      ],
      facts: [enabledByEdge('mf', 'gp', [])],
      annotations: [],
    }

    const model = transformGraphData(data)
    expect(model.edges[0].comments).toEqual([])
  })

  it('keeps separate comments on separate edges (no aggregation)', () => {
    const data = {
      id: 'gomodel:test',
      individuals: [
        individual('mf', 'GO:0003674', [RootTypes.MOLECULAR_FUNCTION]),
        individual('gp', 'UniProtKB:P1', [RootTypes.PROTEIN_CONTAINING_COMPLEX]),
        individual('bp', 'GO:0008150', [RootTypes.BIOLOGICAL_PROCESS]),
      ],
      facts: [
        enabledByEdge('mf', 'gp', [{ key: 'comment', value: 'edge1-comment' }]),
        {
          subject: 'mf',
          object: 'bp',
          property: Relations.PART_OF,
          'property-label': 'part of',
          annotations: [{ key: 'comment', value: 'edge2-comment' }],
        },
      ],
      annotations: [],
    }

    const model = transformGraphData(data)

    const enabledBy = model.edges.find(e => e.id === Relations.ENABLED_BY)
    const partOf = model.edges.find(e => e.id === Relations.PART_OF)
    expect(enabledBy?.comments).toEqual(['edge1-comment'])
    expect(partOf?.comments).toEqual(['edge2-comment'])
  })

  it('preserves duplicate comments on the same edge (no per-edge dedupe)', () => {
    const data = {
      id: 'gomodel:test',
      individuals: [
        individual('mf', 'GO:0003674', [RootTypes.MOLECULAR_FUNCTION]),
        individual('gp', 'UniProtKB:P1', [RootTypes.PROTEIN_CONTAINING_COMPLEX]),
      ],
      facts: [
        enabledByEdge('mf', 'gp', [
          { key: 'comment', value: 'same' },
          { key: 'comment', value: 'same' },
        ]),
      ],
      annotations: [],
    }

    const model = transformGraphData(data)
    expect(model.edges[0].comments).toEqual(['same', 'same'])
  })

  it('still parses model-level comments unchanged', () => {
    const data = {
      id: 'gomodel:test',
      individuals: [],
      facts: [],
      annotations: [
        { key: 'comment', value: 'model-level comment' },
        { key: 'title', value: 'my title' },
      ],
    }

    const model = transformGraphData(data)
    expect(model.comments).toEqual(['model-level comment'])
    expect(model.title).toBe('my title')
  })
})
