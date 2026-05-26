import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('stencil palette', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('renders the Toolbox header', async ({ page }) => {
    await expect(page.getByTestId('stencil-palette')).toBeVisible()
    await expect(page.getByText('Toolbox')).toBeVisible()
  })

  test('renders all three stencil tiles', async ({ page }) => {
    await expect(page.getByTestId('stencil-default')).toBeVisible()
    await expect(page.getByTestId('stencil-proteinComplex')).toBeVisible()
    await expect(page.getByTestId('stencil-molecule')).toBeVisible()
  })

  test('tile labels are user-visible', async ({ page }) => {
    const palette = page.getByTestId('stencil-palette')
    await expect(palette.getByText('DEFAULT')).toBeVisible()
    await expect(palette.getByText('PROTEIN COMPLEX')).toBeVisible()
    await expect(palette.getByText('MOLECULE')).toBeVisible()
  })

  test('every tile is draggable and exposes a tooltip', async ({ page }) => {
    for (const id of ['default', 'proteinComplex', 'molecule']) {
      const tile = page.getByTestId(`stencil-${id}`)
      await expect(tile).toHaveAttribute('draggable', 'true')
      // Each tile's `title` is the description from camStencil
      const title = await tile.getAttribute('title')
      expect(title?.length ?? 0).toBeGreaterThan(0)
    }
  })

  test('tile icons render', async ({ page }) => {
    for (const id of ['default', 'proteinComplex', 'molecule']) {
      const tile = page.getByTestId(`stencil-${id}`)
      const img = tile.locator('img')
      await expect(img).toBeVisible()
      const src = await img.getAttribute('src')
      expect(src).toContain('/assets/images/activity/')
    }
  })
})
