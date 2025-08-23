import { test, expect } from '@playwright/test'

test.describe('🎯 Event Creation Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('Find and test clickable calendar cells', async ({ page }) => {
    console.log('=== CALENDAR CELL DETECTION ===')
    
    // Try different selectors
    const selectors = [
      '[data-date]',
      '[data-day]',
      '.day-cell',
      'div[title*="2025"]',
      'div[class*="absolute"][class*="transition-colors"]'
    ]
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count()
      console.log(`Selector "${selector}": ${count} elements found`)
      
      if (count > 0) {
        const first = page.locator(selector).first()
        const attrs = await first.evaluate(el => ({
          className: el.className,
          dataDate: el.getAttribute('data-date'),
          dataDay: el.getAttribute('data-day'),
          title: el.getAttribute('title'),
          tagName: el.tagName
        }))
        console.log(`  First element attributes:`, attrs)
      }
    }
    
    // Check calendar grid visibility
    const gridVisible = await page.locator('text=/Jan|Feb|Mar/').count() > 0
    console.log(`Calendar grid visible: ${gridVisible}`)
    
    // Find cells with day numbers
    const dayCells = await page.locator('span:has-text(/^\\d{2}$/)').all()
    console.log(`Found ${dayCells.length} cells with day numbers`)
    
    // Test clicking on a day
    if (dayCells.length > 0) {
      const dayCell = dayCells[15] // Pick a middle day
      const dayText = await dayCell.textContent()
      console.log(`Clicking on day: ${dayText}`)
      
      // Click on the parent container of the day number
      const parentCell = await dayCell.evaluateHandle(el => el.closest('div'))
      await parentCell.click()
      
      await page.waitForTimeout(500)
      
      // Check for event creation UI
      const modalVisible = await page.locator('[role="dialog"]').count() > 0
      const inputVisible = await page.locator('input[placeholder*="event" i]').count() > 0
      const quickEditVisible = await page.locator('input[placeholder*="title" i]').count() > 0
      
      console.log(`Event creation UI appeared:`)
      console.log(`  Modal: ${modalVisible}`)
      console.log(`  Event input: ${inputVisible}`)
      console.log(`  Quick edit: ${quickEditVisible}`)
    }
  })

  test('Test drag to create event', async ({ page }) => {
    console.log('=== DRAG TO CREATE TEST ===')
    
    // Find a day cell
    const dayCells = await page.locator('span:has-text(/^\\d{2}$/)').all()
    
    if (dayCells.length > 20) {
      const startCell = dayCells[10]
      const endCell = dayCells[14]
      
      // Get parent containers
      const startParent = await startCell.evaluateHandle(el => el.closest('div'))
      const endParent = await endCell.evaluateHandle(el => el.closest('div'))
      
      // Get bounding boxes
      const startBox = await startParent.boundingBox()
      const endBox = await endParent.boundingBox()
      
      if (startBox && endBox) {
        console.log('Dragging from day 10 to day 14')
        
        // Perform drag
        await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(100)
        await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2)
        await page.waitForTimeout(100)
        await page.mouse.up()
        
        await page.waitForTimeout(500)
        
        // Check for drag selection UI
        const dragSelectionVisible = await page.locator('[class*="drag"][class*="selection"]').count() > 0
        const quickEditVisible = await page.locator('input[placeholder*="title" i]').count() > 0
        
        console.log(`Drag to create UI:`)
        console.log(`  Drag selection: ${dragSelectionVisible}`)
        console.log(`  Quick edit: ${quickEditVisible}`)
      }
    }
  })

  test('Test floating toolbar', async ({ page }) => {
    console.log('=== FLOATING TOOLBAR TEST ===')
    
    // First create a test event
    await page.evaluate(() => {
      const event = new CustomEvent('test-create-event', {
        detail: {
          title: 'Test Event',
          startDate: new Date(2025, 0, 15),
          endDate: new Date(2025, 0, 15),
          category: 'personal'
        }
      })
      window.dispatchEvent(event)
    })
    
    await page.waitForTimeout(1000)
    
    // Look for event elements
    const eventElements = await page.locator('[class*="event"]').all()
    console.log(`Found ${eventElements.length} event elements`)
    
    if (eventElements.length > 0) {
      // Click on first event
      await eventElements[0].click()
      await page.waitForTimeout(500)
      
      // Check for floating toolbar
      const toolbarVisible = await page.locator('[class*="floating"][class*="toolbar"]').count() > 0
      const editButton = await page.locator('button:has-text("Edit")').count() > 0
      const deleteButton = await page.locator('button:has-text("Delete")').count() > 0
      
      console.log(`Floating toolbar:`)
      console.log(`  Toolbar visible: ${toolbarVisible}`)
      console.log(`  Edit button: ${editButton}`)
      console.log(`  Delete button: ${deleteButton}`)
    }
  })

  test('Check zoom controls', async ({ page }) => {
    console.log('=== ZOOM CONTROLS TEST ===')
    
    // Find zoom buttons
    const zoomInButton = page.locator('button[aria-label*="Zoom in" i]')
    const zoomOutButton = page.locator('button[aria-label*="Zoom out" i]')
    
    const hasZoomIn = await zoomInButton.count() > 0
    const hasZoomOut = await zoomOutButton.count() > 0
    
    console.log(`Zoom controls:`)
    console.log(`  Zoom in button: ${hasZoomIn}`)
    console.log(`  Zoom out button: ${hasZoomOut}`)
    
    if (hasZoomIn && hasZoomOut) {
      // Test zoom in
      await zoomInButton.click()
      await page.waitForTimeout(500)
      console.log('Clicked zoom in')
      
      // Test zoom out
      await zoomOutButton.click()
      await page.waitForTimeout(500)
      console.log('Clicked zoom out')
    }
    
    // Check for zoom level indicators
    const zoomIndicators = await page.locator('button:has-text(/Year|Month|Week|Day/)').all()
    console.log(`Found ${zoomIndicators.length} zoom level indicators`)
  })
})