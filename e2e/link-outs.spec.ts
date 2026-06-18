import { test, expect } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import {
  getModelIdFromRaw,
  loadRaw,
  mockBaristaMetadata,
  mockBaristaModel,
} from './mocks/barista'

// Issue #266: external link-outs from the activity unit box were broken — gene
// products linked to /amigo/term/ instead of /amigo/gene_product/, and PMID /
// GO_REF references resolved to app-relative URLs. The activity table (right
// drawer) opens on double-clicking a graph node; JointJS renders each node as a
// `.joint-element`, so we select the first one and assert the link hrefs.

test.describe('activity unit box link-outs (#266)', () => {
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

  test('gene-product links use the /amigo/gene_product/ path, not /term/', async ({ page }) => {
    // The opened activity is enabled by a UniProtKB gene product → gene_product page.
    const gpLink = page.locator('a[href*="/amigo/gene_product/UniProtKB:"]').first()
    await expect(gpLink).toBeVisible({ timeout: 10_000 })

    // Regression guard: no gene product should link through the old /term/ path.
    await expect(page.locator('a[href*="/amigo/term/UniProtKB"]')).toHaveCount(0)
  })

  test('every reference / entity link in the drawer is an absolute http(s) URL', async ({ page }) => {
    // Wait until the table's links have rendered.
    await expect(page.locator('a[href*="/amigo/gene_product/"]').first()).toBeVisible({
      timeout: 10_000,
    })

    // No link should be a bare CURIE resolved against the app origin (the #266 bug:
    // PMID:123 / GO_REF:0000024 became relative links). Every href must be absolute.
    const hrefs = await page.locator('a[href]').evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).getAttribute('href') || '')
    )
    const curieLike = hrefs.filter(h => /^(PMID|GO_REF|UniProtKB|ECO|GO|CHEBI):/i.test(h))
    expect(curieLike).toEqual([])
  })
})
