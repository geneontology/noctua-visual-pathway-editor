import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

// Verifies the CAM toolbar's split edit affordances are wired correctly:
// each of the three icons/chips opens its own focused dialog, and the dialogs
// do not leak each other's fields. Companion to edit-form.spec.ts (which tests
// each dialog's contents in isolation).

test.describe('CAM toolbar — separate edit entry points', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('pen icon opens a dialog titled "Edit Title"', async ({ page }) => {
    await page.getByTestId('edit-model-title').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Edit Title', { exact: true })).toBeVisible()
  })

  test('state chip opens a dialog titled "Change State"', async ({ page }) => {
    // The state chip is rendered with the current state string as visible text.
    // The fixture's state is "production".
    await page.getByText('production', { exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Change State', { exact: true })).toBeVisible()
  })

  test('comment icon opens a dialog titled "Comments"', async ({ page }) => {
    // The comment icon is the FaComment ActionIcon. Locate by its sibling FaClone
    // (copy icon) is also available. We use the dialog's title to verify.
    // Click the third button in the row of icons (github / help / comment / copy ...)
    // — falling back to checking after the dialog opens.
    const commentButtons = page.locator('button:has(svg)')
    // The toolbar order is environment-dependent; iterate until a Comments dialog opens.
    let opened = false
    for (let i = 0; i < (await commentButtons.count()); i++) {
      await commentButtons.nth(i).click({ trial: false }).catch(() => {})
      const dialog = page.getByRole('dialog')
      const visible = await dialog.isVisible().catch(() => false)
      if (visible) {
        const titleText = await dialog.locator('header, [class*="DialogHeader"]').first().textContent().catch(() => '')
        if ((titleText ?? '').includes('Comments')) {
          opened = true
          break
        }
        // Wrong dialog — close it and try the next button.
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden({ timeout: 2_000 })
      }
    }
    expect(opened).toBe(true)
  })

  test('the three dialogs do not share state — closing one does not open another', async ({
    page,
  }) => {
    await page.getByTestId('edit-model-title').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // After closing the Title dialog, the State chip should still open ONLY the State dialog.
    await page.getByText('production', { exact: true }).first().click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Change State', { exact: true })).toBeVisible()
    await expect(dialog.getByLabel('Title')).toBeHidden()
  })
})
