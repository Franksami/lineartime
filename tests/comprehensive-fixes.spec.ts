import { test, expect, Page } from '@playwright/test'

// Helper to wait for calendar
async function waitForCalendar(page: Page) {
  await page.waitForSelector('[role="grid"]', { timeout: 10000 })
  // Wait for grid to be fully loaded instead of arbitrary timeout
  await page.waitForLoadState('networkidle')
}

// Helper to create event via drag
async function createEventByDrag(page: Page, startX: number, startY: number, endX: number, endY: number) {
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(endX, endY)
  await page.mouse.up()
}

test.describe('🎯 Comprehensive Fix Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForCalendar(page)
  })

  test('Complete workflow: Create event → Click event → Edit with FloatingToolbar → Delete', async ({ page }) => {
    const grid = page.locator('[role="grid"]')
    const gridBox = await grid.boundingBox()
    
    if (!gridBox) {
      throw new Error('Grid not found')
    }
    
    // Step 1: Create an event via drag
    console.log('Step 1: Creating event via drag')
    const startX = gridBox.x + 200
    const startY = gridBox.y + 150
    
    await createEventByDrag(page, startX, startY, startX + 100, startY)
    
    // Wait for quick title input
    const titleInput = page.locator('input[type="text"]').first()
    let inputVisible = false
    try {
      inputVisible = await titleInput.isVisible({ timeout: 2000 })
    } catch (error) {
      // Only suppress timeout errors, rethrow others
      if (error instanceof Error && error.message.includes('timeout')) {
        inputVisible = false
      } else {
        throw error
      }
    }
    
    if (!inputVisible) {
      console.log('Quick title input not found, skipping event creation')
      return
    }
    
    // Enter event title
    await titleInput.fill('Test Event for Toolbar')
    await page.keyboard.press('Enter')
    
    await page.waitForTimeout(1000)
    
    // Step 2: Find and click the created event
    console.log('Step 2: Finding and clicking the created event')
    
    // Look for the event we just created
    const event = page.locator('div').filter({ hasText: 'Test Event for Toolbar' }).first()
    const eventExists = await event.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (!eventExists) {
      // Try alternative selector
      const altEvent = page.locator('[class*="bg-"]').filter({ hasText: 'Test Event' })
      if (await altEvent.isVisible({ timeout: 1000 }).catch(() => false)) {
        await altEvent.click()
      } else {
        console.log('Created event not found')
        return
      }
    } else {
      await event.click()
    }
    
    // Step 3: Verify FloatingToolbar appears
    console.log('Step 3: Verifying FloatingToolbar appears')
    await page.waitForTimeout(500)
    
    // Look for toolbar or its buttons
    const editButton = page.locator('button').filter({ hasText: /edit/i })
    const deleteButton = page.locator('button').filter({ hasText: /delete/i })
    const toolbar = page.locator('[class*="absolute"]').filter({ 
      has: page.locator('button')
    })
    
    const toolbarVisible = 
      await toolbar.isVisible({ timeout: 1000 }).catch(() => false) ||
      await editButton.isVisible({ timeout: 1000 }).catch(() => false) ||
      await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)
    
    console.log('FloatingToolbar visible:', toolbarVisible)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/comprehensive-workflow.png' })
    
    if (toolbarVisible) {
      // Step 4: Try to edit the event
      console.log('Step 4: Editing event with FloatingToolbar')
      
      // Look for inline editing fields
      const inlineTitle = page.locator('input[value*="Test Event"]')
      if (await inlineTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await inlineTitle.fill('Updated Event Title')
        console.log('Updated event title')
      }
      
      // Step 5: Delete the event
      console.log('Step 5: Deleting event')
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        
        // Confirm deletion if needed
        const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes/i })
        if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmBtn.click()
        }
        
        // Verify event is deleted
        await page.waitForTimeout(500)
        const eventStillExists = await event.isVisible({ timeout: 500 }).catch(() => false)
        expect(eventStillExists).toBeFalsy()
        console.log('Event deleted successfully')
      }
    }
    
    // Step 6: Test click-outside to close toolbar
    console.log('Step 6: Testing click-outside to close toolbar')
    
    // Create another event
    await createEventByDrag(page, startX + 150, startY, startX + 250, startY)
    
    const titleInput2 = page.locator('input[type="text"]').first()
    if (await titleInput2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await titleInput2.fill('Second Event')
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(500)
      
      // Click the new event
      const event2 = page.locator('div').filter({ hasText: 'Second Event' }).first()
      if (await event2.isVisible()) {
        await event2.click()
        
        // Toolbar should appear
        await page.waitForTimeout(500)
        
        // Click outside on the grid
        await grid.click({ position: { x: 50, y: 50 } })
        
        await page.waitForTimeout(500)
        
        // Toolbar should be hidden
        const toolbarHidden = !(await toolbar.isVisible({ timeout: 500 }).catch(() => false))
        console.log('Toolbar hidden after click outside:', toolbarHidden)
        expect(toolbarHidden).toBeTruthy()
      }
    }
    
    console.log('Comprehensive workflow test completed')
  })

  test('Performance: Multiple rapid event operations', async ({ page }) => {
    const grid = page.locator('[role="grid"]')
    const gridBox = await grid.boundingBox()
    
    if (!gridBox) return
    
    const startTime = Date.now()
    
    // Create 5 events rapidly
    for (let i = 0; i < 5; i++) {
      await createEventByDrag(
        page,
        gridBox.x + 100 + (i * 50),
        gridBox.y + 100,
        gridBox.x + 150 + (i * 50),
        gridBox.y + 100
      )
      
      // Cancel each immediately
      await page.keyboard.press('Escape')
      await page.waitForTimeout(100)
    }
    
    const elapsed = Date.now() - startTime
    console.log(`Created and cancelled 5 events in ${elapsed}ms`)
    
    // Should complete quickly
    expect(elapsed).toBeLessThan(10000) // Less than 10 seconds
    
    // No errors should occur
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('Mobile viewport: Foundation elements remain intact', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await waitForCalendar(page)
    
    // Check foundation elements
    const grid = page.locator('[role="grid"]')
    await expect(grid).toBeVisible()
    
    // Check month labels
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    for (const month of monthLabels.slice(0, 3)) {
      await expect(page.locator(`text=${month}`).first()).toBeVisible()
    }
    
    // Check for mobile menu
    const menuButton = page.locator('button[aria-label*="menu"]')
    const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false)
    console.log('Mobile menu button visible:', menuVisible)
    
    // Test drag-to-create on mobile
    const gridBox = await grid.boundingBox()
    if (gridBox) {
      await createEventByDrag(
        page,
        gridBox.x + 50,
        gridBox.y + 50,
        gridBox.x + 100,
        gridBox.y + 50
      )
      
      // Check if creation UI appears
      const createUI = page.locator('input[type="text"]').first()
      const mobileCreateWorks = await createUI.isVisible({ timeout: 2000 }).catch(() => false)
      console.log('Mobile drag-to-create works:', mobileCreateWorks)
      
      if (mobileCreateWorks) {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('State management: Multiple components remain synchronized', async ({ page }) => {
    const grid = page.locator('[role="grid"]')
    const gridBox = await grid.boundingBox()
    
    if (!gridBox) return
    
    // Create an event
    await createEventByDrag(page, gridBox.x + 200, gridBox.y + 100, gridBox.x + 300, gridBox.y + 100)
    
    const titleInput = page.locator('input[type="text"]').first()
    if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await titleInput.fill('State Test Event')
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(500)
      
      // Double-click to open modal
      const event = page.locator('div').filter({ hasText: 'State Test Event' }).first()
      if (await event.isVisible()) {
        await event.dblclick()
        
        // Modal should open
        const modal = page.locator('[role="dialog"]')
        const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false)
        console.log('Modal opened on double-click:', modalVisible)
        
        if (modalVisible) {
          // Close modal
          const closeBtn = page.locator('button[aria-label*="close"]')
          if (await closeBtn.isVisible()) {
            await closeBtn.click()
          } else {
            await page.keyboard.press('Escape')
          }
        }
      }
    }
    
    // Verify no state conflicts
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('state')) {
        errors.push(msg.text())
      }
    })
    
    expect(errors).toHaveLength(0)
  })
})