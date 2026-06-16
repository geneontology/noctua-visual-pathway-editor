import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('edit-model dialog', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('closes when the inner Cancel button is clicked', async ({ page }) => {
    await page.getByTestId('edit-model-title').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // CamMetadataForm renders its own Cancel button (showActions is false on SimpleDialog,
    // so the dialog's framework Cancel isn't shown).
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })

  test('closes when Escape is pressed', async ({ page }) => {
    await page.getByTestId('edit-model-title').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('preserves the model title after open + cancel', async ({ page }) => {
    const titleBefore = await page.getByTestId('model-title').textContent()

    await page.getByTestId('edit-model-title').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()

    // Title in the toolbar is unchanged (no save fired)
    await expect(page.getByTestId('model-title')).toHaveText(titleBefore ?? '')
  })

  test('shows the current title pre-filled in the dialog input', async ({ page }) => {
    await page.getByTestId('edit-model-title').click()
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('Title')
    await expect(titleInput).toBeVisible()
    const value = await titleInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })
})
