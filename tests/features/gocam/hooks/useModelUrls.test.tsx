import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModelUrls } from '@/features/gocam/hooks/useModelUrls'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

describe('useModelUrls', () => {
  it('returns null when modelId is undefined', () => {
    const { result } = renderHook(() => useModelUrls(undefined, 'tok'))
    expect(result.current).toBeNull()
  })

  it('returns null when modelId is the empty string', () => {
    const { result } = renderHook(() => useModelUrls('', 'tok'))
    expect(result.current).toBeNull()
  })

  it('builds all five URLs with the model_id param when no token is provided', () => {
    const { result } = renderHook(() => useModelUrls('gomodel:abc', null))
    const urls = result.current!
    expect(urls.annotationPreview).toBe(`${ENVIRONMENT.workbenchUrl}annpreview?model_id=gomodel%3Aabc`)
    expect(urls.pathwayViewer).toBe(
      `${ENVIRONMENT.workbenchUrl}noctua-alliance-pathway-preview?model_id=gomodel%3Aabc`
    )
    expect(urls.graphEditor).toBe(
      `${ENVIRONMENT.noctuaUrl}/editor/graph/gomodel:abc?model_id=gomodel%3Aabc`
    )
    expect(urls.gpad).toBe(`${ENVIRONMENT.noctuaUrl}/download/gomodel:abc/gpad`)
    expect(urls.owl).toBe(`${ENVIRONMENT.noctuaUrl}/download/gomodel:abc/owl`)
  })

  it('appends barista_token to all preview/editor URLs when provided', () => {
    const { result } = renderHook(() => useModelUrls('gomodel:abc', 'tok-123'))
    const urls = result.current!
    expect(urls.annotationPreview).toContain('barista_token=tok-123')
    expect(urls.pathwayViewer).toContain('barista_token=tok-123')
    expect(urls.graphEditor).toContain('barista_token=tok-123')
  })

  it('does not append barista_token to the gpad/owl download URLs', () => {
    const { result } = renderHook(() => useModelUrls('gomodel:abc', 'tok-123'))
    const urls = result.current!
    expect(urls.gpad).not.toContain('barista_token')
    expect(urls.owl).not.toContain('barista_token')
  })

  it('returns the same object reference when inputs are unchanged (useMemo memoization)', () => {
    const { result, rerender } = renderHook(
      ({ id, tok }: { id: string; tok: string | null }) => useModelUrls(id, tok),
      { initialProps: { id: 'gomodel:abc', tok: 'tok' } }
    )
    const first = result.current
    rerender({ id: 'gomodel:abc', tok: 'tok' })
    expect(result.current).toBe(first)
  })

  it('returns a new object when modelId changes', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useModelUrls(id, null),
      { initialProps: { id: 'gomodel:a' } }
    )
    const first = result.current
    rerender({ id: 'gomodel:b' })
    expect(result.current).not.toBe(first)
    expect(result.current!.gpad).toContain('gomodel:b')
  })
})
