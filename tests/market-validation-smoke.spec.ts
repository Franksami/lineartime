import { test, expect } from '@playwright/test'

test.describe('Market Validation Dashboard smoke', () => {
	test('loads and renders key sections', async ({ page }) => {
		await page.goto('/market-validation')

		await expect(page.getByRole('heading', { name: 'Market Validation Dashboard' })).toBeVisible()
		await expect(page.getByRole('tab', { name: /Timeline(\s|)Analytics/i })).toBeVisible()
		await expect(page.getByRole('tab', { name: /A\/B(\s|)Testing/i })).toBeVisible()

		await expect(page.getByRole('img', { name: /adoption trends/i })).toBeVisible()
		await expect(page.getByText(/HORIZONTAL TIMELINE ADOPTION TRENDS/i)).toBeVisible()

		await expect(page.getByText(/Strategic Validation Summary/i)).toBeVisible()
		await expect(page.getByText(/VALIDATION OUTCOME: Proceed with Horizontal Timeline/i)).toBeVisible()
	})
})


