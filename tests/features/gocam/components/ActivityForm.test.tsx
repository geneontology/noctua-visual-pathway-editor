import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import { makeStore } from '@/app/store/store'
import ActivityForm from '@/features/gocam/components/forms/ActivityForm'
import {
  initCreateForm,
  updateTerm,
} from '@/features/gocam/slices/activityFormSlice'
import { FormMode } from '@/features/gocam/models/formModels'
import type { ActivityFormType } from '@/features/gocam/models/formModels'

// ── External mocks ─────────────────────────────────────────────────
//
// ActivityForm renders EntityRow rows, which use TermAutocomplete +
// DatabaseField for their inputs, and the form itself mounts a
// SearchAnnotations picker. All three reach for lookup/portal machinery that
// doesn't belong in this unit test — stub them so the form renders in jsdom.
vi.mock('@/features/search/components/Autocomplete', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid={`autocomplete-${name}`}>{label}</div>
  ),
}))
vi.mock('@/features/gocam/components/forms/DatabaseField', () => ({
  default: ({ type }: { type: 'reference' | 'with' }) => (
    <div data-testid={`db-${type}`}>{type}</div>
  ),
}))
vi.mock('@/features/gocam/components/forms/SearchAnnotations', () => ({
  default: () => null,
}))

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Seed a store with a hydrated form of `type` whose root term has been filled
 * in (so the form is dirty), then render <ActivityForm>. Returns the store and
 * the user-event handle.
 */
const renderDirtyForm = (type: ActivityFormType) => {
  const store = makeStore()
  store.dispatch(initCreateForm(type))
  const rootUid = store.getState().activityForm.root!.uid
  store.dispatch(
    updateTerm({ uid: rootUid, term: { id: 'GO:0016301', label: 'kinase activity' } })
  )

  const utils = renderWithProviders(
    <MantineProvider>
      <ActivityForm onSaved={vi.fn()} />
    </MantineProvider>,
    { store }
  )
  return { store, ...utils }
}

const clickClear = (user: ReturnType<typeof renderDirtyForm>['user']) =>
  user.click(screen.getByRole('button', { name: 'Clear' }))

// ── Tests ──────────────────────────────────────────────────────────

describe('ActivityForm — Clear button', () => {
  it('resets the form fields to a fresh blank template instead of clearing them away', async () => {
    const { store, user } = renderDirtyForm('activity')

    // Sanity: the form starts dirty with the filled-in term.
    expect(store.getState().activityForm.isDirty).toBe(true)
    expect(store.getState().activityForm.root!.term).toEqual({
      id: 'GO:0016301',
      label: 'kinase activity',
    })

    await clickClear(user)

    const state = store.getState().activityForm
    expect(state.root).not.toBeNull() // form still has a template (not torn down)
    expect(state.root!.term).toBeNull() // the filled term was cleared
    expect(state.isDirty).toBe(false) // fresh template, no pending edits
    // A real fresh template is rebuilt — not just the term nulled out.
    const predicates = state.root!.relations.map(r => r.predicate.id)
    expect(predicates).toContain('RO:0002333') // ENABLED_BY
    expect(predicates).toContain('BFO:0000050') // PART_OF
  })

  it('keeps the form open and editable after clearing (does not close the dialog)', async () => {
    const { user } = renderDirtyForm('activity')

    await clickClear(user)

    // The form body still renders — it did not collapse to the loading state
    // (which is what would happen if Clear had reset root to null) nor unmount.
    expect(screen.queryByText('Loading form...')).toBeNull()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('preserves the activity type when clearing (stays CREATE mode, same type)', async () => {
    const { store, user } = renderDirtyForm('molecule')

    await clickClear(user)

    const state = store.getState().activityForm
    expect(state.activityType).toBe('molecule')
    expect(state.mode).toBe(FormMode.CREATE)
    expect(state.root!.term).toBeNull()
  })
})
