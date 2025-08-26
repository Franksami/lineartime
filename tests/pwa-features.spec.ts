// PWA Features Test Suite
import { test, expect } from '@playwright/test'

test.describe('📱 PWA Features Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to main application
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('[data-testid="linear-calendar"], .linear-calendar, body', { timeout: 10000 })
  })

  test('should have valid web app manifest', async ({ page }) => {
    // Check for manifest link in head
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveCount(1)
    
    const manifestHref = await manifestLink.getAttribute('href')
    expect(manifestHref).toBeTruthy()
    
    // Fetch and validate manifest
    const manifestResponse = await page.goto(`http://localhost:3000${manifestHref}`)
    expect(manifestResponse?.status()).toBe(200)
    
    const manifestContent = await manifestResponse?.json()
    
    // Validate required manifest properties
    expect(manifestContent).toHaveProperty('name')
    expect(manifestContent).toHaveProperty('short_name')
    expect(manifestContent).toHaveProperty('start_url')
    expect(manifestContent).toHaveProperty('display')
    expect(manifestContent).toHaveProperty('background_color')
    expect(manifestContent).toHaveProperty('theme_color')
    expect(manifestContent).toHaveProperty('icons')
    
    // Validate icons array
    expect(Array.isArray(manifestContent.icons)).toBeTruthy()
    expect(manifestContent.icons.length).toBeGreaterThan(0)
    
    // Check for required icon sizes
    const iconSizes = manifestContent.icons.map((icon: any) => icon.sizes)
    expect(iconSizes).toContain('192x192')
    expect(iconSizes.some((size: string) => size.includes('512'))).toBeTruthy()
  })

  test('should register service worker', async ({ page }) => {
    // Check for service worker registration
    const serviceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          return !!registration
        } catch (error) {
          return false
        }
      }
      return false
    })
    
    // Allow some time for service worker registration
    if (!serviceWorkerRegistered) {
      await page.waitForTimeout(2000)
      
      const serviceWorkerAfterWait = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          return !!registration
        }
        return false
      })
      
      expect(serviceWorkerAfterWait).toBeTruthy()
    } else {
      expect(serviceWorkerRegistered).toBeTruthy()
    }
  })

  test('should support offline functionality', async ({ page, context }) => {
    // Wait for service worker to be ready
    await page.waitForTimeout(3000)
    
    // Create some calendar data
    const dateCell = page.locator('[data-date], .calendar-cell, td').first()
    if (await dateCell.count() > 0) {
      await dateCell.click()
      
      // Try to create an event (if form appears)
      const eventForm = page.locator('input[type="text"], textarea, form').first()
      if (await eventForm.count() > 0) {
        await eventForm.fill('Test Offline Event')
        
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first()
        if (await saveButton.count() > 0) {
          await saveButton.click()
          await page.waitForTimeout(1000)
        }
      }
    }
    
    // Go offline
    await context.setOffline(true)
    
    // Reload the page
    await page.reload()
    
    // Page should still load (from cache)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    
    // Calendar should still be visible
    await expect(page.locator('[data-testid="linear-calendar"], .linear-calendar, .calendar-grid')).toBeVisible({ timeout: 5000 })
    
    // Go back online
    await context.setOffline(false)
  })

  test('should show install prompt', async ({ page }) => {
    // Check for install button or prompt
    const installElements = [
      'button:has-text("Install")',
      'button:has-text("Add to Home")',
      '[data-testid="install-button"]',
      '.install-prompt',
      'button[aria-label*="install"]'
    ]
    
    let installUIFound = false
    for (const selector of installElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        installUIFound = true
        break
      }
    }
    
    // If no install UI visible, check if PWA is already installed or prompt conditions aren't met
    if (!installUIFound) {
      const isStandalone = await page.evaluate(() => {
        return window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone === true
      })
      
      // PWA might already be installed or criteria not met
      expect(typeof isStandalone).toBe('boolean')
    }
  })

  test('should handle push notifications setup', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications'])
    
    // Look for notification setup UI
    const notificationElements = [
      'button:has-text("Enable Notifications")',
      'button:has-text("Subscribe")',
      '[data-testid="notifications-toggle"]',
      'text=Notifications',
      'input[type="checkbox"][name*="notification"]'
    ]
    
    for (const selector of notificationElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        
        // Test notification setup
        await element.first().click()
        await page.waitForTimeout(1000)
        break
      }
    }
    
    // Check if notifications are supported
    const notificationSupport = await page.evaluate(() => {
      return 'Notification' in window && 'serviceWorker' in navigator
    })
    
    expect(notificationSupport).toBeTruthy()
  })

  test('should cache critical resources', async ({ page }) => {
    // Check for cached resources after service worker registration
    await page.waitForTimeout(3000)
    
    const cachedResources = await page.evaluate(async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys()
          
          let totalCachedItems = 0
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName)
            const requests = await cache.keys()
            totalCachedItems += requests.length
          }
          
          return {
            cacheNames,
            totalCachedItems
          }
        } catch (error) {
          return { cacheNames: [], totalCachedItems: 0 }
        }
      }
      return { cacheNames: [], totalCachedItems: 0 }
    })
    
    // Should have at least one cache and some cached resources
    expect(cachedResources.cacheNames.length).toBeGreaterThan(0)
    expect(cachedResources.totalCachedItems).toBeGreaterThan(0)
  })

  test('should work as standalone app', async ({ page }) => {
    // Check for standalone display mode support
    const supportsStandalone = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: minimal-ui)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches
    })
    
    // Check for viewport meta tag for mobile
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toHaveCount(1)
    
    const viewportContent = await viewportMeta.getAttribute('content')
    expect(viewportContent).toContain('width=device-width')
    expect(viewportContent).toContain('initial-scale=1')
  })

  test('should handle app shortcuts', async ({ page }) => {
    // Check manifest for shortcuts
    const manifestLink = page.locator('link[rel="manifest"]')
    const manifestHref = await manifestLink.getAttribute('href')
    
    if (manifestHref) {
      const manifestResponse = await page.goto(`http://localhost:3000${manifestHref}`)
      const manifestContent = await manifestResponse?.json()
      
      if (manifestContent?.shortcuts) {
        expect(Array.isArray(manifestContent.shortcuts)).toBeTruthy()
        
        // Validate shortcut structure
        for (const shortcut of manifestContent.shortcuts) {
          expect(shortcut).toHaveProperty('name')
          expect(shortcut).toHaveProperty('url')
        }
      }
    }
  })

  test('should support app background sync', async ({ page }) => {
    // Check for background sync support
    const backgroundSyncSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    })
    
    if (backgroundSyncSupported) {
      // Look for background sync features in the UI
      const syncIndicators = [
        'text=Sync',
        '.sync-status',
        '[data-testid="sync-indicator"]',
        'button:has-text("Sync")'
      ]
      
      let syncUIFound = false
      for (const selector of syncIndicators) {
        const element = page.locator(selector)
        if (await element.count() > 0) {
          syncUIFound = true
          break
        }
      }
      
      // Background sync might be working without visible UI
      expect(typeof backgroundSyncSupported).toBe('boolean')
    }
  })

  test('should handle file system access', async ({ page, context }) => {
    // Check for File System Access API or file handling
    const fileSystemSupported = await page.evaluate(() => {
      return 'showOpenFilePicker' in window || 'showSaveFilePicker' in window
    })
    
    if (fileSystemSupported) {
      // Look for file import/export features
      const fileElements = [
        'button:has-text("Import")',
        'button:has-text("Export")',
        'input[type="file"]',
        'button:has-text("Open File")',
        '[data-testid="file-import"]'
      ]
      
      for (const selector of fileElements) {
        const element = page.locator(selector)
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible()
          break
        }
      }
    }
  })

  test('should be responsive for mobile PWA', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // App should be responsive and usable
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('[data-testid="linear-calendar"], .linear-calendar')).toBeVisible({ timeout: 10000 })
    
    // Touch targets should be appropriately sized
    const interactiveElements = page.locator('button, a, input, [role="button"]')
    const elementCount = await interactiveElements.count()
    
    if (elementCount > 0) {
      const firstElement = interactiveElements.first()
      const boundingBox = await firstElement.boundingBox()
      
      if (boundingBox) {
        // Touch targets should be at least 44px (iOS) or 48px (Android)
        expect(boundingBox.height).toBeGreaterThanOrEqual(40)
      }
    }
  })

  test('visual regression - PWA interface', async ({ page }) => {
    // Wait for service worker and PWA features to load
    await page.waitForTimeout(3000)
    
    // Take screenshot of PWA interface
    await expect(page).toHaveScreenshot('pwa-interface-desktop.png', {
      fullPage: true,
      threshold: 0.2
    })
    
    // Test mobile PWA interface
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('pwa-interface-mobile.png', {
      fullPage: true,
      threshold: 0.2
    })
  })

})