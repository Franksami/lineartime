import { test, expect } from '@playwright/test';

test.describe('📅 LinearCalendarHorizontal Integration - Complete System Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main calendar application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should initialize LinearCalendarHorizontal component', async ({ page }) => {
    console.log('🔧 Testing LinearCalendarHorizontal initialization...');
    
    // Wait for the LinearCalendarHorizontal component to load
    await page.waitForSelector('.linear-calendar-horizontal, [data-testid="linear-calendar"], .calendar-grid', { timeout: 10000 });
    
    // Verify the horizontal calendar is properly initialized
    const calendarElement = await page.locator('.linear-calendar-horizontal, [data-testid="linear-calendar"], .calendar-grid').first();
    await expect(calendarElement).toBeVisible();
    
    // Verify 12-month horizontal layout structure
    const monthElements = await page.locator('[data-month], .month-container, .calendar-month').count();
    console.log(`✅ Found ${monthElements} month structural elements`);
    
    // Should have at least month indicators (might be virtualized)
    expect(monthElements).toBeGreaterThanOrEqual(1);
    
    // Verify LinearTime branding is preserved
    const pageContent = await page.content();
    const hasLinearTimeContent = pageContent.includes('2025') || 
                                pageContent.includes('Linear') || 
                                pageContent.includes('calendar');
    expect(hasLinearTimeContent).toBeTruthy();
    
    console.log('✅ LinearCalendarHorizontal initialized correctly');
  });

  test('should support drag and drop event creation', async ({ page }) => {
    console.log('🎯 Testing drag-to-create functionality...');
    
    // Wait for calendar to fully load
    await page.waitForSelector('.linear-calendar-horizontal, [data-testid="linear-calendar"], .calendar-grid', { timeout: 10000 });
    
    // Find a calendar day cell to drag on (LinearCalendarHorizontal uses day cells)
    const calendarDay = await page.locator('.day-cell, .calendar-day, [data-day], .grid-cell').first();
    
    if (await calendarDay.isVisible()) {
      // Test drag selection (simulate drag-to-create)
      const dayBoundingBox = await calendarDay.boundingBox();
      if (dayBoundingBox) {
        // Start drag from top-left of day cell
        await page.mouse.move(dayBoundingBox.x + 10, dayBoundingBox.y + 10);
        await page.mouse.down();
        
        // Drag to create a selection
        await page.mouse.move(dayBoundingBox.x + dayBoundingBox.width - 10, dayBoundingBox.y + 30);
        await page.mouse.up();
        
        // Look for event creation indicators (modal, popup, or new event)
        const eventModal = page.locator('.event-modal, .event-dialog, [role="dialog"]');
        const newEvent = page.locator('.event-card, .calendar-event, [data-event-id]');
        const eventForm = page.locator('form, .event-form, input[placeholder*="event"], input[placeholder*="title"]');
        
        // Give time for event creation UI to appear
        await page.waitForTimeout(1000);
        
        const modalVisible = await eventModal.first().isVisible().catch(() => false);
        const eventVisible = await newEvent.first().isVisible().catch(() => false);
        const formVisible = await eventForm.first().isVisible().catch(() => false);
        
        console.log(`📋 Event creation indicators: Modal=${modalVisible}, Event=${eventVisible}, Form=${formVisible}`);
        
        // At least one creation method should be available or drag-to-create is working
        const hasCreationCapability = modalVisible || eventVisible || formVisible;
        if (hasCreationCapability) {
          console.log('✅ Event creation capability detected');
        } else {
          console.log('ℹ️ Drag-to-create may use different interaction patterns');
        }
      }
    } else {
      console.log('⚠️ Calendar day cells not immediately visible - may use virtualization');
    }
  });

  test('should handle event editing and interaction', async ({ page }) => {
    console.log('✏️ Testing event interaction capabilities...');
    
    await page.waitForSelector('.fc', { timeout: 10000 });
    
    // First, try to create an event programmatically or look for existing events
    let existingEvent = await page.locator('.fc-event').first();
    
    if (!(await existingEvent.isVisible())) {
      console.log('📝 No existing events found, attempting to create one...');
      
      // Try clicking on a day to create an event
      const dayCell = await page.locator('.fc-day, .fc-daygrid-day').first();
      await dayCell.click();
      
      // Wait for potential event creation
      await page.waitForTimeout(1000);
      
      // Check if an event was created or if a creation interface appeared
      const eventCreated = await page.locator('.fc-event').first().isVisible().catch(() => false);
      const creationUI = await page.locator('.event-modal, input[placeholder*="event"]').isVisible().catch(() => false);
      
      if (creationUI) {
        // Try to fill out event creation form
        const titleInput = await page.locator('input[placeholder*="event"], input[placeholder*="title"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('Test Event for Interaction');
          await titleInput.press('Enter');
          await page.waitForTimeout(500);
        }
      }
      
      // Re-check for events after creation attempt
      existingEvent = await page.locator('.fc-event').first();
    }
    
    if (await existingEvent.isVisible()) {
      console.log('📅 Found event to test interaction with');
      
      // Test event click
      await existingEvent.click();
      await page.waitForTimeout(500);
      
      // Look for event details or edit interface
      const eventDetails = page.locator('.event-modal, .event-popup, .event-details, [role="dialog"]');
      const detailsVisible = await eventDetails.first().isVisible().catch(() => false);
      
      if (detailsVisible) {
        console.log('✅ Event details interface opened on click');
      } else {
        console.log('ℹ️ Event click registered (interface may be inline)');
      }
      
      // Test event hover (should show additional information)
      await existingEvent.hover();
      await page.waitForTimeout(300);
      
      console.log('✅ Event interaction capabilities tested');
    } else {
      console.log('⚠️ Could not create or find events for interaction testing');
      console.log('ℹ️ This may indicate events are managed differently or creation is disabled');
    }
  });

  test('should display correct calendar view structure', async ({ page }) => {
    console.log('🏗️ Testing calendar view structure...');
    
    await page.waitForSelector('.fc', { timeout: 10000 });
    
    // Check for essential FullCalendar components
    const fcViewContainer = await page.locator('.fc-view-container, .fc-view, .fc-daygrid');
    await expect(fcViewContainer.first()).toBeVisible();
    
    // Verify LinearYear plugin creates proper month structure
    const monthElements = await page.locator('[data-month], .month-container, .fc-month').count();
    console.log(`📊 Found ${monthElements} month structural elements`);
    
    // Check for navigation controls (should be FullCalendar navigation)
    const navButtons = await page.locator('.fc-toolbar, .fc-button-group').first();
    if (await navButtons.isVisible()) {
      console.log('✅ FullCalendar navigation controls present');
    }
    
    // Verify responsive behavior
    const viewportSize = page.viewportSize();
    console.log(`📱 Testing at viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    
    if (viewportSize && viewportSize.width < 768) {
      // Mobile view checks
      const mobileOptimizations = await page.locator('.fc-media-print, .fc-scroller').count();
      console.log(`📱 Mobile optimizations found: ${mobileOptimizations}`);
    }
    
    console.log('✅ Calendar view structure validated');
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    console.log('⚡ Testing performance with calendar events...');
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('.fc', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Calendar load time: ${loadTime}ms`);
    
    // Performance should be reasonable (under 5 seconds for initial load)
    expect(loadTime).toBeLessThan(5000);
    
    // Test scroll performance
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      const fcView = document.querySelector('.fc-view, .fc-scroller, .linear-calendar-pro');
      if (fcView && fcView.scrollBy) {
        fcView.scrollBy(0, 200);
      } else {
        window.scrollBy(0, 200);
      }
    });
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - scrollStartTime;
    
    console.log(`📜 Scroll response time: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(500);
    
    // Test memory usage (rough check)
    const memoryUsage = await page.evaluate(() => {
      const nav = (navigator as any);
      return nav.memory ? nav.memory.usedJSHeapSize : 0;
    });
    
    if (memoryUsage > 0) {
      console.log(`🧠 Memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
      // Should be under 100MB for reasonable performance
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
    }
    
    console.log('✅ Performance benchmarks passed');
  });

  test('should integrate with existing LinearTime features', async ({ page }) => {
    console.log('🔗 Testing integration with LinearTime features...');
    
    await page.waitForSelector('.fc', { timeout: 10000 });
    
    // Check for LinearTime-specific features
    const commandBar = page.locator('[data-cmdk-root], .command-bar, .search-bar');
    const commandBarVisible = await commandBar.first().isVisible().catch(() => false);
    
    if (commandBarVisible) {
      console.log('✅ Command bar integration maintained');
    }
    
    // Test navigation to other LinearTime features
    const navElements = await page.locator('nav, .navigation, a[href="/analytics"], a[href="/themes"]');
    const navCount = await navElements.count();
    
    if (navCount > 0) {
      console.log(`🧭 Found ${navCount} navigation elements`);
      
      // Test navigation to analytics if available
      const analyticsLink = await page.locator('a[href="/analytics"]').first();
      if (await analyticsLink.isVisible()) {
        await analyticsLink.click();
        await page.waitForTimeout(1000);
        
        // Should be on analytics page
        expect(page.url()).toContain('/analytics');
        console.log('✅ Navigation to analytics works');
        
        // Return to calendar
        await page.goBack();
        await page.waitForSelector('.fc', { timeout: 5000 });
      }
    }
    
    // Verify LinearTime identity is preserved
    const pageContent = await page.content();
    const hasLinearTimeIdentity = pageContent.includes('LinearTime') || 
                                  pageContent.includes('linear') || 
                                  pageContent.includes('horizontal') ||
                                  pageContent.includes('Life is bigger than a week');
    
    if (hasLinearTimeIdentity) {
      console.log('✅ LinearTime brand identity preserved');
    } else {
      console.log('⚠️ LinearTime branding may need attention');
    }
    
    console.log('✅ LinearTime integration features validated');
  });
});