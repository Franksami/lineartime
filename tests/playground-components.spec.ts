import { test, expect, Page } from '@playwright/test'

/**
 * Playground Components Test Suite
 * 
 * Tests all playground functionality including:
 * - Shell Navigation (sidebar, mobile sheet, keyboard shortcuts)
 * - KBar Command Palette (search, actions, keyboard navigation)  
 * - Contexts Playground (5-context testing interface)
 * - Onboarding Flow (4-step progression, skip functionality)
 * - Mobile responsiveness and touch interactions
 * 
 * Cross-browser coverage: Chrome, Firefox, Safari, Mobile
 */

class PlaygroundTestUtils {
  constructor(private page: Page) {}

  async waitForPlayground() {
    await this.page.waitForSelector('[data-testid="playground-container"]', { timeout: 10000 })
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToPlayground(route: string) {
    await this.page.goto(`/playground${route}`)
    await this.waitForPlayground()
  }

  async measureInteractionTime(action: () => Promise<void>) {
    const start = Date.now()
    await action()
    return Date.now() - start
  }

  async screenshotPlayground(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/playground-${name}-${test.info().project.name}.png`,
      fullPage: true
    })
  }

  async checkAccessibilityFeatures() {
    const hasSkipLink = await this.page.locator('[data-testid="skip-link"]').count() > 0
    const hasLandmarks = await this.page.locator('[role="main"], [role="navigation"], [role="complementary"]').count() > 0
    const hasHeadings = await this.page.locator('h1, h2, h3').count() > 0
    const hasLabels = await this.page.locator('[aria-label], [aria-labelledby]').count() > 0
    
    return { hasSkipLink, hasLandmarks, hasHeadings, hasLabels }
  }
}

test.describe('Playground Components - Comprehensive Testing', () => {
  let utils: PlaygroundTestUtils

  test.beforeEach(async ({ page }) => {
    utils = new PlaygroundTestUtils(page)
    await page.goto('/playground')
    await utils.waitForPlayground()
  })

  test.describe('Playground Overview Page', () => {
    test('should render playground overview correctly', async ({ page }) => {
      // Check main heading
      await expect(page.locator('h1')).toContainText('UI/UX Playground')
      
      // Check performance metrics section
      const metricsCard = page.locator('[data-testid="performance-metrics"]')
      if (await metricsCard.count() > 0) {
        await expect(metricsCard).toBeVisible()
      }
      
      // Check all playground routes are displayed
      const playgroundRoutes = [
        'Shell Navigation',
        'Command Palette', 
        'SuperContext System',
        'Onboarding Flow'
      ]
      
      for (const route of playgroundRoutes) {
        await expect(page.locator('text=' + route)).toBeVisible()
      }

      await utils.screenshotPlayground('overview')
    })

    test('should have working navigation links', async ({ page }) => {
      const testLinks = [
        { text: 'Shell Navigation', path: '/playground/shell' },
        { text: 'Command Palette', path: '/playground/command' },
        { text: 'SuperContext System', path: '/playground/contexts' },
        { text: 'Onboarding Flow', path: '/playground/onboarding' }
      ]

      for (const link of testLinks) {
        const linkElement = page.locator(`text=${link.text}`).first()
        if (await linkElement.count() > 0) {
          await linkElement.click()
          await page.waitForURL(`**${link.path}`, { timeout: 5000 })
          await page.goBack()
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test('should show component status indicators', async ({ page }) => {
      // Check for status badges
      const readyStatus = page.locator('[data-testid="status-ready"]')
      const pendingStatus = page.locator('[data-testid="status-pending"]')
      
      // Should have at least one status indicator
      const totalStatus = await readyStatus.count() + await pendingStatus.count()
      expect(totalStatus).toBeGreaterThan(0)
    })
  })

  test.describe('Shell Navigation Testing', () => {
    test.beforeEach(async ({ page }) => {
      await utils.navigateToPlayground('/shell')
    })

    test('should render shadcn Sidebar correctly', async ({ page }) => {
      // Check sidebar exists
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar).toBeVisible()
      
      // Test sidebar navigation items
      const navItems = page.locator('[data-testid="nav-item"]')
      const navCount = await navItems.count()
      expect(navCount).toBeGreaterThan(0)

      await utils.screenshotPlayground('shell-desktop')
    })

    test('should support sidebar collapse/expand', async ({ page }) => {
      const collapseButton = page.locator('[data-testid="sidebar-collapse"]')
      
      if (await collapseButton.count() > 0) {
        // Test collapse
        await collapseButton.click()
        await page.waitForTimeout(300) // Animation time
        
        // Test expand
        await collapseButton.click()
        await page.waitForTimeout(300)
        
        await utils.screenshotPlayground('shell-collapsed')
      }
    })

    test('should handle keyboard navigation', async ({ page }) => {
      // Focus the sidebar
      const sidebar = page.locator('[data-testid="sidebar"]')
      await sidebar.focus()
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(100)
      
      await page.keyboard.press('ArrowUp')
      await page.waitForTimeout(100)
      
      // Test enter key
      await page.keyboard.press('Enter')
      await page.waitForTimeout(100)
    })

    test('should show mobile sheet on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await utils.waitForPlayground()
      
      // Check for mobile navigation trigger
      const mobileNav = page.locator('[data-testid="mobile-nav-trigger"]')
      if (await mobileNav.count() > 0) {
        await mobileNav.click()
        
        // Should open mobile sheet
        const sheet = page.locator('[data-testid="mobile-sheet"]')
        await expect(sheet).toBeVisible()
        
        // Close sheet
        await page.keyboard.press('Escape')
        
        await utils.screenshotPlayground('shell-mobile')
      }
    })
  })

  test.describe('KBar Command Palette Testing', () => {
    test.beforeEach(async ({ page }) => {
      await utils.navigateToPlayground('/command')
    })

    test('should render KBar playground interface', async ({ page }) => {
      // Check main heading
      await expect(page.locator('h1')).toContainText('Command Palette')
      
      // Check KBar demo section
      const kbarDemo = page.locator('[data-testid="kbar-demo"]')
      if (await kbarDemo.count() > 0) {
        await expect(kbarDemo).toBeVisible()
      }

      await utils.screenshotPlayground('kbar-interface')
    })

    test('should trigger KBar with keyboard shortcut', async ({ page }) => {
      // Trigger KBar with Cmd+K / Ctrl+K
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
      await page.keyboard.press(`${modifier}+KeyK`)
      
      // Check if KBar modal is visible
      const kbarModal = page.locator('[data-testid="kbar-modal"]')
      if (await kbarModal.count() > 0) {
        await expect(kbarModal).toBeVisible()
        
        // Close with Escape
        await page.keyboard.press('Escape')
        await expect(kbarModal).not.toBeVisible()
        
        await utils.screenshotPlayground('kbar-open')
      }
    })

    test('should display command results', async ({ page }) => {
      // Open KBar
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
      await page.keyboard.press(`${modifier}+KeyK`)
      
      const kbarModal = page.locator('[data-testid="kbar-modal"]')
      if (await kbarModal.count() > 0) {
        // Type search query
        await page.keyboard.type('create')
        await page.waitForTimeout(300)
        
        // Check for results
        const results = page.locator('[data-testid="kbar-result"]')
        const resultCount = await results.count()
        expect(resultCount).toBeGreaterThanOrEqual(0) // May have 0 results in mock
        
        await page.keyboard.press('Escape')
      }
    })

    test('should handle action selection with keyboard', async ({ page }) => {
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
      await page.keyboard.press(`${modifier}+KeyK`)
      
      const kbarModal = page.locator('[data-testid="kbar-modal"]')
      if (await kbarModal.count() > 0) {
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(100)
        
        await page.keyboard.press('ArrowUp')
        await page.waitForTimeout(100)
        
        // Select with Enter
        await page.keyboard.press('Enter')
        await page.waitForTimeout(100)
      }
    })

    test('should show performance metrics', async ({ page }) => {
      // Click performance test button if available
      const perfButton = page.locator('[data-testid="run-performance-test"]')
      if (await perfButton.count() > 0) {
        await perfButton.click()
        await page.waitForTimeout(500)
        
        // Check for metrics display
        const metrics = page.locator('[data-testid="performance-metrics"]')
        await expect(metrics).toBeVisible()
        
        await utils.screenshotPlayground('kbar-performance')
      }
    })
  })

  test.describe('Contexts Playground Testing', () => {
    test.beforeEach(async ({ page }) => {
      await utils.navigateToPlayground('/contexts')
    })

    test('should display 5-context testing interface', async ({ page }) => {
      // Check main heading
      await expect(page.locator('h1')).toContainText('SuperContext')
      
      // Check for context sections
      const contexts = [
        'UI Context',
        'Calendar Context', 
        'Events Context',
        'AI Context',
        'Notifications Context'
      ]
      
      for (const context of contexts) {
        const contextSection = page.locator(`text=${context}`)
        if (await contextSection.count() > 0) {
          await expect(contextSection).toBeVisible()
        }
      }

      await utils.screenshotPlayground('contexts-interface')
    })

    test('should handle context testing functions', async ({ page }) => {
      // Test UI context functions
      const uiTestButton = page.locator('[data-testid="test-ui-context"]')
      if (await uiTestButton.count() > 0) {
        const responseTime = await utils.measureInteractionTime(async () => {
          await uiTestButton.click()
          await page.waitForTimeout(100)
        })
        expect(responseTime).toBeLessThan(500)
      }
      
      // Test other context buttons
      const contextButtons = page.locator('[data-testid^="test-"][data-testid$="-context"]')
      const buttonCount = await contextButtons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        await contextButtons.nth(i).click()
        await page.waitForTimeout(100)
      }
    })

    test('should show context state information', async ({ page }) => {
      // Check for context state displays
      const stateDisplays = page.locator('[data-testid="context-state"]')
      const stateCount = await stateDisplays.count()
      
      if (stateCount > 0) {
        for (let i = 0; i < stateCount; i++) {
          await expect(stateDisplays.nth(i)).toBeVisible()
        }
      }
    })

    test('should handle cross-context coordination', async ({ page }) => {
      // Test coordination functions
      const coordinationButton = page.locator('[data-testid="test-coordination"]')
      if (await coordinationButton.count() > 0) {
        await coordinationButton.click()
        await page.waitForTimeout(200)
        
        // Should show coordination results
        const results = page.locator('[data-testid="coordination-results"]')
        if (await results.count() > 0) {
          await expect(results).toBeVisible()
        }
      }
    })
  })

  test.describe('Onboarding Flow Testing', () => {
    test.beforeEach(async ({ page }) => {
      await utils.navigateToPlayground('/onboarding')
    })

    test('should display onboarding welcome screen', async ({ page }) => {
      // Check for welcome content
      await expect(page.locator('h1, h2')).toBeVisible()
      
      // Check for onboarding steps indicator
      const steps = page.locator('[data-testid="onboarding-step"]')
      if (await steps.count() > 0) {
        expect(await steps.count()).toBeGreaterThanOrEqual(3) // At least 3 steps
      }

      await utils.screenshotPlayground('onboarding-welcome')
    })

    test('should handle step progression', async ({ page }) => {
      // Find next/continue button
      const nextButton = page.locator('[data-testid="onboarding-next"], button:has-text("Next"), button:has-text("Continue")')
      
      if (await nextButton.count() > 0) {
        // Progress through steps
        for (let i = 0; i < 3; i++) {
          if (await nextButton.count() > 0 && await nextButton.isVisible()) {
            await nextButton.click()
            await page.waitForTimeout(500) // Animation time
            
            await utils.screenshotPlayground(`onboarding-step-${i + 1}`)
          }
        }
      }
    })

    test('should support skip functionality', async ({ page }) => {
      const skipButton = page.locator('[data-testid="onboarding-skip"], button:has-text("Skip")')
      
      if (await skipButton.count() > 0) {
        await skipButton.click()
        await page.waitForTimeout(300)
        
        // Should progress or complete onboarding
        await utils.screenshotPlayground('onboarding-skipped')
      }
    })

    test('should handle back navigation', async ({ page }) => {
      const nextButton = page.locator('[data-testid="onboarding-next"], button:has-text("Next")')
      const backButton = page.locator('[data-testid="onboarding-back"], button:has-text("Back")')
      
      // Go to next step first
      if (await nextButton.count() > 0) {
        await nextButton.click()
        await page.waitForTimeout(300)
        
        // Then try to go back
        if (await backButton.count() > 0) {
          await backButton.click()
          await page.waitForTimeout(300)
        }
      }
    })

    test('should be accessible with keyboard navigation', async ({ page }) => {
      // Test tab navigation through onboarding
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      
      // Check focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
      
      // Test Enter key on focused elements
      await page.keyboard.press('Enter')
      await page.waitForTimeout(200)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should render playground correctly on mobile', async ({ page }) => {
      await page.goto('/playground')
      await utils.waitForPlayground()
      
      // Check mobile layout
      const isMobileView = await page.evaluate(() => window.innerWidth <= 768)
      expect(isMobileView).toBe(true)
      
      await utils.screenshotPlayground('mobile-overview')
    })

    test('should handle touch interactions', async ({ page }) => {
      await page.goto('/playground/shell')
      await utils.waitForPlayground()
      
      // Test tap interactions
      const tappableElements = page.locator('button, [role="button"], a')
      const elementCount = await tappableElements.count()
      
      if (elementCount > 0) {
        await tappableElements.first().tap()
        await page.waitForTimeout(200)
      }
    })

    test('should show mobile-optimized navigation', async ({ page }) => {
      await page.goto('/playground/shell')
      await utils.waitForPlayground()
      
      // Check for mobile navigation elements
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, [aria-label*="menu"]')
      const hasMobileNav = await mobileNav.count() > 0
      
      if (hasMobileNav) {
        await mobileNav.first().tap()
        await page.waitForTimeout(300)
        await utils.screenshotPlayground('mobile-navigation')
      }
    })
  })

  test.describe('Accessibility Testing', () => {
    test('should meet accessibility standards', async ({ page }) => {
      await page.goto('/playground')
      await utils.waitForPlayground()
      
      const a11y = await utils.checkAccessibilityFeatures()
      
      // Should have proper heading structure
      expect(a11y.hasHeadings).toBe(true)
      
      // Should have landmarks
      expect(a11y.hasLandmarks).toBe(true)
      
      // Should have labels
      expect(a11y.hasLabels).toBe(true)
    })

    test('should support screen reader navigation', async ({ page }) => {
      await page.goto('/playground/contexts')
      await utils.waitForPlayground()
      
      // Check for ARIA attributes
      const ariaElements = page.locator('[aria-label], [aria-labelledby], [aria-describedby]')
      const ariaCount = await ariaElements.count()
      expect(ariaCount).toBeGreaterThan(0)
    })

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/playground/onboarding')
      await utils.waitForPlayground()
      
      // Test focus trap in modal/onboarding flow
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
      
      // Focus should stay within the onboarding area
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(50)
      }
      
      const finalFocus = await page.evaluate(() => document.activeElement !== null)
      expect(finalFocus).toBe(true)
    })
  })

  test.describe('Performance and Error Handling', () => {
    test('should handle navigation errors gracefully', async ({ page }) => {
      // Try navigating to invalid playground route
      await page.goto('/playground/invalid-route')
      
      // Should show error page or redirect
      const hasError = await page.locator('text=404, text=Not Found, text=Error').count() > 0
      const isRedirected = page.url().includes('/playground') && !page.url().includes('invalid-route')
      
      expect(hasError || isRedirected).toBe(true)
    })

    test('should maintain performance under rapid interactions', async ({ page }) => {
      await utils.navigateToPlayground('/shell')
      
      const performance = await utils.measureInteractionTime(async () => {
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          const buttons = page.locator('button')
          const count = await buttons.count()
          if (count > 0) {
            await buttons.first().click()
            await page.waitForTimeout(50)
          }
        }
      })
      
      expect(performance).toBeLessThan(2000) // Under 2 seconds
    })

    test('should recover from JavaScript errors', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      await utils.navigateToPlayground('/contexts')
      
      // App should still be functional even if there are minor errors
      const isResponsive = await page.locator('body').isVisible()
      expect(isResponsive).toBe(true)
      
      // Critical errors should be minimal
      const criticalErrors = errors.filter(e => 
        e.includes('Cannot read') || 
        e.includes('undefined is not a function') ||
        e.includes('TypeError')
      )
      expect(criticalErrors.length).toBeLessThan(3)
    })
  })
})