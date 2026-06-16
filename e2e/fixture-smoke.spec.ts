import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import type { FixtureName } from './mocks/barista'
import {
  getModelIdFromRaw,
  getTitleFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

// Smoke-test all three real Barista snapshots in tests/fixtures/raw/.
// Each fixture should load, populate the toolbar, mount the canvas, and not surface
// the transport-error overlay.

const fixtures: FixtureName[] = ['small-baseline', 'diverse-relations', 'large-scale']

for (const name of fixtures) {
  test.describe(`fixture: ${name}`, () => {
    test('loads, populates toolbar, mounts canvas, no transport error', async ({ page }) => {
      const raw = loadRaw(name)
      await mockBaristaMetadata(page)
      await mockBaristaModel(page, raw)

      await page.goto(buildModelUrl(getModelIdFromRaw(raw)))

      // Splash dismisses
      await expect(page.locator('img[alt="App Logo"]')).toBeHidden({ timeout: 10_000 })

      // Toolbar shows the model title from the raw annotations
      const expectedTitle = getTitleFromRaw(raw)
      await expect(page.getByTestId('model-title')).toContainText(expectedTitle)

      // Loading overlay gone, no transport error
      await expect(page.getByText('Loading...', { exact: true })).toBeHidden()
      await expect(page.getByText('Error loading graph data')).toHaveCount(0)

      // Stencil + graph toolbar mount = editor surface is intact
      await expect(page.getByTestId('stencil-palette')).toBeVisible()
      await expect(page.getByTestId('graph-toolbar')).toBeVisible()

      // Read-only banner shows (no barista_token in this test)
      await expect(page.getByText('Not Logged In:')).toBeVisible()
    })

    test('renders Title: prefix and tooltip target', async ({ page }) => {
      const raw = loadRaw(name)
      await mockBaristaMetadata(page)
      await mockBaristaModel(page, raw)

      await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
      const title = page.getByTestId('model-title')
      await expect(title).toBeVisible({ timeout: 10_000 })
      await expect(title).toContainText('Title:')
    })
  })
}
