import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('graph toolbar', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('graph-toolbar')).toBeVisible({ timeout: 10_000 })
  })

  test('renders all the action controls', async ({ page }) => {
    await expect(page.getByTestId('graph-auto-layout')).toBeVisible()
    await expect(page.getByTestId('graph-detail-menu')).toBeVisible()
    await expect(page.getByTestId('graph-spacing-menu')).toBeVisible()
    await expect(page.getByTestId('graph-zoom-in')).toBeVisible()
    await expect(page.getByTestId('graph-zoom-out')).toBeVisible()
    await expect(page.getByTestId('graph-zoom-reset')).toBeVisible()
  })

  test('Auto Layout button is clickable', async ({ page }) => {
    // Clicking should not throw or otherwise crash the canvas-bound handler.
    await page.getByTestId('graph-auto-layout').click()
    await expect(page.getByTestId('graph-toolbar')).toBeVisible()
  })

  test('Detail pill opens a menu with all options', async ({ page }) => {
    await page.getByTestId('graph-detail-menu').click()
    // From toolbarOptions.ts: Detailed / Activity / Simple
    for (const opt of ['Detailed', 'Activity', 'Simple']) {
      await expect(page.getByRole('menuitem', { name: opt })).toBeVisible()
    }
  })

  test('selecting a Detail option updates the pill label', async ({ page }) => {
    await page.getByTestId('graph-detail-menu').click()
    await page.getByRole('menuitem', { name: 'Simple' }).click()
    await expect(page.getByTestId('graph-detail-menu')).toContainText('Simple')
  })

  test('Spacing pill opens a menu with both options', async ({ page }) => {
    await page.getByTestId('graph-spacing-menu').click()
    // From toolbarOptions.ts: Compact / Loose
    await expect(page.getByRole('menuitem', { name: 'Compact' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Loose' })).toBeVisible()
  })

  test('selecting a Spacing option updates the pill label', async ({ page }) => {
    await page.getByTestId('graph-spacing-menu').click()
    await page.getByRole('menuitem', { name: 'Loose' }).click()
    await expect(page.getByTestId('graph-spacing-menu')).toContainText('Loose')
  })

  test('zoom buttons are clickable without error', async ({ page }) => {
    await page.getByTestId('graph-zoom-in').click()
    await page.getByTestId('graph-zoom-out').click()
    await page.getByTestId('graph-zoom-reset').click()
    await expect(page.getByTestId('graph-toolbar')).toBeVisible()
  })

  test('zoom controls expose accessible names', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible()
  })
})
