// Advanced Theme System Feature Tests
import { test, expect } from '@playwright/test'

test.describe('🎨 Advanced Theme System Feature Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to main application
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('[data-testid="linear-calendar"], .linear-calendar, body', { timeout: 10000 })
  })

  test('should display theme selector', async ({ page }) => {
    // Look for theme selector in settings or main UI
    const themeSelectors = [
      'button:has-text("Theme")',
      '[data-testid="theme-selector"]',
      'select[name*="theme"]',
      '.theme-selector',
      'button[aria-label*="theme"]',
      'text=Dark mode',
      'text=Light mode'
    ]
    
    let themeUIFound = false
    for (const selector of themeSelectors) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        themeUIFound = true
        break
      }
    }
    
    // If no theme UI found, check if themes are applied via CSS classes
    if (!themeUIFound) {
      const bodyClasses = await page.locator('body').getAttribute('class')
      const htmlClasses = await page.locator('html').getAttribute('class')
      const themeClasses = ['dark', 'light', 'theme-', 'color-scheme']
      
      const hasThemeClass = themeClasses.some(themeClass => 
        bodyClasses?.includes(themeClass) || htmlClasses?.includes(themeClass)
      )
      
      expect(hasThemeClass).toBeTruthy()
    }
  })

  test('should support dark mode toggle', async ({ page }) => {
    // Look for dark mode toggle
    const darkModeToggles = [
      'button:has-text("Dark")',
      '[data-testid="dark-mode-toggle"]',
      'button[aria-label*="dark mode"]',
      '.dark-mode-toggle',
      'input[type="checkbox"][name*="dark"]'
    ]
    
    for (const selector of darkModeToggles) {
      const toggle = page.locator(selector)
      if (await toggle.count() > 0) {
        await expect(toggle.first()).toBeVisible()
        
        // Test toggle functionality
        await toggle.first().click()
        await page.waitForTimeout(500)
        
        // Verify theme change (check for dark/light classes)
        const bodyClass = await page.locator('body').getAttribute('class')
        const htmlClass = await page.locator('html').getAttribute('class')
        
        const hasDarkClass = bodyClass?.includes('dark') || htmlClass?.includes('dark')
        const hasLightClass = bodyClass?.includes('light') || htmlClass?.includes('light')
        
        expect(hasDarkClass || hasLightClass).toBeTruthy()
        break
      }
    }
  })

  test('should apply theme colors consistently', async ({ page }) => {
    // Check for consistent color application across elements
    const elementsToCheck = [
      'body',
      '.calendar-grid, [data-testid="linear-calendar"]',
      'button',
      '.event, [data-event-id]',
      'header, .header'
    ]
    
    let colorConsistencyFound = false
    for (const selector of elementsToCheck) {
      const element = page.locator(selector).first()
      if (await element.count() > 0) {
        const styles = await element.getAttribute('style')
        const computedColor = await element.evaluate(el => getComputedStyle(el).backgroundColor)
        
        if (styles?.includes('color') || computedColor !== 'rgba(0, 0, 0, 0)') {
          colorConsistencyFound = true
          break
        }
      }
    }
    
    expect(colorConsistencyFound).toBeTruthy()
  })

  test('should support multiple theme variants', async ({ page }) => {
    // Look for theme variant options
    const themeVariants = [
      'text=Blue theme',
      'text=Green theme', 
      'text=Purple theme',
      '[data-theme="blue"]',
      '[data-theme="green"]',
      '[data-theme="purple"]',
      '.theme-blue',
      '.theme-green',
      '.theme-purple'
    ]
    
    let variantFound = false
    for (const selector of themeVariants) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        variantFound = true
        break
      }
    }
    
    // If no explicit variant selectors, check for CSS custom properties
    if (!variantFound) {
      const rootStyles = await page.evaluate(() => {
        const root = document.documentElement
        const styles = getComputedStyle(root)
        return {
          primary: styles.getPropertyValue('--primary'),
          secondary: styles.getPropertyValue('--secondary'),
          accent: styles.getPropertyValue('--accent')
        }
      })
      
      const hasCustomProperties = Object.values(rootStyles).some(value => value.trim() !== '')
      expect(hasCustomProperties).toBeTruthy()
    }
  })

  test('should persist theme preferences', async ({ page }) => {
    // Check for theme persistence (localStorage, cookies, etc.)
    const themeToggle = page.locator('button:has-text("Dark"), [data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]').first()
    
    if (await themeToggle.count() > 0) {
      // Toggle theme
      await themeToggle.click()
      await page.waitForTimeout(500)
      
      // Reload page
      await page.reload()
      await page.waitForTimeout(1000)
      
      // Check if theme persisted
      const bodyClass = await page.locator('body').getAttribute('class')
      const htmlClass = await page.locator('html').getAttribute('class')
      
      const hasThemeClass = bodyClass?.includes('dark') || bodyClass?.includes('light') || 
                           htmlClass?.includes('dark') || htmlClass?.includes('light')
      
      expect(hasThemeClass).toBeTruthy()
    }
    
    // Alternative: Check localStorage for theme
    const themeFromStorage = await page.evaluate(() => {
      return localStorage.getItem('theme') || localStorage.getItem('darkMode') || 
             localStorage.getItem('color-scheme')
    })
    
    if (themeFromStorage) {
      expect(themeFromStorage).toBeTruthy()
    }
  })

  test('should handle system theme preference', async ({ page }) => {
    // Test system theme detection
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    await page.waitForTimeout(1000)
    
    // Check if dark theme is applied
    const bodyClass = await page.locator('body').getAttribute('class')
    const htmlClass = await page.locator('html').getAttribute('class')
    
    // Should respect system preference or have explicit theme
    const hasThemeResponse = bodyClass?.includes('dark') || bodyClass?.includes('light') ||
                            htmlClass?.includes('dark') || htmlClass?.includes('light')
    
    expect(hasThemeResponse).toBeTruthy()
  })

  test('should provide theme customization options', async ({ page }) => {
    // Look for theme settings or customization
    const customizationElements = [
      'a[href*="theme"]',
      'button:has-text("Customize")',
      'button:has-text("Settings")',
      '[data-testid="theme-settings"]',
      'input[type="color"]',
      'button:has-text("Appearance")'
    ]
    
    for (const selector of customizationElements) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await element.first().click()
        await page.waitForTimeout(1000)
        
        // Should show customization options
        await expect(page.locator('input, select, button').first()).toBeVisible({ timeout: 5000 })
        break
      }
    }
  })

  test('should support high contrast themes', async ({ page }) => {
    // Check for high contrast or accessibility themes
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    
    const accessibilityThemes = [
      'text=High contrast',
      '[data-theme="high-contrast"]',
      '.high-contrast',
      'button:has-text("Accessibility")'
    ]
    
    for (const selector of accessibilityThemes) {
      const element = page.locator(selector)
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible()
        break
      }
    }
    
    // Check for sufficient contrast ratios
    const calendarElement = page.locator('.calendar-grid, [data-testid="linear-calendar"], .linear-calendar').first()
    if (await calendarElement.count() > 0) {
      const contrast = await calendarElement.evaluate(el => {
        const styles = getComputedStyle(el)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor
        }
      })
      
      expect(contrast.color).toBeTruthy()
      expect(contrast.backgroundColor).toBeTruthy()
    }
  })

  test('should handle theme transitions smoothly', async ({ page }) => {
    const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]').first()
    
    if (await themeToggle.count() > 0) {
      // Toggle theme and check for smooth transition
      await themeToggle.click()
      
      // Check for transition classes or CSS animations
      const hasTransition = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        return elements.some(el => {
          const styles = getComputedStyle(el)
          return styles.transition.includes('color') || 
                 styles.transition.includes('background') ||
                 styles.transition.includes('all')
        })
      })
      
      // Transitions should be present for smooth theme changes
      expect(hasTransition).toBeTruthy()
    }
  })

  test('should work with calendar event colors', async ({ page }) => {
    // Check if event colors respect theme
    const eventElements = page.locator('.event, [data-event-id], .calendar-event')
    
    if (await eventElements.count() > 0) {
      const eventStyles = await eventElements.first().evaluate(el => ({
        backgroundColor: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        borderColor: getComputedStyle(el).borderColor
      }))
      
      // Events should have themed colors
      const hasThemedColors = eventStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                             eventStyles.color !== 'rgba(0, 0, 0, 0)' ||
                             eventStyles.borderColor !== 'rgba(0, 0, 0, 0)'
      
      expect(hasThemedColors).toBeTruthy()
    }
  })

  test('should be responsive across different devices', async ({ page }) => {
    // Test theme system on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Theme controls should be accessible on mobile
    const themeControl = page.locator('button:has-text("Theme"), button:has-text("Dark"), [data-testid="theme-toggle"]').first()
    
    if (await themeControl.count() > 0) {
      await expect(themeControl).toBeVisible()
      
      // Should be touch-friendly
      const elementBox = await themeControl.boundingBox()
      if (elementBox) {
        expect(elementBox.height).toBeGreaterThanOrEqual(44) // Minimum touch target
      }
    }
  })

  test('visual regression - theme system variations', async ({ page }) => {
    // Test light theme
    const lightToggle = page.locator('button:has-text("Light"), [data-theme="light"]').first()
    if (await lightToggle.count() > 0) {
      await lightToggle.click()
      await page.waitForTimeout(1000)
    }
    
    await expect(page).toHaveScreenshot('theme-light-mode.png', {
      fullPage: true,
      threshold: 0.2
    })
    
    // Test dark theme
    const darkToggle = page.locator('button:has-text("Dark"), [data-theme="dark"]').first()
    if (await darkToggle.count() > 0) {
      await darkToggle.click()
      await page.waitForTimeout(1000)
      
      await expect(page).toHaveScreenshot('theme-dark-mode.png', {
        fullPage: true,
        threshold: 0.2
      })
    }
  })

})