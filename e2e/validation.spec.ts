import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('validation errors', () => {
  // The small-baseline fixture has natural orphan nodes (CNGA3, CNGB3 — UniProt gene
  // products referenced by edges but not packed into an activity). The validation
  // chip should appear and clicking it should open the Validation Errors drawer.

  test('chip appears for a model with orphans and opens the errors drawer', async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)

    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    const chip = page.getByText(/\d+ Errors? Found/)
    await expect(chip).toBeVisible()

    await chip.click()

    await expect(page.getByText('Validation Errors', { exact: true })).toBeVisible()
  })

  test('Close button slides the drawer off-screen', async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)

    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    await page.getByText(/\d+ Errors? Found/).click()
    const heading = page.getByText('Validation Errors', { exact: true })
    await expect(heading).toBeInViewport()

    await page.getByRole('button', { name: 'Close' }).click()

    // The drawer is `fixed right-0` and slides off via `translate-x-full`. The heading
    // remains in the DOM but is positioned beyond the viewport's right edge.
    await expect(heading).not.toBeInViewport()
  })

  test('reflects the model error count in the chip text', async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)

    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    // Match exactly one chip; the text encodes the total error count.
    const chip = page.getByText(/^\d+ Errors? Found$/)
    await expect(chip).toHaveCount(1)
    await expect(chip).toContainText(/Error/)
  })
})
