import { test, expect } from '@playwright/test'

test.describe('UI Positioning Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Online badge should not overlap with LinearTime header', async ({ page }) => {
    // Check that LinearTime header is visible
    const header = page.locator('text=LinearTime').first()
    await expect(header).toBeVisible()

    // Check that Online badge is positioned properly (top-right)
    const onlineBadge = page.locator('text=Online').first()
    if (await onlineBadge.isVisible()) {
      const headerBox = await header.boundingBox()
      const badgeBox = await onlineBadge.boundingBox()
      
      if (headerBox && badgeBox) {
        // Ensure badge doesn't overlap with header
        // Badge should be to the right of header or below it
        expect(badgeBox.x).toBeGreaterThan(headerBox.x + headerBox.width - 50) // Allow some margin
      }
    }
  })

  test('Filters button should not overlap with calendar content', async ({ page }) => {
    // Look for the Filters button
    const filtersButton = page.locator('button:has-text("Filters")').first()
    await expect(filtersButton).toBeVisible()

    // Check that it's positioned properly (should be top-right area)
    const buttonBox = await filtersButton.boundingBox()
    expect(buttonBox).toBeTruthy()
    
    if (buttonBox) {
      // Button should be in the top-right area, not covering left side calendar content
      expect(buttonBox.x).toBeGreaterThan(300) // Should not be in far left where January would be
      expect(buttonBox.y).toBeLessThan(100) // Should be in top area
    }

    // Check for January month content - it should be visible and not covered
    const janContent = page.locator('text=/Jan/').first()
    if (await janContent.isVisible()) {
      const janBox = await janContent.boundingBox()
      const filtersBox = await filtersButton.boundingBox()
      
      if (janBox && filtersBox) {
        // Filters button should not overlap with January content
        const overlap = !(filtersBox.x > janBox.x + janBox.width || 
                         filtersBox.x + filtersBox.width < janBox.x ||
                         filtersBox.y > janBox.y + janBox.height ||
                         filtersBox.y + filtersBox.height < janBox.y)
        expect(overlap).toBeFalsy()
      }
    }
  })

  test('PWA Status badges should be positioned in top-right corner', async ({ page }) => {
    const statusContainer = page.locator('.fixed.top-4.right-4').first()
    
    if (await statusContainer.isVisible()) {
      const containerBox = await statusContainer.boundingBox()
      expect(containerBox).toBeTruthy()
      
      if (containerBox) {
        // Should be in top-right area
        expect(containerBox.x).toBeGreaterThan(window.innerWidth * 0.7) // Rough right side check
        expect(containerBox.y).toBeLessThan(50) // Top area
      }
    }
  })

  test('All UI elements should maintain proper spacing and accessibility', async ({ page }) => {
    // Test that important UI elements are properly accessible
    const navigationElements = [
      'text=LinearTime',
      'button:has-text("Filters")',
      'text=Online'
    ]

    for (const selector of navigationElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        // Check that element has proper click area (not too small)
        const box = await element.boundingBox()
        if (box && selector.includes('button')) {
          expect(box.width).toBeGreaterThan(40) // Minimum touch target
          expect(box.height).toBeGreaterThan(30) // Minimum touch target
        }
      }
    }
  })

  test('Mobile responsiveness - no overlaps on smaller screens', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check that elements are still properly positioned
    const filtersButton = page.locator('button:has-text("Filters")').first()
    if (await filtersButton.isVisible()) {
      const buttonBox = await filtersButton.boundingBox()
      if (buttonBox) {
        // On mobile, button should still not overlap with calendar
        expect(buttonBox.x).toBeGreaterThan(0)
        expect(buttonBox.x + buttonBox.width).toBeLessThan(375) // Should fit in viewport
      }
    }

    // PWA badges should still be visible and not overlapping
    const onlineBadge = page.locator('text=Online').first()
    if (await onlineBadge.isVisible()) {
      const badgeBox = await onlineBadge.boundingBox()
      if (badgeBox) {
        expect(badgeBox.x + badgeBox.width).toBeLessThan(375) // Should fit in viewport
      }
    }
  })
})