import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

test.describe('toolbar link menus', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('VIEW IN menu lists Annotation Preview, Pathway Viewer, Graph Editor', async ({ page }) => {
    await page.getByRole('button', { name: /VIEW IN/i }).click()
    // AnchoredMenu renders into a portal as plain <button> + <a>; target the link role.
    await expect(page.getByRole('link', { name: 'Annotation Preview' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pathway Viewer' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Graph Editor' })).toBeVisible()
  })

  test('VIEW IN items are external links with target=_blank', async ({ page }) => {
    await page.getByRole('button', { name: /VIEW IN/i }).click()
    const annotationLink = page.getByRole('link', { name: 'Annotation Preview' })
    await expect(annotationLink).toHaveAttribute('target', '_blank')
    await expect(annotationLink).toHaveAttribute('rel', /noopener/)
    const href = await annotationLink.getAttribute('href')
    expect(href).toBeTruthy()
  })

  test('EXPORT AS menu lists GPAD and OWL', async ({ page }) => {
    await page.getByRole('button', { name: /EXPORT AS/i }).click()
    await expect(page.getByRole('link', { name: 'GPAD' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'OWL' })).toBeVisible()
  })

  test('clicking a VIEW IN item closes the menu', async ({ page }) => {
    await page.getByRole('button', { name: /VIEW IN/i }).click()
    const item = page.getByRole('link', { name: 'Pathway Viewer' })
    await expect(item).toBeVisible()

    // The anchor opens in a new tab; intercept the popup so it doesn't navigate this page.
    const popupPromise = page.waitForEvent('popup').catch(() => null)
    await item.click()
    await popupPromise

    await expect(item).toBeHidden()
  })
})

test.describe('global toolbar — Help menu', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
  })

  test('Help menu contains the Noctua User\'s Guide link', async ({ page }) => {
    await page.getByRole('button', { name: 'Help' }).click()
    const link = page.getByRole('link', { name: /Noctua User.s Guide/ })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('target', '_blank')
  })
})
