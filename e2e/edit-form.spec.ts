import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

// The CAM toolbar's edit affordances were split into three single-purpose dialogs:
//   Pen icon         → Edit Title (title only)
//   Comment icon     → Comments (comments only)
//   State chip       → Change State (state only)
// Each spec below verifies one of those entry points in isolation.

test.describe('Edit Title dialog (pen icon)', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('edit-model-title').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows only the title field — no State, no Comments', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel('Title')).toBeVisible()
    // The combined dialog used to show these; the split title dialog should not.
    await expect(dialog.getByText(/^Comments$/)).toBeHidden()
    await expect(dialog.locator('input[role="combobox"]')).toHaveCount(0)
  })

  test('Save disables on empty / whitespace-only title', async ({ page }) => {
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

  test('Cancel discards the change and closes', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const titleInput = dialog.getByLabel('Title')
    const original = await titleInput.inputValue()

    await titleInput.fill('A draft title that should not persist')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('model-title')).toContainText(original)
  })
})

test.describe('Comments dialog (comment icon)', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    // Comment icon — locate via aria-label on the surrounding ActionIcon's child SVG title
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(0) // hint
    await page.locator('button:has(svg)').filter({ hasText: '' }).nth(2).click()
    // ↑ the toolbar order is: github · help-menu · user · comment · copy ...
    // Fall back to the Comments heading inside the dialog.
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })
  })

  test('shows the Comments heading and an Add button', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/^Comments$/)).toBeVisible()
    await expect(dialog.getByLabel('Add comment')).toBeVisible()
  })

  test('Add appends an empty comment row', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    const initialTextareaCount = await dialog.locator('textarea').count()
    await dialog.getByLabel('Add comment').click()
    await expect(dialog.locator('textarea')).toHaveCount(initialTextareaCount + 1)
  })

  test('typing only affects the targeted row', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Add comment').click()
    await dialog.getByLabel('Add comment').click()
    const textareas = dialog.locator('textarea')
    const total = await textareas.count()
    await textareas.nth(total - 1).fill('Second new comment')
    await expect(textareas.nth(total - 1)).toHaveValue('Second new comment')
    await expect(textareas.nth(total - 2)).toHaveValue('')
  })
})

test.describe('Change State dialog (state chip)', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    // State chip — the visible chip carrying the current state string ("production" here)
    await page.getByText('production', { exact: true }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })
  })

  test('shows only the State select — no title, no comments', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('input[role="combobox"]')).toBeVisible()
    await expect(dialog.getByLabel('Title')).toBeHidden()
    await expect(dialog.getByText(/^Comments$/)).toBeHidden()
  })

  test('lists every model lifecycle state in the dropdown', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await dialog.locator('input[role="combobox"]').first().click()
    for (const s of ['development', 'production', 'review', 'closed', 'delete']) {
      await expect(page.getByRole('option', { name: s })).toBeVisible()
    }
  })
})
