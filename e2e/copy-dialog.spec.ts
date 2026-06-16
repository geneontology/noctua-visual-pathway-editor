import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  getTitleFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('copy model dialog', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('opens the dialog from the toolbar clone icon', async ({ page }) => {
    await page.getByTestId('toolbar-copy').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Copy Model')
  })

  test('pre-fills the title with "Copy of <model title>"', async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    const original = getTitleFromRaw(raw)

    await page.getByTestId('toolbar-copy').click()
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('New Model Title')

    await expect(titleInput).toHaveValue(`Copy of ${original}`)
  })

  test('checkbox toggles include-evidence', async ({ page }) => {
    await page.getByTestId('toolbar-copy').click()
    const checkbox = page.getByRole('checkbox', { name: 'Include evidence' })

    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()
  })

  test('Copy button disables when the title is empty', async ({ page }) => {
    await page.getByTestId('toolbar-copy').click()
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('New Model Title')
    const copyButton = dialog.getByRole('button', { name: 'Copy' })

    await expect(copyButton).toBeEnabled()
    await titleInput.fill('')
    await expect(copyButton).toBeDisabled()

    // Whitespace-only also disabled (the component trims before checking)
    await titleInput.fill('   ')
    await expect(copyButton).toBeDisabled()
  })

  test('Cancel button closes the dialog', async ({ page }) => {
    await page.getByTestId('toolbar-copy').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })
})
