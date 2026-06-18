import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

// The with/from allow-list mirrors geneontology/noctua
// metadata/with-from-allowed-namespaces.yaml. A curator sees it through the
// "Allowed With/From DBs" info dialog in an activity's detail table (right
// drawer), which opens on double-clicking a graph node — same entry point as
// link-outs.spec.ts. This guards that the namespaces (incl. the YAML additions
// dictyBase / Ensembl / TAIR) actually reach the UI, which the jsdom unit test
// can't assert (Mantine only renders Select options once the dropdown opens).

test.describe('with/from allowed namespaces (#with-from)', () => {
  test.beforeEach(async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    // Open an activity's detail table by double-clicking its graph node.
    await page.locator('.joint-element').first().waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('.joint-element').first().dblclick()
  })

  test('the "Allowed With/From DBs" dialog lists the allowed namespaces', async ({ page }) => {
    await page.getByRole('button', { name: 'View allowed With/From DBs' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Allowed With/From Databases')).toBeVisible()

    // The namespaces added from the YAML must appear...
    for (const ns of ['dictyBase', 'Ensembl', 'TAIR']) {
      await expect(dialog.getByText(ns, { exact: true })).toBeVisible()
    }
    // ...alongside the pre-existing ones.
    for (const ns of ['UniProtKB', 'MGI', 'CHEBI']) {
      await expect(dialog.getByText(ns, { exact: true })).toBeVisible()
    }
  })

  test('the with/from list does not include the "None" placeholder', async ({ page }) => {
    await page.getByRole('button', { name: 'View allowed With/From DBs' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('None', { exact: true })).toHaveCount(0)
  })
})
