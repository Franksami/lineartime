import { test, expect } from '@playwright/test'

test.describe('Debug Dashboard Access', () => {
  test('should access dashboard and see content', async ({ page }) => {
    console.log('Navigating to /dashboard...')
    
    // Navigate with error handling
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    
    // Log the current URL
    const currentURL = page.url()
    console.log('Current URL:', currentURL)
    
    // Check for any console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait a bit more
    await page.waitForTimeout(2000)
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true })
    
    // Log what we find on the page
    const pageTitle = await page.title()
    console.log('Page title:', pageTitle)
    
    const bodyText = await page.textContent('body')
    console.log('Page contains text about:', bodyText?.substring(0, 200))
    
    // Look for any error messages
    const errorElements = await page.locator('.error, [role="alert"], .alert-destructive').count()
    console.log('Error elements found:', errorElements)
    
    // Check if we're on the landing page
    const isLandingPage = await page.locator('text=Linear Calendar').count() > 0
    console.log('Is on page with "Linear Calendar":', isLandingPage)
    
    // Check for calendar grid
    const hasCalendarGrid = await page.locator('[role="grid"]').count() > 0
    console.log('Has calendar grid:', hasCalendarGrid)
    
    // Check for sidebar navigation
    const hasSidebar = await page.locator('nav, .sidebar').count() > 0
    console.log('Has sidebar navigation:', hasSidebar)
    
    // Log any console errors
    if (errors.length > 0) {
      console.log('Console errors:', errors)
    }
    
    // Let's just verify we can access the dashboard
    expect(currentURL).toContain('/dashboard')
  })
})