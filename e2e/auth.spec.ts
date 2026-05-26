import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
  mockUserInfoByToken,
} from './mocks/barista'

test.describe('auth banner', () => {
  test('shows "Not Logged In" when visiting without a barista_token', async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)

    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    await expect(page.getByText('Not Logged In:')).toBeVisible()
  })

  test('hides the banner when a barista_token resolves to a real user', async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await mockUserInfoByToken(page, { loggedIn: true })

    await page.goto(buildModelUrl(getModelIdFromRaw(raw), { baristaToken: 'test-barista-token' }))

    // Wait for toolbar (proves model loaded)
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    // Login dispatch happens after user_info resolves
    await expect(page.getByText('Not Logged In:')).toHaveCount(0)
    // Logged-in name appears in the global toolbar
    await expect(page.getByText('Test User').first()).toBeVisible()
  })

  test('keeps banner visible when user_info_by_token returns no token (invalid token)', async ({ page }) => {
    const raw = loadRaw('diverse-relations')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await mockUserInfoByToken(page, { loggedIn: false })

    await page.goto(buildModelUrl(getModelIdFromRaw(raw), { baristaToken: 'bogus-token' }))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    // useAuthSetup clears user when response has no token → banner stays
    await expect(page.getByText('Not Logged In:')).toBeVisible()
  })
})
