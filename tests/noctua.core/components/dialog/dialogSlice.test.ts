import { describe, it, expect } from 'vitest'
import reducer, {
  openDialog,
  closeDialog,
  selectDialogState,
  DialogComponent,
} from '@/@noctua.core/components/dialog/dialogSlice'

const initial = reducer(undefined, { type: '@@INIT' })

describe('dialogSlice reducers', () => {
  it('starts closed with sensible defaults', () => {
    expect(initial.open).toBe(false)
    expect(initial.title).toBe('')
    expect(initial.size).toBe('md')
    expect(initial.fullWidth).toBe(true)
    expect(initial.showActions).toBe(false)
    expect(initial.confirmLabel).toBe('Confirm')
    expect(initial.cancelLabel).toBe('Cancel')
    expect(initial.preventBackdropClose).toBe(false)
    expect(initial.bodyScroll).toBe('auto')
    expect(initial.component).toBeNull()
    expect(initial.customProps).toEqual({})
  })

  it('openDialog flips open=true and merges payload fields', () => {
    const next = reducer(
      initial,
      openDialog({
        component: DialogComponent.ANNOTATION_FORM,
        title: 'Add Annotation',
        size: 'lg',
        customProps: { gpId: 'UniProtKB:P0' },
      })
    )
    expect(next.open).toBe(true)
    expect(next.component).toBe(DialogComponent.ANNOTATION_FORM)
    expect(next.title).toBe('Add Annotation')
    expect(next.size).toBe('lg')
    expect(next.customProps).toEqual({ gpId: 'UniProtKB:P0' })
  })

  it('openDialog preserves unspecified default fields', () => {
    const next = reducer(initial, openDialog({ component: DialogComponent.CAM_TITLE_FORM }))
    expect(next.confirmLabel).toBe('Confirm')
    expect(next.cancelLabel).toBe('Cancel')
    expect(next.fullWidth).toBe(true)
    expect(next.bodyScroll).toBe('auto')
  })

  it('closeDialog flips open=false but preserves the last-set component + customProps', () => {
    const opened = reducer(
      initial,
      openDialog({ component: DialogComponent.CAM_TITLE_FORM, title: 'Edit Title' })
    )
    const closed = reducer(opened, closeDialog())
    expect(closed.open).toBe(false)
    expect(closed.component).toBe(DialogComponent.CAM_TITLE_FORM)
    expect(closed.title).toBe('Edit Title')
  })

  it('selectDialogState returns the slice as-is', () => {
    const state = { dialog: { ...initial, open: true, title: 'X' } }
    expect(selectDialogState(state)).toBe(state.dialog)
  })

  it('reopening with a different component replaces the component + props', () => {
    const first = reducer(
      initial,
      openDialog({ component: DialogComponent.ANNOTATION_FORM, customProps: { a: 1 } })
    )
    const second = reducer(
      first,
      openDialog({ component: DialogComponent.CAM_COMMENTS_FORM, customProps: { b: 2 } })
    )
    expect(second.component).toBe(DialogComponent.CAM_COMMENTS_FORM)
    expect(second.customProps).toEqual({ b: 2 })
  })
})
