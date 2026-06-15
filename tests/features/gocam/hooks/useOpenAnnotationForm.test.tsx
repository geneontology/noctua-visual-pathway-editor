import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useOpenAnnotationForm } from '@/features/gocam/hooks/useOpenAnnotationForm'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'

describe('useOpenAnnotationForm', () => {
  it('opens the AnnotationForm dialog with onSubmit passed through customProps (no singleton handoff)', () => {
    const store = makeStore()
    const onSubmit = vi.fn()

    const { result } = renderHook(() => useOpenAnnotationForm(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    act(() => {
      result.current({
        showTerm: true,
        gpId: 'UniProtKB:P12345',
        aspect: 'F',
        onSubmit,
      })
    })

    const dialog = store.getState().dialog
    expect(dialog.open).toBe(true)
    expect(dialog.component).toBe(DialogComponent.ANNOTATION_FORM)
    expect(dialog.customProps.onSubmit).toBe(onSubmit)
    expect(dialog.customProps.showTerm).toBe(true)
    expect(dialog.customProps.gpId).toBe('UniProtKB:P12345')
  })

  it('uses showTerm to default the title between Add Annotation and Add Evidence', () => {
    const store = makeStore()

    const { result } = renderHook(() => useOpenAnnotationForm(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    act(() => {
      result.current({ showTerm: true, onSubmit: () => {} })
    })
    expect(store.getState().dialog.title).toBe('Add Annotation')

    act(() => {
      result.current({ showTerm: false, onSubmit: () => {} })
    })
    expect(store.getState().dialog.title).toBe('Add Evidence')
  })

  it('honors a caller-provided title', () => {
    const store = makeStore()

    const { result } = renderHook(() => useOpenAnnotationForm(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    act(() => {
      result.current({ showTerm: true, title: 'Pick a Term', onSubmit: () => {} })
    })
    expect(store.getState().dialog.title).toBe('Pick a Term')
  })
})
