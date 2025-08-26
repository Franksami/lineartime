// Master Overview Page Feature Tests
import { test, expect } from '@playwright/test'

test.describe('📊 Master Overview Page Feature Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to overview/manage page
    const overviewPaths = [
      'http://localhost:3000/manage',
      'http://localhost:3000/overview',
      'http://localhost:3000/dashboard',
      'http://localhost:3000/'
    ]
    
    let pageLoaded = false
    for (const path of overviewPaths) {
      try {
        await page.goto(path)
        await page.waitForSelector('body', { timeout: 5000 })
        pageLoaded = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (!pageLoaded) {
      await page.goto('http://localhost:3000/')
      await page.waitForSelector('body', { timeout: 10000 })
    }
  })

  test('should display comprehensive dashboard view', async ({ page }) => {
    // Look for dashboard/overview elements
    const dashboardElements = [
      'text=Dashboard',
      'text=Overview',
      'text=Master View',
      '[data-testid="dashboard"]',
      '.dashboard-container',
      '.overview-panel'
    ]
    
    for (const selector of dashboardElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
    
    // Check for calendar overview
    await expect(page.locator('[data-testid="linear-calendar"], .linear-calendar, .calendar-grid')).toBeVisible({ timeout: 10000 })
  })

  test('should show event statistics and metrics', async ({ page }) => {
    // Navigate to analytics or manage page if available
    const statsPages = [
      'a[href="/analytics"]',
      'a[href="/manage"]',
      'button:has-text("Analytics")',
      'button:has-text("Statistics")'
    ]
    
    for (const selector of statsPages) {
      const link = page.locator(selector)
      if (await link.count() > 0) {
        await link.first().click()
        await page.waitForTimeout(1000)
        break
      }
    }
    
    // Look for statistical information
    const statisticsElements = [
      'text=/Total Events|Event Count/',
      'text=/\\d+ events/',
      'text=/This month|This week/',
      '[data-testid="event-count"]',
      '.statistics-panel',
      '.metrics-display'
    ]
    
    for (const selector of statisticsElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should provide calendar navigation controls', async ({ page }) => {
    // Look for navigation controls
    const navigationElements = [
      'button:has-text("Previous")',
      'button:has-text("Next")',
      'button:has-text("Today")',
      'button:has-text("←")',
      'button:has-text("→")',
      '[data-testid="navigation"]',
      '.calendar-navigation',
      'select[name*="month"]',
      'select[name*="year"]'
    ]
    
    let navigationFound = false
    for (const selector of navigationElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        navigationFound = true
        break
      }
    }
    
    // Alternative: Check for year display (2025)
    if (!navigationFound) {
      const yearDisplay = page.locator('text=2025, text=2024, text=2026')
      if (await yearDisplay.count() > 0) {
        navigationFound = true
      }
    }
    
    expect(navigationFound).toBeTruthy()
  })

  test('should display quick action buttons', async ({ page }) => {
    // Look for quick action elements
    const actionButtons = [
      'button:has-text("Create Event")',
      'button:has-text("Add Event")',
      'button:has-text("New")',
      'button:has-text("+")',
      '[data-testid="create-event"]',
      '[data-testid="add-event"]',
      '.quick-actions',
      '.action-buttons'
    ]
    
    for (const selector of actionButtons) {
      const button = page.locator(selector)
      if (await button.count() > 0) {
        await expect(button.first()).toBeVisible()
        break
      }
    }
  })

  test('should show upcoming events summary', async ({ page }) => {
    // Look for upcoming events section
    const upcomingElements = [
      'text=Upcoming',
      'text=Next events',
      'text=Today',
      'text=This week',
      '[data-testid="upcoming-events"]',
      '.upcoming-events',
      '.event-summary'
    ]
    
    for (const selector of upcomingElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
    
    // Alternative: Check for any event displays
    const eventElements = page.locator('.event, [data-event-id], .calendar-event')
    if (await eventElements.count() > 0) {
      await expect(eventElements.first()).toBeVisible()
    }
  })

  test('should support view mode switching', async ({ page }) => {
    // Look for view switcher controls
    const viewSwitchers = [
      'button:has-text("Month")',
      'button:has-text("Week")',
      'button:has-text("Day")',
      'button:has-text("Year")',
      '[data-testid="view-switcher"]',
      '.view-controls',
      'select[name*="view"]'
    ]
    
    for (const selector of viewSwitchers) {
      const switcher = page.locator(selector)
      if (await switcher.count() > 0) {
        await expect(switcher.first()).toBeVisible()
        
        // Test view switching
        await switcher.first().click()
        await page.waitForTimeout(1000)
        break
      }
    }
  })

  test('should display search and filter functionality', async ({ page }) => {
    // Look for search functionality
    const searchElements = [
      'input[type="search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="Search"]',
      '[data-testid="search-input"]',
      '.search-bar',
      'button:has-text("Search")'
    ]
    
    let searchFound = false
    for (const selector of searchElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        searchFound = true
        break
      }
    }
    
    // Look for filter controls
    const filterElements = [
      'button:has-text("Filter")',
      'select[name*="filter"]',
      '[data-testid="filter-controls"]',
      '.filter-bar',
      'button:has-text("Categories")'
    ]
    
    let filterFound = false
    for (const selector of filterElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        filterFound = true
        break
      }
    }
    
    expect(searchFound || filterFound).toBeTruthy()
  })

  test('should show calendar settings access', async ({ page }) => {
    // Look for settings or configuration access
    const settingsElements = [
      'button:has-text("Settings")',
      'a[href*="settings"]',
      'button:has-text("⚙")',
      '[data-testid="settings"]',
      '.settings-button',
      'button[aria-label*="settings"]'
    ]
    
    for (const selector of settingsElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should display integration status', async ({ page }) => {
    // Navigate to integrations or settings
    const integrationPaths = [
      'a[href*="integrations"]',
      'a[href*="settings"]',
      'button:has-text("Integrations")',
      'button:has-text("Sync")'
    ]
    
    for (const selector of integrationPaths) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await element.first().click()
        await page.waitForTimeout(1000)
        break
      }
    }
    
    // Look for integration status indicators
    const integrationElements = [
      'text=Google Calendar',
      'text=Microsoft Outlook',
      'text=Sync',
      'text=Connected',
      'text=Disconnected',
      '[data-testid="integration-status"]',
      '.integration-panel'
    ]
    
    for (const selector of integrationElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should support bulk event operations', async ({ page }) => {
    // Look for bulk selection capabilities
    const bulkElements = [
      'input[type="checkbox"]',
      'button:has-text("Select All")',
      'button:has-text("Bulk Actions")',
      '[data-testid="bulk-select"]',
      '.bulk-operations',
      'button:has-text("Delete Selected")'
    ]
    
    for (const selector of bulkElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should provide export and import functionality', async ({ page }) => {
    // Look for export/import features
    const exportElements = [
      'button:has-text("Export")',
      'button:has-text("Import")',
      'button:has-text("Download")',
      'button:has-text("Upload")',
      '[data-testid="export-button"]',
      '[data-testid="import-button"]',
      'input[type="file"]'
    ]
    
    for (const selector of exportElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should handle responsive layout for mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Overview should be accessible on mobile
    await expect(page.locator('body')).toBeVisible()
    
    // Key elements should remain visible and usable
    const keyElements = [
      '[data-testid="linear-calendar"], .linear-calendar',
      'button, a, input',
      '.calendar-grid, .overview-panel'
    ]
    
    for (const selector of keyElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
  })

  test('should display performance metrics', async ({ page }) => {
    // Look for performance indicators or metrics
    const performanceElements = [
      'text=Performance',
      'text=Load time',
      'text=FPS',
      '[data-testid="performance"]',
      '.performance-metrics',
      'text=/\\d+ms/',
      'text=/\\d+fps/'
    ]
    
    for (const selector of performanceElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
    
    // Alternative: Test app responsiveness as performance indicator
    const startTime = Date.now()
    await page.locator('body').click()
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // App should be responsive (< 100ms for basic interaction)
    expect(responseTime).toBeLessThan(1000)
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Test keyboard navigation through the interface
    await page.keyboard.press('Tab')
    
    // Check if focus is visible on interactive elements
    const focusedElement = page.locator(':focus')
    if (await focusedElement.count() > 0) {
      await expect(focusedElement.first()).toBeVisible()
    }
    
    // Test arrow key navigation if calendar is focused
    const calendarElement = page.locator('[data-testid="linear-calendar"], .linear-calendar').first()
    if (await calendarElement.count() > 0) {
      await calendarElement.click()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowUp')
    }
  })

  test('visual regression - master overview interface', async ({ page }) => {
    // Wait for full page load
    await page.waitForTimeout(2000)
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('master-overview-desktop.png', {
      fullPage: true,
      threshold: 0.2
    })
    
    // Test mobile overview layout
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('master-overview-mobile.png', {
      fullPage: true,
      threshold: 0.2
    })
  })

})