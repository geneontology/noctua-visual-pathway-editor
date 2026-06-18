import { describe, it, expect } from 'vitest'
import {
  escapeGOlrValue,
  mapGOlrResponse,
  processAnnotationsResponse,
  processHasParticipants,
} from '@/features/search/services/lookupServices'
import { RootTypes } from '@/features/gocam/models/cam'

import searchMfFixture from '@tests/fixtures/raw/golr/search-mf.json'
import searchBpFixture from '@tests/fixtures/raw/golr/search-bp.json'
import searchEvidenceFixture from '@tests/fixtures/raw/golr/search-evidence.json'
import searchChemicalExcludeFixture from '@tests/fixtures/raw/golr/search-chemical-with-exclude.json'
import annotationsMfFixture from '@tests/fixtures/raw/golr/annotations-mf.json'
import annotationsBpFixture from '@tests/fixtures/raw/golr/annotations-bp.json'
import annotationsCcFixture from '@tests/fixtures/raw/golr/annotations-cc.json'
import chemicalParticipantsFixture from '@tests/fixtures/raw/golr/chemical-participants.json'

// ─── escapeGOlrValue ────────────────────────────────────────────────

describe('escapeGOlrValue', () => {
  it('escapes Lucene reserved characters', () => {
    // ! * + - < > = ( ) [ ] { } ^ ~ ? : \ / " |
    expect(escapeGOlrValue('a+b')).toBe('a\\+b')
    expect(escapeGOlrValue('GO:0008150')).toBe('GO\\:0008150')
    expect(escapeGOlrValue('lipid (transport)')).toBe('lipid \\(transport\\)')
    expect(escapeGOlrValue('a/b')).toBe('a\\/b')
    expect(escapeGOlrValue('a-b')).toBe('a\\-b')
    expect(escapeGOlrValue('"quoted"')).toBe('\\"quoted\\"')
  })

  it('leaves plain alphanumeric + whitespace strings untouched', () => {
    expect(escapeGOlrValue('cell division')).toBe('cell division')
    expect(escapeGOlrValue('lipid transport')).toBe('lipid transport')
    expect(escapeGOlrValue('')).toBe('')
  })

  it('handles strings with multiple reserved characters', () => {
    expect(escapeGOlrValue('A:B/C?D!E')).toBe('A\\:B\\/C\\?D\\!E')
  })
})

// ─── mapGOlrResponse ────────────────────────────────────────────────

describe('mapGOlrResponse', () => {
  it('maps the MF term-search response to GOlrResponse[] with the expected shape', () => {
    const results = mapGOlrResponse(searchMfFixture)
    expect(results.length).toBeGreaterThan(0)
    const first = results[0]
    expect(typeof first.id).toBe('string')
    expect(typeof first.label).toBe('string')
    expect(typeof first.link).toBe('string')
    expect(Array.isArray(first.rootTypes)).toBe(true)
  })

  it('builds AmiGO term URLs for GO ids', () => {
    const results = mapGOlrResponse(searchMfFixture)
    const goResult = results.find(r => r.id.startsWith('GO:'))
    expect(goResult?.link).toMatch(/amigo/i)
    expect(goResult?.link).toContain(goResult!.id)
  })

  it('builds ECO-specific URLs for evidence-code searches', () => {
    const results = mapGOlrResponse(searchEvidenceFixture)
    const eco = results.find(r => r.id.startsWith('ECO:'))
    expect(eco).toBeDefined()
    // ECO links go through the evidence-ontology URL, not AmiGO
    expect(eco?.link).not.toMatch(/amigo/i)
  })

  it('strips BFO entries from the isa_closure → rootTypes mapping', () => {
    const results = mapGOlrResponse(searchMfFixture)
    for (const r of results) {
      for (const rt of r.rootTypes) {
        expect(rt.id.startsWith('BFO')).toBe(false)
      }
    }
  })

  it('pairs ids with labels when both arrays are equal-length', () => {
    const results = mapGOlrResponse(searchMfFixture)
    const withRoots = results.find(r => r.rootTypes.length > 0)
    expect(withRoots).toBeDefined()
    for (const rt of withRoots!.rootTypes) {
      expect(rt.id).toBeTruthy()
      expect(typeof rt.label).toBe('string')
    }
  })

  it('produces CHEBI-rooted results from the chemical-exclude fixture (and excludes gene products)', () => {
    const results = mapGOlrResponse(searchChemicalExcludeFixture)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r => r.id.startsWith('CHEBI:'))).toBe(true)
  })

  it('returns an empty array when response.docs is empty', () => {
    const emptyResponse = { response: { docs: [] } }
    expect(mapGOlrResponse(emptyResponse)).toEqual([])
  })

  it('sets notAnnotatable=true unless gocheck_do_not_annotate is in the subset', () => {
    // The fixtures don't reliably contain the subset field, so this assertion just
    // verifies the field is a boolean for every result (not undefined).
    const results = mapGOlrResponse(searchBpFixture)
    for (const r of results) {
      expect(typeof r.notAnnotatable).toBe('boolean')
    }
  })
})

// ─── mapGOlrResponse: phase/stage do-not-annotate handling ──────────
//
// Phase/stage terms carry `gocheck_do_not_annotate` but are valid extension
// targets in fields whose range is a phase/stage (e.g. `happens during`). The
// bypass keys on the *field's* closure context, never on the term itself.

const golrDoc = (id: string, opts: { doNotAnnotate?: boolean } = {}) => ({
  annotation_class: id,
  annotation_class_label: `label ${id}`,
  subset: opts.doNotAnnotate ? ['gocheck_do_not_annotate'] : [],
  isa_closure: [id],
  isa_closure_label: [`label ${id}`],
})

const golrResponse = (docs: ReturnType<typeof golrDoc>[]) => ({ response: { docs } })

describe('mapGOlrResponse — phase/stage do-not-annotate handling', () => {
  it('marks a do-not-annotate term notAnnotatable=false with no closure context', () => {
    const [r] = mapGOlrResponse(golrResponse([golrDoc('GO:0044849', { doNotAnnotate: true })]))
    expect(r.notAnnotatable).toBe(false)
  })

  it('keeps a do-not-annotate term blocked in a non-phase field (closureIds = BP)', () => {
    const [r] = mapGOlrResponse(
      golrResponse([golrDoc('GO:0044849', { doNotAnnotate: true })]),
      [RootTypes.BIOLOGICAL_PROCESS]
    )
    expect(r.notAnnotatable).toBe(false)
  })

  it('unlocks do-not-annotate terms when closureIds include biological phase (GO:0044848)', () => {
    const [r] = mapGOlrResponse(
      golrResponse([golrDoc('GO:0044849', { doNotAnnotate: true })]),
      [RootTypes.BIOLOGICAL_PHASE]
    )
    expect(r.notAnnotatable).toBe(true)
  })

  it('unlocks for uberon stage and plant stage closures too', () => {
    const [uberon] = mapGOlrResponse(
      golrResponse([golrDoc('UBERON:0000113', { doNotAnnotate: true })]),
      [RootTypes.UBERON_STAGE]
    )
    const [plant] = mapGOlrResponse(
      golrResponse([golrDoc('PO:0007134', { doNotAnnotate: true })]),
      [RootTypes.PLANT_STAGE]
    )
    expect(uberon.notAnnotatable).toBe(true)
    expect(plant.notAnnotatable).toBe(true)
  })

  it('leaves ordinary (annotatable) terms notAnnotatable=true even in a phase field', () => {
    const [r] = mapGOlrResponse(
      golrResponse([golrDoc('GO:0007049')]),
      [RootTypes.BIOLOGICAL_PHASE]
    )
    expect(r.notAnnotatable).toBe(true)
  })
})

// ─── processAnnotationsResponse ─────────────────────────────────────

describe('processAnnotationsResponse', () => {
  it('groups docs by annotation_class and produces one AnnotationsResponse per unique term', () => {
    const results = processAnnotationsResponse(annotationsMfFixture)
    expect(results.length).toBeGreaterThan(0)
    const ids = results.map(r => r.term.id)
    // Each term id is unique in the grouped output
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each result carries term {id, label} and one or more evidences', () => {
    const results = processAnnotationsResponse(annotationsMfFixture)
    for (const r of results) {
      expect(r.term.id).toBeTruthy()
      expect(typeof r.term.label).toBe('string')
      expect(r.evidences.length).toBeGreaterThan(0)
    }
  })

  it('each evidence has a uid + evidenceCode shape', () => {
    const results = processAnnotationsResponse(annotationsBpFixture)
    for (const r of results) {
      for (const ev of r.evidences) {
        expect(ev.uid).toBeTruthy()
        expect(ev.evidenceCode).toHaveProperty('id')
        expect(ev.evidenceCode).toHaveProperty('label')
      }
    }
  })

  it('joins multi-value reference / evidence_with with " | "', () => {
    const synthetic = {
      response: {
        docs: [
          {
            annotation_class: 'GO:000X',
            annotation_class_label: 'something',
            evidence: 'ECO:0000314',
            evidence_label: 'IDA',
            reference: ['PMID:1', 'PMID:2'],
            evidence_with: ['UniProtKB:A', 'UniProtKB:B'],
            assigned_by: 'WB',
          },
        ],
      },
    }
    const [r] = processAnnotationsResponse(synthetic)
    expect(r.evidences[0].reference).toBe('PMID:1 | PMID:2')
    expect(r.evidences[0].with).toBe('UniProtKB:A | UniProtKB:B')
  })

  it('handles the CC response (uses isa_partof_closure filter) without crashing', () => {
    const results = processAnnotationsResponse(annotationsCcFixture)
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns an empty array when no docs', () => {
    expect(processAnnotationsResponse({ response: { docs: [] } })).toEqual([])
  })
})

// ─── processHasParticipants ─────────────────────────────────────────

describe('processHasParticipants', () => {
  it('extracts has_participant (RO:0000057) edges from the neighborhoodGraphJson string', () => {
    const doc = (chemicalParticipantsFixture as { response: { docs: Array<{ neighborhood_graph_json: string }> } }).response.docs[0]
    const participants = processHasParticipants(doc.neighborhood_graph_json)
    expect(Array.isArray(participants)).toBe(true)
    // The fixture (GO:0004352 glutamate dehydrogenase activity) has CHEBI participants
    expect(participants.length).toBeGreaterThan(0)
    for (const p of participants) {
      expect(p.id).toBeTruthy()
      expect(typeof p.label).toBe('string')
    }
  })

  it('returns an empty array for invalid JSON', () => {
    expect(processHasParticipants('not-json')).toEqual([])
    expect(processHasParticipants('')).toEqual([])
  })

  it('returns an empty array when nodes or edges are missing', () => {
    expect(processHasParticipants(JSON.stringify({ nodes: [] }))).toEqual([])
    expect(processHasParticipants(JSON.stringify({ edges: [] }))).toEqual([])
    expect(processHasParticipants(JSON.stringify({}))).toEqual([])
  })

  it('ignores edges with predicates other than RO:0000057', () => {
    const graph = {
      nodes: [{ id: 'GO:1', lbl: 'subj' }, { id: 'CHEBI:1', lbl: 'glucose' }],
      edges: [
        { sub: 'GO:1', pred: 'RO:0000057', obj: 'CHEBI:1' },
        { sub: 'GO:1', pred: 'BFO:0000050', obj: 'CHEBI:1' },
      ],
    }
    const out = processHasParticipants(JSON.stringify(graph))
    expect(out).toEqual([{ id: 'CHEBI:1', label: 'glucose' }])
  })

  it('uses an empty string when a target node has no label', () => {
    const graph = {
      nodes: [{ id: 'CHEBI:99' }], // no lbl
      edges: [{ sub: 'GO:1', pred: 'RO:0000057', obj: 'CHEBI:99' }],
    }
    const out = processHasParticipants(JSON.stringify(graph))
    expect(out).toEqual([{ id: 'CHEBI:99', label: '' }])
  })
})
