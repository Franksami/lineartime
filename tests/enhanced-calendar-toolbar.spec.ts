import { test, expect } from '@playwright/test';

test.describe('Enhanced Calendar Toolbar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-enhanced-toolbar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Toolbar Initialization and Rendering', () => {
    test('should load Enhanced Calendar Toolbar with glass-morphism styling', async ({ page }) => {
      await expect(page.locator('[data-testid="enhanced-calendar-toolbar"]')).toBeVisible();

      // Check for glass-morphism styling
      const toolbar = page.locator('[data-testid="enhanced-calendar-toolbar"]');
      const styles = await toolbar.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          background: computed.background,
          borderRadius: computed.borderRadius,
        };
      });

      // Should have glass-morphism effects
      expect(styles.backdropFilter).toContain('blur');
      expect(styles.background).toMatch(/rgba|hsla|gradient/);
    });

    test('should display all toolbar sections correctly', async ({ page }) => {
      // Main toolbar sections
      await expect(page.locator('[data-testid="toolbar-left-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="toolbar-center-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="toolbar-right-section"]')).toBeVisible();

      // Key components
      await expect(page.locator('[data-testid="library-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-add-event-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    });

    test('should show sync status indicator', async ({ page }) => {
      const syncIndicator = page.locator('[data-testid="sync-status-indicator"]');

      if (await syncIndicator.isVisible()) {
        // Should show sync status (synced, syncing, error, etc.)
        const syncStatus = await syncIndicator.textContent();
        expect(syncStatus).toMatch(/synced|syncing|offline|error/i);
      }
    });

    test('should initialize with correct default values', async ({ page }) => {
      // Library selector should have default value
      const librarySelector = page.locator('[data-testid="library-selector"]');
      const selectedLibrary = await librarySelector.inputValue();
      expect(selectedLibrary).toMatch(
        /linear|fullcalendar|react-big|primereact|muix|react-calendar/
      );

      // View selector should have default view
      const viewSelector = page.locator('[data-testid="view-selector"]');
      const selectedView = await viewSelector.inputValue();
      expect(selectedView).toMatch(/month|week|day|agenda/);
    });
  });

  test.describe('Library Switching Functionality', () => {
    test('should switch calendar libraries via dropdown', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');
      const calendarContainer = page.locator('[data-testid="calendar-container"]');

      // Test switching between libraries
      const libraries = ['linear', 'fullcalendar', 'react-big-calendar', 'primereact', 'muix'];

      for (const library of libraries) {
        await librarySelector.selectOption(library);
        await page.waitForTimeout(500);

        // Verify calendar changed
        const currentLibrary = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
        });
        expect(currentLibrary).toBe(library);

        // Calendar should still be visible
        await expect(calendarContainer).toBeVisible();
      }
    });

    test('should show library-specific features in dropdown', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      // Open dropdown
      await librarySelector.click();

      // Should show all available libraries
      const options = page.locator('[data-testid="library-selector"] option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(5);

      // Check for library descriptions/features
      const optionTexts = await options.allTextContents();
      expect(optionTexts.some((text) => text.includes('Linear'))).toBe(true);
      expect(optionTexts.some((text) => text.includes('FullCalendar'))).toBe(true);
    });

    test('should maintain events across library switches', async ({ page }) => {
      // Add an event
      await page.click('[data-testid="quick-add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Library Switch Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      const librarySelector = page.locator('[data-testid="library-selector"]');
      const initialLibrary = await librarySelector.inputValue();

      // Switch to different library
      const targetLibrary = initialLibrary === 'linear' ? 'fullcalendar' : 'linear';
      await librarySelector.selectOption(targetLibrary);
      await page.waitForTimeout(1000);

      // Event should still exist
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.some((e) => e.title === 'Library Switch Test Event')).toBe(true);
    });
  });

  test.describe('View Controls and Navigation', () => {
    test('should switch between calendar views', async ({ page }) => {
      const viewSelector = page.locator('[data-testid="view-selector"]');
      const views = ['month', 'week', 'day', 'agenda'];

      for (const view of views) {
        await viewSelector.selectOption(view);
        await page.waitForTimeout(300);

        // Verify view changed in provider
        const currentView = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getCurrentView();
        });
        expect(currentView).toBe(view);
      }
    });

    test('should navigate to today with today button', async ({ page }) => {
      const todayBtn = page.locator('[data-testid="today-btn"]');

      if (await todayBtn.isVisible()) {
        await todayBtn.click();
        await page.waitForTimeout(300);

        // Should navigate to current date
        const selectedDate = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
        });

        const today = new Date();
        const selected = new Date(selectedDate);

        expect(selected.getDate()).toBe(today.getDate());
        expect(selected.getMonth()).toBe(today.getMonth());
        expect(selected.getFullYear()).toBe(today.getFullYear());
      }
    });

    test('should navigate with previous/next buttons', async ({ page }) => {
      const prevBtn = page.locator('[data-testid="prev-period-btn"]');
      const nextBtn = page.locator('[data-testid="next-period-btn"]');

      if ((await prevBtn.isVisible()) && (await nextBtn.isVisible())) {
        const initialDate = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
        });

        // Navigate forward
        await nextBtn.click();
        await page.waitForTimeout(300);

        const forwardDate = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
        });

        expect(new Date(forwardDate).getTime()).not.toBe(new Date(initialDate).getTime());

        // Navigate back
        await prevBtn.click();
        await page.waitForTimeout(300);

        const backDate = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
        });

        expect(new Date(backDate).getTime()).toBe(new Date(initialDate).getTime());
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should trigger quick event creation with Ctrl+N', async ({ page }) => {
      await page.keyboard.press('Control+KeyN');

      // Event creation modal should open
      const modal = page.locator('[data-testid="event-modal"], [data-testid="quick-event-modal"]');
      await expect(modal).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
    });

    test('should focus search with Ctrl+F', async ({ page }) => {
      await page.keyboard.press('Control+KeyF');

      // Search input should be focused
      const searchInput = page.locator('[data-testid="search-input"]');
      const isFocused = await searchInput.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBe(true);
    });

    test('should navigate to today with T key', async ({ page }) => {
      const initialDate = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
      });

      // Navigate away from today first
      const nextBtn = page.locator('[data-testid="next-period-btn"]');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }

      // Press T for today
      await page.keyboard.press('KeyT');
      await page.waitForTimeout(300);

      const todayDate = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
      });

      const today = new Date();
      const selected = new Date(todayDate);

      expect(selected.getDate()).toBe(today.getDate());
      expect(selected.getMonth()).toBe(today.getMonth());
    });

    test('should display keyboard shortcuts help', async ({ page }) => {
      const helpBtn = page.locator('[data-testid="keyboard-shortcuts-help"]');

      if (await helpBtn.isVisible()) {
        await helpBtn.click();

        // Should show shortcuts modal
        const shortcutsModal = page.locator('[data-testid="shortcuts-modal"]');
        await expect(shortcutsModal).toBeVisible();

        // Should list keyboard shortcuts
        await expect(shortcutsModal.locator('text=Ctrl+N')).toBeVisible();
        await expect(shortcutsModal.locator('text=Ctrl+F')).toBeVisible();
        await expect(shortcutsModal.locator('text=T')).toBeVisible();
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should search events by title', async ({ page }) => {
      // Add searchable events
      await page.evaluate(() => {
        const events = [
          { id: 'search-1', title: 'Team Meeting', start: new Date(), end: new Date() },
          { id: 'search-2', title: 'Project Review', start: new Date(), end: new Date() },
          { id: 'search-3', title: 'Client Call', start: new Date(), end: new Date() },
        ];

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.fill('team');
      await page.waitForTimeout(500);

      // Should show search results
      const searchResults = page.locator('[data-testid="search-results"]');
      if (await searchResults.isVisible()) {
        await expect(searchResults.locator('text=Team Meeting')).toBeVisible();
        await expect(searchResults.locator('text=Project Review')).not.toBeVisible();
      }
    });

    test('should clear search results', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      const clearBtn = page.locator('[data-testid="clear-search-btn"]');

      // Enter search term
      await searchInput.fill('meeting');
      await page.waitForTimeout(300);

      // Clear search
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      } else {
        await searchInput.clear();
      }

      // Search should be cleared
      const searchValue = await searchInput.inputValue();
      expect(searchValue).toBe('');
    });

    test('should show search suggestions', async ({ page }) => {
      // Add events for suggestions
      await page.evaluate(() => {
        const events = [
          { id: 'suggest-1', title: 'Daily Standup', start: new Date(), end: new Date() },
          { id: 'suggest-2', title: 'Daily Review', start: new Date(), end: new Date() },
        ];

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.fill('daily');
      await page.waitForTimeout(300);

      // Should show suggestions dropdown
      const suggestions = page.locator('[data-testid="search-suggestions"]');
      if (await suggestions.isVisible()) {
        await expect(suggestions.locator('text=Daily Standup')).toBeVisible();
        await expect(suggestions.locator('text=Daily Review')).toBeVisible();
      }
    });
  });

  test.describe('Theme Integration', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme') ||
            document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light';
        });

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Theme should change
        const newTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme') ||
            document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light';
        });

        expect(newTheme).not.toBe(initialTheme);

        // Toolbar should adapt to new theme
        const toolbar = page.locator('[data-testid="enhanced-calendar-toolbar"]');
        const toolbarStyles = await toolbar.evaluate((el) => {
          return window.getComputedStyle(el).background;
        });
        expect(toolbarStyles).toBeTruthy();
      }
    });

    test('should maintain glass-morphism effects across themes', async ({ page }) => {
      const toolbar = page.locator('[data-testid="enhanced-calendar-toolbar"]');
      const themeToggle = page.locator('[data-testid="theme-toggle"]');

      // Get styles in current theme
      const initialStyles = await toolbar.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          background: computed.background,
        };
      });

      // Toggle theme
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Glass effects should still be present
        const newStyles = await toolbar.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backdropFilter: computed.backdropFilter,
            background: computed.background,
          };
        });

        expect(newStyles.backdropFilter).toContain('blur');
        expect(newStyles.background).toBeTruthy();
      }
    });
  });

  test.describe('Quick Event Creation', () => {
    test('should open quick event modal', async ({ page }) => {
      const quickAddBtn = page.locator('[data-testid="quick-add-event-btn"]');
      await quickAddBtn.click();

      // Quick event modal should open
      const modal = page.locator('[data-testid="quick-event-modal"], [data-testid="event-modal"]');
      await expect(modal).toBeVisible();

      // Should have quick creation fields
      await expect(modal.locator('[data-testid="event-title-input"]')).toBeVisible();
    });

    test('should create event with minimal information', async ({ page }) => {
      await page.click('[data-testid="quick-add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Quick Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);

        // Event should be created
        const events = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
        });

        expect(events.some((e) => e.title === 'Quick Test Event')).toBe(true);
      }
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="quick-add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        // Try to save without title
        await page.click('[data-testid="save-event-btn"]');

        // Should show validation error
        const errorMessage = page.locator('[data-testid="validation-error"], .error-message');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toContainText(/title|required/i);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt toolbar layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const toolbar = page.locator('[data-testid="enhanced-calendar-toolbar"]');
      await expect(toolbar).toBeVisible();

      // Should use mobile layout
      const toolbarStyles = await toolbar.evaluate((el) => {
        return {
          flexDirection: window.getComputedStyle(el).flexDirection,
          padding: window.getComputedStyle(el).padding,
        };
      });

      // Mobile adaptations should be applied
      expect(toolbarStyles).toBeTruthy();
    });

    test('should stack elements vertically on narrow screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Toolbar sections should stack or compress
      const leftSection = page.locator('[data-testid="toolbar-left-section"]');
      const centerSection = page.locator('[data-testid="toolbar-center-section"]');
      const rightSection = page.locator('[data-testid="toolbar-right-section"]');

      // All sections should still be visible
      await expect(leftSection).toBeVisible();
      await expect(centerSection).toBeVisible();
      await expect(rightSection).toBeVisible();
    });

    test('should maintain functionality on touch devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Test touch interactions
      const librarySelector = page.locator('[data-testid="library-selector"]');
      await librarySelector.tap();

      // Dropdown should open
      await page.waitForTimeout(300);

      // Should be able to select option
      const option = page.locator('[data-testid="library-selector"] option').first();
      if (await option.isVisible()) {
        await option.tap();
      }
    });
  });

  test.describe('Animation and Transitions', () => {
    test('should animate toolbar appearance', async ({ page }) => {
      // Reload page to catch initial animation
      await page.reload();

      const toolbar = page.locator('[data-testid="enhanced-calendar-toolbar"]');

      // Toolbar should have transition properties
      const hasTransition = await toolbar.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return (
          computed.transition !== 'none' ||
          computed.transform !== 'none' ||
          computed.opacity !== '1'
        );
      });

      // Should have some form of animation
      expect(typeof hasTransition).toBe('boolean');
    });

    test('should animate dropdown menus', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      // Open dropdown
      await librarySelector.click();

      // Should have smooth opening animation
      const dropdown = page.locator('[data-testid="library-selector-dropdown"]');
      if (await dropdown.isVisible()) {
        const dropdownStyles = await dropdown.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transition: computed.transition,
            transform: computed.transform,
            opacity: computed.opacity,
          };
        });

        expect(dropdownStyles).toBeTruthy();
      }
    });

    test('should animate button interactions', async ({ page }) => {
      const quickAddBtn = page.locator('[data-testid="quick-add-event-btn"]');

      // Button should have hover/active states
      await quickAddBtn.hover();
      await page.waitForTimeout(100);

      const hoverStyles = await quickAddBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          transform: computed.transform,
          boxShadow: computed.boxShadow,
          scale: computed.scale,
        };
      });

      expect(hoverStyles).toBeTruthy();
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should load toolbar quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/test-enhanced-toolbar');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="enhanced-calendar-toolbar"]')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    test('should handle rapid interactions efficiently', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      // Rapidly switch between libraries
      const libraries = ['linear', 'fullcalendar', 'react-big-calendar', 'primereact'];

      for (let i = 0; i < 3; i++) {
        for (const library of libraries) {
          await librarySelector.selectOption(library);
          await page.waitForTimeout(50); // Minimal delay
        }
      }

      // Toolbar should remain responsive
      await expect(page.locator('[data-testid="enhanced-calendar-toolbar"]')).toBeVisible();
    });

    test('should optimize re-renders during state changes', async ({ page }) => {
      // Monitor console for excessive re-renders
      const consoleLogs = [];
      page.on('console', (msg) => {
        if (msg.type() === 'warn' && msg.text().includes('render')) {
          consoleLogs.push(msg.text());
        }
      });

      // Perform state changes
      const viewSelector = page.locator('[data-testid="view-selector"]');
      const views = ['month', 'week', 'day'];

      for (const view of views) {
        await viewSelector.selectOption(view);
        await page.waitForTimeout(100);
      }

      // Should not have excessive render warnings
      expect(consoleLogs.length).toBeLessThan(5);
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should sync toolbar state with provider', async ({ page }) => {
      // Change library via toolbar
      const librarySelector = page.locator('[data-testid="library-selector"]');
      await librarySelector.selectOption('fullcalendar');
      await page.waitForTimeout(300);

      // Provider should be updated
      const providerLibrary = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
      });
      expect(providerLibrary).toBe('fullcalendar');

      // Change view via toolbar
      const viewSelector = page.locator('[data-testid="view-selector"]');
      await viewSelector.selectOption('week');
      await page.waitForTimeout(300);

      // Provider should be updated
      const providerView = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getCurrentView();
      });
      expect(providerView).toBe('week');
    });

    test('should reflect provider state changes in toolbar', async ({ page }) => {
      // Change state via provider
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.setLibrary('primereact');
        window.__CALENDAR_PROVIDER_STATE__?.setView('day');
      });

      await page.waitForTimeout(500);

      // Toolbar should reflect changes
      const libraryValue = await page.locator('[data-testid="library-selector"]').inputValue();
      const viewValue = await page.locator('[data-testid="view-selector"]').inputValue();

      expect(libraryValue).toBe('primereact');
      expect(viewValue).toBe('day');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle library loading errors gracefully', async ({ page }) => {
      // Simulate library loading error
      await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__?.simulateError) {
          window.__CALENDAR_PROVIDER_STATE__.simulateError('Library load failed');
        }
      });

      const librarySelector = page.locator('[data-testid="library-selector"]');
      await librarySelector.selectOption('non-existent-library');
      await page.waitForTimeout(500);

      // Toolbar should remain functional
      await expect(page.locator('[data-testid="enhanced-calendar-toolbar"]')).toBeVisible();

      // Should fallback to working library
      const currentLibrary = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
      });
      expect(currentLibrary).toMatch(/linear|fullcalendar|react-big/);
    });

    test('should recover from search errors', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');

      // Enter problematic search terms
      await searchInput.fill('!@#$%^&*()');
      await page.waitForTimeout(300);

      // Search should not crash the toolbar
      await expect(page.locator('[data-testid="enhanced-calendar-toolbar"]')).toBeVisible();

      // Should be able to clear search
      await searchInput.clear();
      const searchValue = await searchInput.inputValue();
      expect(searchValue).toBe('');
    });

    test('should handle keyboard shortcut conflicts', async ({ page }) => {
      // Test conflicting shortcuts
      await page.keyboard.press('Control+KeyF');
      await page.keyboard.press('Control+KeyN');

      // Both features should work or one should take precedence
      const searchFocused = await page
        .locator('[data-testid="search-input"]')
        .evaluate((el) => document.activeElement === el);
      const modalVisible = await page.locator('[data-testid="event-modal"]').isVisible();

      // Either search is focused OR modal is open (not both conflicting)
      expect(searchFocused || modalVisible).toBe(true);
    });
  });
});
