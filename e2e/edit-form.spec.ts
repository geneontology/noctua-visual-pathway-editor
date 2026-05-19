import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('edit-model form interactions', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('another-model')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('edit-model-title').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('title input can be edited locally without saving', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('Title')

    const original = await titleInput.inputValue()
    await titleInput.fill('A new draft title — never saved')
    await expect(titleInput).toHaveValue('A new draft title — never saved')

    // Cancel — the toolbar title should still match the original
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('model-title')).toContainText(original)
  })

  test('Save button disables when title is empty (whitespace-only)', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('Title')
    const saveButton = dialog.getByRole('button', { name: 'Save' })

    await expect(saveButton).toBeEnabled()
    await titleInput.fill('')
    await expect(saveButton).toBeDisabled()
    await titleInput.fill('   ')
    await expect(saveButton).toBeDisabled()
    await titleInput.fill('valid')
    await expect(saveButton).toBeEnabled()
  })

  test('can add a comment row', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const initialTextareaCount = await dialog.locator('textarea').count()

    // The "+" ActionIcon next to the "Comments" label
    const addButton = dialog
      .locator('div', { hasText: /^Comments$/ })
      .locator('button')
      .first()
    await addButton.click()

    await expect(dialog.locator('textarea')).toHaveCount(initialTextareaCount + 1)
  })

  test('typing into a comment row updates only that row', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const addButton = dialog
      .locator('div', { hasText: /^Comments$/ })
      .locator('button')
      .first()

    await addButton.click()
    await addButton.click()

    const textareas = dialog.locator('textarea')
    const total = await textareas.count()
    // Type only into the last one
    await textareas.nth(total - 1).fill('I am the second new comment.')
    await expect(textareas.nth(total - 1)).toHaveValue('I am the second new comment.')
    await expect(textareas.nth(total - 2)).toHaveValue('')
  })

  test('state dropdown lists all model lifecycle states', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    // Mantine Select renders a combobox in its input; click to open dropdown
    const stateSelect = dialog.getByRole('textbox', { name: '' }).nth(0).or(
      dialog.locator('input[role="combobox"]').first()
    )
    // Fall back to clicking the visible state value to open the dropdown
    const select = dialog.locator('input[role="combobox"]').first()
    await select.click()

    // MODEL_STATES = development, production, review, closed, delete
    for (const s of ['development', 'production', 'review', 'closed', 'delete']) {
      await expect(page.getByRole('option', { name: s })).toBeVisible()
    }
    // Touch stateSelect to silence the unused locator linter
    void stateSelect
  })
})
