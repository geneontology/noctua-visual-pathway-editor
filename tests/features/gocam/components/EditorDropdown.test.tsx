import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import EditorDropdown from '@/features/gocam/components/forms/EditorDropdown'
import { EditorCategory } from '@/features/gocam/models/editorCategory'
import { RootTypes } from '@/features/gocam/models/cam'

// Stub the term/evidence autocomplete so we can assert the closure filters that
// reach the search query, without pulling in RTK Query / JSONP. The term box
// renders as `editor-term`; we surface rootTypeIds + excludeRootTypeIds as JSON.
vi.mock('@/features/search/components/Autocomplete', () => ({
  default: ({
    name,
    rootTypeIds,
    excludeRootTypeIds,
  }: {
    name: string
    rootTypeIds?: string[]
    excludeRootTypeIds?: string[]
  }) => (
    <div data-testid={`autocomplete-${name}`}>
      <span data-testid={`autocomplete-roottypes-${name}`}>
        {JSON.stringify(rootTypeIds ?? null)}
      </span>
      <span data-testid={`autocomplete-excludes-${name}`}>
        {JSON.stringify(excludeRootTypeIds ?? null)}
      </span>
    </div>
  ),
}))

const renderDropdown = (termRootTypes?: string[]) => {
  const anchorEl = document.createElement('div')
  document.body.appendChild(anchorEl)
  return renderWithProviders(
    <MantineProvider>
      <EditorDropdown
        anchorEl={anchorEl}
        category={EditorCategory.term}
        termRootTypes={termRootTypes}
        onClose={() => {}}
        onSave={() => {}}
      />
    </MantineProvider>
  )
}

const termExcludes = (): unknown =>
  JSON.parse(screen.getByTestId('autocomplete-excludes-editor-term').textContent || 'null')

const termIncludes = (): unknown =>
  JSON.parse(screen.getByTestId('autocomplete-roottypes-editor-term').textContent || 'null')

// The inline single-field editor must apply the same closure exclusions as the
// Activity Form (EntityRow), derived from the category's excludeClosureIds in
// nodeCategories.ts. Without this, editing a CC term surfaces protein-containing
// complex and editing a Molecule/Chemical term surfaces information biomacromolecule.
describe('EditorDropdown — term search exclusions (match Activity Form rules)', () => {
  it('CC search excludes protein-containing complex (GO:0032991)', () => {
    renderDropdown([RootTypes.CELLULAR_COMPONENT])
    expect(termExcludes()).toEqual([RootTypes.PROTEIN_CONTAINING_COMPLEX])
  })

  it('Molecule/Chemical search excludes information biomacromolecule / gene product (CHEBI:33695)', () => {
    renderDropdown([RootTypes.CHEMICAL_ENTITY])
    expect(termExcludes()).toEqual([RootTypes.MOLECULAR_ENTITY])
  })

  it('passes the include closures through unchanged', () => {
    renderDropdown([RootTypes.CELLULAR_COMPONENT])
    expect(termIncludes()).toEqual([RootTypes.CELLULAR_COMPONENT])
  })

  it('applies no exclusions for a category that defines none (BP)', () => {
    renderDropdown([RootTypes.BIOLOGICAL_PROCESS])
    expect(termExcludes()).toBeNull()
  })

  it('applies no exclusions when termRootTypes is omitted', () => {
    renderDropdown(undefined)
    expect(termExcludes()).toBeNull()
  })
})
