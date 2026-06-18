import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { renderWithProviders } from '@tests/test-utils'
import WithDropdown from '@/features/gocam/components/forms/WithDropdown'

// WithDropdown parses an existing `DB:accession` string into editable groups and
// reconstructs it on "Ok". These tests pin that round-trip and confirm the
// namespaces added from with-from-allowed-namespaces.yaml are usable. The DB
// dropdown's full option list is exercised end-to-end (e2e/with-from.spec.ts);
// in jsdom Mantine only renders options once the dropdown is opened, so here we
// assert a preselected namespace renders as the chosen DB instead.

const renderDropdown = (currentValue: string) => {
  const anchorEl = document.createElement('div')
  // AnchoredPopover keeps its content hidden until the anchor has a non-zero
  // rect; jsdom reports all-zeros, so stub a real rect to make it visible.
  anchorEl.getBoundingClientRect = () =>
    ({ width: 120, height: 24, top: 40, bottom: 64, left: 20, right: 140, x: 20, y: 40, toJSON: () => ({}) }) as DOMRect
  document.body.appendChild(anchorEl)
  const onSave = vi.fn()
  const onClose = vi.fn()
  const utils = renderWithProviders(
    <MantineProvider>
      <WithDropdown
        anchorEl={anchorEl}
        currentValue={currentValue}
        onSave={onSave}
        onClose={onClose}
      />
    </MantineProvider>
  )
  return { ...utils, onSave, onClose }
}

const clickOk = (user: ReturnType<typeof renderDropdown>['user']) =>
  user.click(screen.getByRole('button', { name: 'Ok' }))

describe('WithDropdown — parse / reconstruct round-trip', () => {
  it('round-trips a multi-entry, multi-group value', async () => {
    // "," separates groups, "|" separates entities within a group.
    const { user, onSave } = renderDropdown('UniProtKB:P12345|MGI:1234,FB:FBgn0001')
    await clickOk(user)
    expect(onSave).toHaveBeenCalledWith('UniProtKB:P12345|MGI:1234,FB:FBgn0001')
  })

  it('preserves the namespaces added from the YAML (dictyBase, Ensembl, TAIR)', async () => {
    const { user, onSave } = renderDropdown(
      'dictyBase:DDB_G0277859|Ensembl:ENSG00000139618|TAIR:AT1G01010'
    )
    await clickOk(user)
    expect(onSave).toHaveBeenCalledWith(
      'dictyBase:DDB_G0277859|Ensembl:ENSG00000139618|TAIR:AT1G01010'
    )
  })

  it('drops entities with no database (no colon) on save', async () => {
    // "looseText" has no colon → parsed as the "None" placeholder → dropped.
    const { user, onSave } = renderDropdown('UniProtKB:P12345|looseText')
    await clickOk(user)
    expect(onSave).toHaveBeenCalledWith('UniProtKB:P12345')
  })

  it('saves an empty string for an empty value', async () => {
    const { user, onSave } = renderDropdown('')
    await clickOk(user)
    expect(onSave).toHaveBeenCalledWith('')
  })

  it('Cancel closes without saving', async () => {
    const { user, onSave, onClose } = renderDropdown('UniProtKB:P12345')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('WithDropdown — added namespaces are selectable', () => {
  // One group with three entities, each preset to a newly-added namespace. Each
  // DB Select renders that namespace as its value only because it is present in
  // the allowed-namespace option list fed to the Select.
  it.each(['dictyBase', 'Ensembl', 'TAIR'])('renders %s as the chosen DB', ns => {
    renderDropdown(`${ns}:ACC1`)
    expect(screen.getAllByDisplayValue(ns).length).toBeGreaterThan(0)
  })
})
