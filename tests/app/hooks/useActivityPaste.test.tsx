import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActivityPaste } from '@/app/hooks/useActivityPaste'
import {
  ACTIVITY_CLIPBOARD_KIND,
  serializeActivity,
} from '@/features/gocam/services/activityClipboard'
import type { GraphNode } from '@/features/gocam/models/cam'
import { RootTypes } from '@/features/gocam/models/cam'
import { buildActivity, buildNode } from '@tests/fixtures/builders'

// ── Helpers ─────────────────────────────────────────────────────────

const validPayloadText = () => {
  const mf: GraphNode = {
    ...buildNode('GO:0003674', 'molecular_function'),
    rootTypes: [RootTypes.MOLECULAR_FUNCTION],
  }
  return serializeActivity(buildActivity('act-1', [mf]), 'gomodel:src')
}

/**
 * jsdom has no ClipboardEvent constructor, so build a plain cancelable Event
 * and hang a clipboardData stub off it — that's all the hook reads.
 */
const firePaste = (
  text: string | null,
  target: EventTarget = document.body
): Event => {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: text === null ? undefined : { getData: () => text },
    configurable: true,
  })
  target.dispatchEvent(event)
  return event
}

/** Mount an element in the document so dispatched events get a real target. */
const mount = <T extends HTMLElement>(el: T): T => {
  document.body.appendChild(el)
  return el
}

let onPaste: ReturnType<typeof vi.fn>

beforeEach(() => {
  onPaste = vi.fn()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ── Happy path ──────────────────────────────────────────────────────

describe('useActivityPaste — valid payload', () => {
  it('calls onPaste with the parsed payload', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText())

    expect(onPaste).toHaveBeenCalledTimes(1)
    const payload = onPaste.mock.calls[0][0]
    expect(payload.kind).toBe(ACTIVITY_CLIPBOARD_KIND)
    expect(payload.activityType).toBe('activity')
    expect(payload.sourceModelId).toBe('gomodel:src')
    expect(payload.root.term.id).toBe('GO:0003674')
  })

  it('consumes the event so the browser does not also paste the raw JSON', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    const event = firePaste(validPayloadText())
    expect(event.defaultPrevented).toBe(true)
  })

  it('handles repeated pastes', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText())
    firePaste(validPayloadText())
    expect(onPaste).toHaveBeenCalledTimes(2)
  })
})

// ── Non-payload clipboard content ───────────────────────────────────

describe('useActivityPaste — leaves other clipboard content alone', () => {
  const ignored: [string, string | null][] = [
    ['ordinary prose', 'just some copied text'],
    ['a GO id', 'GO:0003674'],
    ['malformed JSON', '{ "kind": '],
    ['a foreign JSON payload', JSON.stringify({ kind: 'other/v1', root: {} })],
    ['an empty string', ''],
    ['no clipboardData at all', null],
  ]

  it.each(ignored)('ignores %s', (_name, text) => {
    renderHook(() => useActivityPaste(true, onPaste))
    const event = firePaste(text)

    expect(onPaste).not.toHaveBeenCalled()
    // Critically: the event must stay un-consumed so normal paste still works.
    expect(event.defaultPrevented).toBe(false)
  })
})

// ── Editable targets ────────────────────────────────────────────────

describe('useActivityPaste — never hijacks a text field', () => {
  it('ignores a paste into an input', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    const event = firePaste(validPayloadText(), mount(document.createElement('input')))

    expect(onPaste).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores a paste into a textarea', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText(), mount(document.createElement('textarea')))
    expect(onPaste).not.toHaveBeenCalled()
  })

  it('ignores a paste into a select', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText(), mount(document.createElement('select')))
    expect(onPaste).not.toHaveBeenCalled()
  })

  it('ignores a paste into a contenteditable region', () => {
    const div = mount(document.createElement('div'))
    div.setAttribute('contenteditable', 'true')

    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText(), div)
    expect(onPaste).not.toHaveBeenCalled()
  })

  it('ignores a paste into an element nested inside a text field wrapper', () => {
    const wrapper = mount(document.createElement('div'))
    wrapper.setAttribute('contenteditable', '')
    const inner = document.createElement('span')
    wrapper.appendChild(inner)

    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText(), inner)
    expect(onPaste).not.toHaveBeenCalled()
  })

  it('still handles a paste on a plain non-editable element', () => {
    renderHook(() => useActivityPaste(true, onPaste))
    firePaste(validPayloadText(), mount(document.createElement('div')))
    expect(onPaste).toHaveBeenCalledTimes(1)
  })
})

// ── enabled flag + lifecycle ────────────────────────────────────────

describe('useActivityPaste — enabled flag', () => {
  it('does nothing while disabled', () => {
    renderHook(() => useActivityPaste(false, onPaste))
    const event = firePaste(validPayloadText())

    expect(onPaste).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('starts listening when it flips to enabled', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useActivityPaste(enabled, onPaste),
      { initialProps: { enabled: false } }
    )

    firePaste(validPayloadText())
    expect(onPaste).not.toHaveBeenCalled()

    rerender({ enabled: true })
    firePaste(validPayloadText())
    expect(onPaste).toHaveBeenCalledTimes(1)
  })

  it('stops listening when it flips to disabled', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useActivityPaste(enabled, onPaste),
      { initialProps: { enabled: true } }
    )

    firePaste(validPayloadText())
    expect(onPaste).toHaveBeenCalledTimes(1)

    rerender({ enabled: false })
    firePaste(validPayloadText())
    expect(onPaste).toHaveBeenCalledTimes(1)
  })
})

describe('useActivityPaste — lifecycle', () => {
  it('removes its listener on unmount', () => {
    const { unmount } = renderHook(() => useActivityPaste(true, onPaste))
    unmount()

    firePaste(validPayloadText())
    expect(onPaste).not.toHaveBeenCalled()
  })

  it('registers exactly one listener regardless of re-renders', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const { rerender } = renderHook(() => useActivityPaste(true, onPaste))

    rerender()
    rerender()

    const pasteRegistrations = addSpy.mock.calls.filter(([type]) => type === 'paste')
    expect(pasteRegistrations).toHaveLength(1)
  })

  it('calls the latest callback without re-subscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => useActivityPaste(true, cb), {
      initialProps: { cb: first },
    })

    rerender({ cb: second })
    firePaste(validPayloadText())

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
