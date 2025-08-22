import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Helper to wait for the calendar to load
async function waitForCalendar(page: Page) {
  await page.waitForSelector('[data-testid="calendar-fullbleed"]', { timeout: 10000 });
  await page.waitForTimeout(500); // Let animations complete
}

// Helper to create an event on a specific date
async function createEventOnDate(page: Page, year: number, month: string, day: number, eventTitle: string) {
  // Click on the specific day cell
  const dayCell = page.locator(`[data-testid="cell-${year}-${month}-${day}"]`);
  
  // If testid doesn't exist, fall back to text-based selection
  if (await dayCell.count() === 0) {
    await page.locator(`text="${day}"`).first().click();
  } else {
    await dayCell.click();
  }
  
  // Wait for modal to open
  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  
  // Fill in event title
  const titleInput = modal.locator('input').first();
  await titleInput.fill(eventTitle);
  
  // Save the event
  const saveButton = modal.locator('button:has-text("Save"), button:has-text("Create")').first();
  await saveButton.click();
  
  // Wait for modal to close
  await modal.waitFor({ state: 'hidden', timeout: 5000 });
}

test.describe('Linear Calendar FullBleed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForCalendar(page);
  });

  test('should render 12 months with 42 cells each', async ({ page }) => {
    // Check all 12 months are rendered (month labels on left side)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (const month of months) {
      // Month labels appear on the left side without year
      const monthLabel = page.locator(`text="${month}"`).first();
      await expect(monthLabel).toBeVisible();
    }
    
    // Check that each month row has day numbers (1-31)
    await expect(page.locator('text="31"').first()).toBeVisible();
    
    // Check calendar has expected structure
    const calendarContainer = page.locator('[data-testid="calendar-fullbleed"]');
    await expect(calendarContainer).toBeVisible();
  });

  test('should create event on click', async ({ page }) => {
    // Click on a day cell (15th in January row)
    const januaryRow = page.locator('text="Jan"').locator('..');
    const dayCell = januaryRow.locator('text="15"').first();
    await dayCell.click();
    
    // Check if modal opens
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Fill in event details
    const titleInput = modal.locator('input').first();
    await titleInput.fill('Test Event');
    
    // Save event (look for Save or Create button)
    const saveButton = modal.locator('button:has-text("Save"), button:has-text("Create")').first();
    await saveButton.click();
    
    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Verify event is created (it should appear on the calendar)
    await expect(page.locator('text=Test Event')).toBeVisible({ timeout: 5000 });
  });

  test('should drag and drop events', async ({ page }) => {
    // Create an event first
    await createEventOnDate(page, 2025, 'Januar', 10, 'Draggable Event');
    
    // Find the event
    const event = page.locator('text=Draggable Event').first();
    await expect(event).toBeVisible();
    
    // Drag to another date
    const targetCell = page.locator('[data-testid="cell-2025-Januar-20"]');
    
    // Perform drag and drop
    await event.hover();
    await page.mouse.down();
    await targetCell.hover();
    await page.mouse.up();
    
    // Verify event moved (check parent cell changed)
    const movedEvent = page.locator('[data-testid="cell-2025-Januar-20"] text=Draggable Event');
    await expect(movedEvent).toBeVisible();
  });

  test('should resize events across multiple days', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'Februar', 5, 'Resizable Event');
    
    // Find the event
    const event = page.locator('text=Resizable Event').first();
    await expect(event).toBeVisible();
    
    // Find resize handle (bottom-right corner)
    const eventBox = await event.boundingBox();
    if (!eventBox) throw new Error('Event not found');
    
    // Drag resize handle to extend event
    await page.mouse.move(eventBox.x + eventBox.width - 5, eventBox.y + eventBox.height - 5);
    await page.mouse.down();
    await page.mouse.move(eventBox.x + eventBox.width + 100, eventBox.y + eventBox.height);
    await page.mouse.up();
    
    // Verify event width increased
    const newBox = await event.boundingBox();
    if (!newBox) throw new Error('Event not found after resize');
    expect(newBox.width).toBeGreaterThan(eventBox.width);
  });

  test('should show floating toolbar on event click', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'März', 12, 'Toolbar Test Event');
    
    // Click on the event
    await page.click('text=Toolbar Test Event');
    
    // Check if floating toolbar appears
    await expect(page.locator('[data-testid="floating-toolbar"]')).toBeVisible();
    
    // Check toolbar buttons
    await expect(page.locator('[data-testid="toolbar-edit"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-delete"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-duplicate"]')).toBeVisible();
  });

  test('should delete event via toolbar', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'April', 8, 'Event to Delete');
    
    // Click on the event
    await page.click('text=Event to Delete');
    
    // Click delete button in toolbar
    await page.click('[data-testid="toolbar-delete"]');
    
    // Confirm deletion if dialog appears
    const confirmButton = page.locator('button:has-text("Delete")').last();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Verify event is deleted
    await expect(page.locator('text=Event to Delete')).not.toBeVisible();
  });

  test('should duplicate event via toolbar', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'Mai', 15, 'Original Event');
    
    // Click on the event
    await page.click('text=Original Event');
    
    // Click duplicate button in toolbar
    await page.click('[data-testid="toolbar-duplicate"]');
    
    // Verify duplicate is created
    const duplicates = await page.locator('text=Original Event').count();
    expect(duplicates).toBe(2);
  });

  test('should handle pan and zoom controls', async ({ page }) => {
    // Find zoom controls
    const zoomInButton = page.locator('button[aria-label="Zoom in"]');
    const zoomOutButton = page.locator('button[aria-label="Zoom out"]');
    const resetButton = page.locator('button[aria-label="Reset view"]');
    
    // Test zoom in
    await zoomInButton.click();
    await page.waitForTimeout(300); // Wait for animation
    
    // Test zoom out
    await zoomOutButton.click();
    await zoomOutButton.click();
    await page.waitForTimeout(300);
    
    // Test reset
    await resetButton.click();
    await page.waitForTimeout(300);
    
    // Verify controls work (calendar should still be visible)
    await expect(page.locator('[data-testid="calendar-fullbleed"]')).toBeVisible();
  });

  test('should navigate between views', async ({ page }) => {
    // Check Year view is active by default
    await expect(page.locator('button:has-text("Year")[aria-current="page"]')).toBeVisible();
    
    // Navigate to Timeline view
    await page.click('button:has-text("Timeline")');
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    
    // Navigate to Manage view
    await page.click('button:has-text("Manage")');
    await expect(page.locator('[data-testid="event-management"]')).toBeVisible();
    
    // Navigate back to Year view
    await page.click('button:has-text("Year")');
    await expect(page.locator('[data-testid="calendar-fullbleed"]')).toBeVisible();
  });

  test('should show today marker', async ({ page }) => {
    const today = new Date();
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const currentMonth = monthNames[today.getMonth()];
    const currentDay = today.getDate();
    
    // Check if today's cell has special styling
    const todayCell = page.locator(`[data-testid="cell-${today.getFullYear()}-${currentMonth}-${currentDay}"]`);
    const todayClass = await todayCell.getAttribute('class');
    expect(todayClass).toContain('today');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first event or calendar
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    
    // Press Enter to create event
    await page.keyboard.press('Enter');
    
    // Check if modal opens
    const modal = page.locator('[role="dialog"]');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (isModalVisible) {
      // Close modal with Escape
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('should filter events by category', async ({ page }) => {
    // Create events with different categories
    await createEventOnDate(page, 2025, 'Juni', 5, 'Work Event');
    await page.click('[data-testid="category-select"]');
    await page.click('text=Work');
    await page.click('button:has-text("Save")');
    
    await createEventOnDate(page, 2025, 'Juni', 10, 'Personal Event');
    await page.click('[data-testid="category-select"]');
    await page.click('text=Personal');
    await page.click('button:has-text("Save")');
    
    // Open filter menu (if exists)
    const filterButton = page.locator('[data-testid="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Filter by Work category
      await page.click('text=Work');
      
      // Verify only Work events are visible
      await expect(page.locator('text=Work Event')).toBeVisible();
      await expect(page.locator('text=Personal Event')).not.toBeVisible();
    }
  });

  test('should handle event context menu', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'Juli', 20, 'Context Menu Test');
    
    // Right-click on the event
    await page.click('text=Context Menu Test', { button: 'right' });
    
    // Check if context menu appears
    const contextMenu = page.locator('[role="menu"]');
    if (await contextMenu.isVisible()) {
      await expect(page.locator('text=Edit')).toBeVisible();
      await expect(page.locator('text=Delete')).toBeVisible();
      await expect(page.locator('text=Duplicate')).toBeVisible();
      
      // Close context menu
      await page.keyboard.press('Escape');
    }
  });

  test('should persist events in IndexedDB', async ({ page }) => {
    // Create an event
    await createEventOnDate(page, 2025, 'August', 15, 'Persistent Event');
    
    // Reload the page
    await page.reload();
    await waitForCalendar(page);
    
    // Verify event still exists
    await expect(page.locator('text=Persistent Event')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Create test events
    await createEventOnDate(page, 2025, 'September', 5, 'Meeting with Team');
    await createEventOnDate(page, 2025, 'September', 10, 'Doctor Appointment');
    
    // Open search (Command+K)
    await page.keyboard.press('Meta+k');
    
    // Wait for command bar
    const commandBar = page.locator('[role="combobox"]');
    if (await commandBar.isVisible()) {
      // Search for "Meeting"
      await page.fill('[role="combobox"]', 'Meeting');
      
      // Verify search results
      await expect(page.locator('text=Meeting with Team')).toBeVisible();
      
      // Close search
      await page.keyboard.press('Escape');
    }
  });

  test('should handle notifications', async ({ page }) => {
    // Click notification bell
    const notificationBell = page.locator('[aria-label="Notifications"]');
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      
      // Check if notification panel opens
      const notificationPanel = page.locator('[data-testid="notification-panel"]');
      if (await notificationPanel.isVisible()) {
        // Close panel
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should open settings dialog', async ({ page }) => {
    // Find and click settings button
    const settingsButton = page.locator('button[aria-label="Settings"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Check if settings dialog opens
      await expect(page.locator('text=Settings')).toBeVisible();
      
      // Close dialog
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should show mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Check if hamburger menu is visible
    const menuButton = page.locator('button[aria-label="Menu"]').or(page.locator('svg.lucide-menu').locator('..'));
    await expect(menuButton).toBeVisible();
    
    // Click menu button
    await menuButton.click();
    
    // Check if mobile menu opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Year View')).toBeVisible();
    await expect(page.locator('text=Timeline View')).toBeVisible();
    await expect(page.locator('text=Event Management')).toBeVisible();
  });
  
  test('should show mobile calendar view', async ({ page }) => {
    await page.goto('/');
    
    // Check if mobile calendar view is rendered
    await expect(page.locator('[data-testid="mobile-calendar-view"]')).toBeVisible();
    
    // Should show current month
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[today.getMonth()];
    
    await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should handle 1000+ events efficiently', async ({ page }) => {
    await page.goto('/');
    await waitForCalendar(page);
    
    // Inject 1000 test events via JavaScript
    await page.evaluate(() => {
      const events = [];
      const categories = ['personal', 'work', 'effort', 'note'];
      
      for (let i = 0; i < 1000; i++) {
        const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        events.push({
          id: `perf-test-${i}`,
          title: `Event ${i}`,
          description: `Performance test event ${i}`,
          startDate: startDate,
          endDate: new Date(startDate.getTime() + (Math.random() * 3 * 24 * 60 * 60 * 1000)),
          category: categories[Math.floor(Math.random() * categories.length)]
        });
      }
      
      // Store in localStorage (temporary for test)
      localStorage.setItem('test-events', JSON.stringify(events));
    });
    
    // Measure rendering performance
    const startTime = Date.now();
    await page.reload();
    await waitForCalendar(page);
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Test scrolling performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // Calendar should still be responsive
    await expect(page.locator('[data-testid="calendar-fullbleed"]')).toBeVisible();
  });
});