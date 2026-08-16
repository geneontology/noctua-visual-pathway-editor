import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ACTIVITY_CLIPBOARD_KIND,
  activityClipboardLabel,
  activityFormTypeOf,
  parseActivityClipboard,
  readActivityClipboard,
  serializeActivity,
  writeClipboardText,
} from '@/features/gocam/services/activityClipboard'
import type { Activity, Edge, GraphNode } from '@/features/gocam/models/cam'
import { ActivityType, RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Fixtures ────────────────────────────────────────────────────────

const mfNode = (): GraphNode => ({
  ...buildNode('GO:0003674', 'molecular_function'),
  rootTypes: [RootTypes.MOLECULAR_FUNCTION],
})

const gpNode = (): GraphNode => ({
  ...buildNode('UniProtKB:P12345', 'Some gene product'),
  rootTypes: [RootTypes.MOLECULAR_ENTITY],
})

const enabledByEdge = (source: GraphNode, target: GraphNode): Edge => ({
  uid: 'edge_enabled_by',
  id: 'RO:0002333',
  label: 'enabled by',
  sourceId: source.uid,
  targetId: target.uid,
  source,
  target,
  contributors: [],
  groups: [],
  comments: [],
  evidence: [
    {
      uid: 'ev_1',
      evidenceCode: { id: 'ECO:0000314', label: 'direct assay evidence' },
      reference: 'PMID:12345',
      referenceUrl: '',
      with: 'UniProtKB:Q99999',
      groups: [],
      contributors: [],
    },
  ],
})

/** Activity with a real edge so the serialized tree has depth + evidence. */
const buildEnabledActivity = (): Activity => {
  const mf = mfNode()
  const gp = gpNode()
  return {
    ...buildActivity('act-1', [mf, gp], [enabledByEdge(mf, gp)]),
    enabledBy: gp,
  }
}

// ── activityFormTypeOf ──────────────────────────────────────────────

describe('activityFormTypeOf', () => {
  it('maps MOLECULE to "molecule"', () => {
    expect(activityFormTypeOf(ActivityType.MOLECULE)).toBe('molecule')
  })

  it('maps PROTEIN_COMPLEX to "proteinComplex"', () => {
    expect(activityFormTypeOf(ActivityType.PROTEIN_COMPLEX)).toBe('proteinComplex')
  })

  it('maps ACTIVITY to "activity"', () => {
    expect(activityFormTypeOf(ActivityType.ACTIVITY)).toBe('activity')
  })

  it('falls back to "activity" for BP_ONLY and CC_ONLY', () => {
    expect(activityFormTypeOf(ActivityType.BP_ONLY)).toBe('activity')
    expect(activityFormTypeOf(ActivityType.CC_ONLY)).toBe('activity')
  })
})

// ── activityClipboardLabel ──────────────────────────────────────────

describe('activityClipboardLabel', () => {
  it('prefers the enabledBy label', () => {
    const activity = buildEnabledActivity()
    expect(activityClipboardLabel(activity)).toBe('Some gene product')
  })

  it('falls back to the root node label when there is no enabler', () => {
    const activity = buildActivity('act-2', [mfNode()])
    expect(activityClipboardLabel(activity)).toBe('molecular_function')
  })

  it('falls back to "Activity" when the enabler and root node are both unlabeled', () => {
    const bare = { ...buildNode('GO:0003674', '') }
    const activity = { ...buildActivity('act-3', [bare]), enabledBy: null }
    expect(activityClipboardLabel(activity)).toBe('Activity')
  })
})

// ── serializeActivity ───────────────────────────────────────────────

describe('serializeActivity', () => {
  it('produces JSON tagged with the clipboard kind', () => {
    const payload = JSON.parse(serializeActivity(buildEnabledActivity(), 'gomodel:src'))
    expect(payload.kind).toBe(ACTIVITY_CLIPBOARD_KIND)
    expect(ACTIVITY_CLIPBOARD_KIND).toBe('noctua-activity/v1')
  })

  it('records the activity type, label and source model', () => {
    const payload = JSON.parse(serializeActivity(buildEnabledActivity(), 'gomodel:src'))
    expect(payload.activityType).toBe('activity')
    expect(payload.label).toBe('Some gene product')
    expect(payload.sourceModelId).toBe('gomodel:src')
  })

  it('accepts a null source model id', () => {
    const payload = JSON.parse(serializeActivity(buildEnabledActivity(), null))
    expect(payload.sourceModelId).toBeNull()
  })

  it('serializes the form tree, not the raw activity', () => {
    const payload = JSON.parse(serializeActivity(buildEnabledActivity(), null))
    // Form-tree shape: TermNode has category/term/relations, not nodes/edges.
    expect(payload.root).toHaveProperty('category')
    expect(payload.root).toHaveProperty('relations')
    expect(payload.root).not.toHaveProperty('nodes')
    expect(payload.root).not.toHaveProperty('edges')
  })

  it('carries the enabled-by relation with its term and evidence', () => {
    const payload = JSON.parse(serializeActivity(buildEnabledActivity(), null))
    const rel = payload.root.relations.find(
      (r: { predicate: { id: string } }) => r.predicate.id === 'RO:0002333'
    )
    expect(rel).toBeDefined()
    expect(rel.target.term.id).toBe('UniProtKB:P12345')
    expect(rel.evidence[0].evidenceCode.id).toBe('ECO:0000314')
    expect(rel.evidence[0].reference).toBe('PMID:12345')
    expect(rel.evidence[0].withFrom).toBe('UniProtKB:Q99999')
  })

  it('is JSON-safe — round-trips without losing anything', () => {
    const text = serializeActivity(buildEnabledActivity(), 'gomodel:src')
    expect(JSON.parse(JSON.stringify(JSON.parse(text)))).toEqual(JSON.parse(text))
  })

  it('serializes a molecule activity with activityType "molecule"', () => {
    const node = { ...buildNode('CHEBI:1', 'a molecule'), rootTypes: [RootTypes.CHEMICAL_ENTITY] }
    const activity = { ...buildActivity('act-mol', [node]), type: ActivityType.MOLECULE }
    const payload = JSON.parse(serializeActivity(activity, null))
    expect(payload.activityType).toBe('molecule')
  })
})

// ── parseActivityClipboard ──────────────────────────────────────────

describe('parseActivityClipboard — accepts our own payloads', () => {
  it('round-trips a serialized activity', () => {
    const activity = buildEnabledActivity()
    const parsed = parseActivityClipboard(serializeActivity(activity, 'gomodel:src'))

    expect(parsed).not.toBeNull()
    expect(parsed!.kind).toBe(ACTIVITY_CLIPBOARD_KIND)
    expect(parsed!.activityType).toBe('activity')
    expect(parsed!.label).toBe('Some gene product')
    expect(parsed!.sourceModelId).toBe('gomodel:src')
    expect(parsed!.root.term?.id).toBe('GO:0003674')
  })

  it('tolerates leading and trailing whitespace', () => {
    const text = serializeActivity(buildEnabledActivity(), null)
    expect(parseActivityClipboard(`\n  ${text}  \n`)).not.toBeNull()
  })

  it('preserves the full relation subtree through the round trip', () => {
    const text = serializeActivity(buildEnabledActivity(), null)
    const parsed = parseActivityClipboard(text)!
    expect(parsed.root.relations).toHaveLength(1)
    expect(parsed.root.relations[0].target.term?.label).toBe('Some gene product')
  })
})

describe('parseActivityClipboard — rejects everything else', () => {
  const rejected: [string, string][] = [
    ['empty string', ''],
    ['whitespace only', '   \n\t '],
    ['ordinary prose', 'GO:0003674 molecular_function'],
    ['a bare GO id', 'GO:0003674'],
    ['malformed JSON', '{ "kind": '],
    ['a JSON array', '[1, 2, 3]'],
    ['JSON null', 'null'],
    ['a JSON string literal', '"just a string"'],
    ['an object with no kind', JSON.stringify({ root: { relations: [] } })],
    [
      'a foreign clipboard kind',
      JSON.stringify({ kind: 'something-else/v1', activityType: 'activity', root: { relations: [] } }),
    ],
    [
      'a future payload version',
      JSON.stringify({
        kind: 'noctua-activity/v2',
        activityType: 'activity',
        root: { relations: [] },
      }),
    ],
    ['our kind but no root', JSON.stringify({ kind: ACTIVITY_CLIPBOARD_KIND, activityType: 'activity' })],
    [
      'our kind but a non-object root',
      JSON.stringify({ kind: ACTIVITY_CLIPBOARD_KIND, activityType: 'activity', root: 'nope' }),
    ],
    [
      'our kind but relations is not an array',
      JSON.stringify({
        kind: ACTIVITY_CLIPBOARD_KIND,
        activityType: 'activity',
        root: { relations: {} },
      }),
    ],
    [
      'our kind but no activityType',
      JSON.stringify({ kind: ACTIVITY_CLIPBOARD_KIND, root: { relations: [] } }),
    ],
  ]

  it.each(rejected)('returns null for %s', (_name, text) => {
    expect(parseActivityClipboard(text)).toBeNull()
  })

  it('returns null rather than throwing on a null/undefined input', () => {
    expect(parseActivityClipboard(undefined as unknown as string)).toBeNull()
    expect(parseActivityClipboard(null as unknown as string)).toBeNull()
  })

  it('accepts a minimal hand-built payload that satisfies every guard', () => {
    const text = JSON.stringify({
      kind: ACTIVITY_CLIPBOARD_KIND,
      activityType: 'activity',
      root: { relations: [] },
    })
    expect(parseActivityClipboard(text)).not.toBeNull()
  })
})

// ── writeClipboardText ──────────────────────────────────────────────

describe('writeClipboardText', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  const setClipboard = (value: unknown) => {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true, writable: true })
  }

  afterEach(() => {
    setClipboard(originalClipboard)
    document.execCommand = originalExecCommand
    vi.restoreAllMocks()
  })

  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await expect(writeClipboardText('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('falls back to execCommand when the Clipboard API is absent', async () => {
    setClipboard(undefined)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand as unknown as typeof document.execCommand

    await expect(writeClipboardText('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand as unknown as typeof document.execCommand

    await expect(writeClipboardText('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('reports false when both paths fail', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand

    await expect(writeClipboardText('hello')).resolves.toBe(false)
  })

  it('reports false when execCommand itself throws', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => {
      throw new Error('nope')
    }) as unknown as typeof document.execCommand

    await expect(writeClipboardText('hello')).resolves.toBe(false)
  })

  it('leaves no stray textarea behind when the fallback succeeds', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn().mockReturnValue(true) as unknown as typeof document.execCommand

    await writeClipboardText('hello')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('leaves no stray textarea behind when execCommand throws', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => {
      throw new Error('nope')
    }) as unknown as typeof document.execCommand

    await writeClipboardText('hello')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })
})

// ── readActivityClipboard ───────────────────────────────────────────

describe('readActivityClipboard', () => {
  const originalClipboard = navigator.clipboard

  const setClipboard = (value: unknown) => {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true, writable: true })
  }

  beforeEach(() => {
    setClipboard(undefined)
  })

  afterEach(() => {
    setClipboard(originalClipboard)
    vi.restoreAllMocks()
  })

  it('reports "unsupported" when the Clipboard API is missing', async () => {
    setClipboard(undefined)
    await expect(readActivityClipboard()).resolves.toEqual({ status: 'unsupported' })
  })

  it('reports "unsupported" when readText is missing (write-only clipboard)', async () => {
    setClipboard({ writeText: vi.fn() })
    await expect(readActivityClipboard()).resolves.toEqual({ status: 'unsupported' })
  })

  it('reports "unsupported" when the read is denied', async () => {
    setClipboard({ readText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
    await expect(readActivityClipboard()).resolves.toEqual({ status: 'unsupported' })
  })

  it('reports "empty" when the clipboard holds unrelated text', async () => {
    setClipboard({ readText: vi.fn().mockResolvedValue('some copied prose') })
    await expect(readActivityClipboard()).resolves.toEqual({ status: 'empty' })
  })

  it('reports "empty" when the clipboard is blank', async () => {
    setClipboard({ readText: vi.fn().mockResolvedValue('') })
    await expect(readActivityClipboard()).resolves.toEqual({ status: 'empty' })
  })

  it('reports "ok" with the parsed payload for our own clipboard text', async () => {
    const text = serializeActivity(buildEnabledActivity(), 'gomodel:src')
    setClipboard({ readText: vi.fn().mockResolvedValue(text) })

    const result = await readActivityClipboard()
    expect(result.status).toBe('ok')
    expect(result.status === 'ok' && result.payload.label).toBe('Some gene product')
    expect(result.status === 'ok' && result.payload.sourceModelId).toBe('gomodel:src')
  })
})
