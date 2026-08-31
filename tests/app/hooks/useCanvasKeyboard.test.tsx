import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanvasKeyboard } from '@/app/hooks/useCanvasKeyboard'
import type { CamCanvas } from '@/features/pathway/graph/camCanvas'

// ── Helpers ─────────────────────────────────────────────────────────

/** Only the four methods the hook calls — no JointJS paper needed. */
const buildCanvas = (selection: string[] = []) => ({
  clearSelection: vi.fn(),
  selectAll: vi.fn(),
  nudgeSelection: vi.fn(),
  getSelection: vi.fn(() => selection),
})

type FakeCanvas = ReturnType<typeof buildCanvas>

const refTo = (canvas: FakeCanvas | null) =>
  ({ current: canvas }) as unknown as React.MutableRefObject<CamCanvas | null>

const fireKey = (
  key: string,
  { target = document.body, ctrl = false, meta = false } = {}
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: ctrl,
    metaKey: meta,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

/** Mount an element so dispatched events get a real target. */
const mount = <T extends HTMLElement>(el: T): T => {
  document.body.appendChild(el)
  return el
}

let canvas: FakeCanvas

beforeEach(() => {
  canvas = buildCanvas()
})

afterEach(() => {
  document.body.innerHTML = ''
})

// ── Tests ───────────────────────────────────────────────────────────

describe('useCanvasKeyboard', () => {
  describe('Escape', () => {
    it('clears the selection', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      fireKey('Escape')

      expect(canvas.clearSelection).toHaveBeenCalledTimes(1)
    })
  })

  describe('select all', () => {
    it('selects everything on Ctrl+A and claims the key', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      const event = fireKey('a', { ctrl: true })

      expect(canvas.selectAll).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(true)
    })

    it('also works with Cmd+A', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      fireKey('a', { meta: true })

      expect(canvas.selectAll).toHaveBeenCalledTimes(1)
    })

    it('handles a capitalised A', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      fireKey('A', { ctrl: true })

      expect(canvas.selectAll).toHaveBeenCalledTimes(1)
    })

    it('leaves a bare "a" alone so typing still works', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      const event = fireKey('a')

      expect(canvas.selectAll).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('arrow-key nudge', () => {
    beforeEach(() => {
      canvas = buildCanvas(['act-1'])
    })

    it.each([
      ['ArrowUp', 0, -1],
      ['ArrowDown', 0, 1],
      ['ArrowLeft', -1, 0],
      ['ArrowRight', 1, 0],
    ])('%s nudges by (%i, %i)', (key, dx, dy) => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      const event = fireKey(key)

      expect(canvas.nudgeSelection).toHaveBeenCalledWith(dx, dy)
      expect(event.defaultPrevented).toBe(true)
    })

    it('does nothing when the selection is empty, leaving the key to the page', () => {
      canvas = buildCanvas([])
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      const event = fireKey('ArrowUp')

      expect(canvas.nudgeSelection).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('editable targets', () => {
    it.each(['input', 'textarea', 'select'])('ignores keys aimed at a <%s>', tag => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))
      const field = mount(document.createElement(tag))

      fireKey('Escape', { target: field })
      fireKey('a', { target: field, ctrl: true })

      expect(canvas.clearSelection).not.toHaveBeenCalled()
      expect(canvas.selectAll).not.toHaveBeenCalled()
    })

    it('ignores keys inside a contenteditable', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))
      const editor = mount(document.createElement('div'))
      editor.setAttribute('contenteditable', 'true')

      fireKey('Escape', { target: editor })

      expect(canvas.clearSelection).not.toHaveBeenCalled()
    })

    it('ignores keys from an element nested inside a text field', () => {
      renderHook(() => useCanvasKeyboard(true, refTo(canvas)))
      const editor = mount(document.createElement('div'))
      editor.setAttribute('contenteditable', 'true')
      const inner = editor.appendChild(document.createElement('span'))

      fireKey('Escape', { target: inner })

      expect(canvas.clearSelection).not.toHaveBeenCalled()
    })
  })

  describe('enablement', () => {
    it('does nothing while disabled — a dialog owns the keyboard', () => {
      renderHook(() => useCanvasKeyboard(false, refTo(canvas)))

      fireKey('Escape')
      fireKey('a', { ctrl: true })

      expect(canvas.clearSelection).not.toHaveBeenCalled()
      expect(canvas.selectAll).not.toHaveBeenCalled()
    })

    it('starts listening when it becomes enabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useCanvasKeyboard(enabled, refTo(canvas)),
        { initialProps: { enabled: false } }
      )

      fireKey('Escape')
      expect(canvas.clearSelection).not.toHaveBeenCalled()

      rerender({ enabled: true })
      fireKey('Escape')
      expect(canvas.clearSelection).toHaveBeenCalledTimes(1)
    })

    it('stops listening on unmount', () => {
      const { unmount } = renderHook(() => useCanvasKeyboard(true, refTo(canvas)))

      unmount()
      fireKey('Escape')

      expect(canvas.clearSelection).not.toHaveBeenCalled()
    })
  })

  it('does not throw before the canvas has mounted', () => {
    renderHook(() => useCanvasKeyboard(true, refTo(null)))

    expect(() => fireKey('Escape')).not.toThrow()
    expect(() => fireKey('ArrowUp')).not.toThrow()
  })
})
