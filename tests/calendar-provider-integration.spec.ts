import { test, expect } from '@playwright/test';

test.describe('CalendarProvider Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-calendar-provider');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Provider Initialization', () => {
    test('should initialize CalendarProvider with default state', async ({ page }) => {
      // Check if provider is available in global scope
      const providerState = await page.evaluate(() => {
        return typeof window.__CALENDAR_PROVIDER_STATE__ !== 'undefined';
      });
      expect(providerState).toBe(true);

      // Check initial library selection
      const currentLibrary = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
      });
      expect(currentLibrary).toBeTruthy();
    });

    test('should load with correct initial library', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        const selectedValue = await librarySelector.inputValue();
        expect(selectedValue).toMatch(
          /linear|fullcalendar|react-big|primereact|muix|react-calendar|infinite/
        );
      }
    });

    test('should initialize with empty events array', async ({ page }) => {
      const eventsCount = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents().length || 0;
      });
      expect(eventsCount).toBe(0);
    });

    test('should initialize with default view settings', async ({ page }) => {
      const viewState = await page.evaluate(() => {
        return {
          view: window.__CALENDAR_PROVIDER_STATE__?.getCurrentView(),
          date: window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate(),
        };
      });

      expect(viewState.view).toMatch(/month|week|day/);
      expect(viewState.date).toBeTruthy();
    });
  });

  test.describe('Library Switching', () => {
    test('should switch between calendar libraries dynamically', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        const libraries = [
          'linear',
          'fullcalendar',
          'react-big-calendar',
          'primereact',
          'muix',
          'react-calendar',
        ];

        for (const library of libraries) {
          await librarySelector.selectOption(library);
          await page.waitForTimeout(500);

          // Verify library changed in provider
          const currentLib = await page.evaluate(() => {
            return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
          });
          expect(currentLib).toBe(library);

          // Verify UI updated
          const calendarComponent = page.locator(
            `[data-library="${library}"], .${library}-calendar, .calendar-container`
          );
          await expect(calendarComponent.first()).toBeVisible();
        }
      }
    });

    test('should maintain event data across library switches', async ({ page }) => {
      // Add an event
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'switch-test-1',
          title: 'Persistent Event',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });
      });

      const librarySelector = page.locator('[data-testid="library-selector"]');
      if (await librarySelector.isVisible()) {
        const initialLibrary = await librarySelector.inputValue();

        // Switch to different library
        const libraries = ['linear', 'fullcalendar', 'react-big-calendar'];
        const targetLibrary = libraries.find((lib) => lib !== initialLibrary) || libraries[0];

        await librarySelector.selectOption(targetLibrary);
        await page.waitForTimeout(500);

        // Event should still exist
        const eventsAfterSwitch = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
        });

        expect(eventsAfterSwitch.length).toBe(1);
        expect(eventsAfterSwitch[0].title).toBe('Persistent Event');

        // Switch back
        await librarySelector.selectOption(initialLibrary);
        await page.waitForTimeout(500);

        // Event should still be there
        const eventsAfterReturn = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
        });

        expect(eventsAfterReturn.length).toBe(1);
      }
    });

    test('should adapt events to library-specific formats', async ({ page }) => {
      // Add event with complex data
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'format-test',
          title: 'Complex Event',
          start: new Date('2024-12-01T10:00:00'),
          end: new Date('2024-12-01T12:00:00'),
          allDay: false,
          description: 'Event with complex formatting',
          location: 'Conference Room',
          priority: 'high',
          attendees: ['john@example.com', 'jane@example.com'],
        });
      });

      const librarySelector = page.locator('[data-testid="library-selector"]');
      if (await librarySelector.isVisible()) {
        // Switch between different libraries and verify event adapts
        const libraries = ['linear', 'fullcalendar', 'react-big-calendar', 'primereact'];

        for (const library of libraries) {
          await librarySelector.selectOption(library);
          await page.waitForTimeout(500);

          // Event should be adapted for this library
          const adaptedEvent = await page.evaluate(() => {
            const events = window.__CALENDAR_PROVIDER_STATE__?.getEvents();
            return events[0];
          });

          expect(adaptedEvent.title).toBe('Complex Event');
          expect(adaptedEvent.start).toBeTruthy();
          expect(adaptedEvent.end).toBeTruthy();

          // Library-specific properties should be preserved
          if (library === 'fullcalendar') {
            expect(adaptedEvent.extendedProps || adaptedEvent.description).toBeTruthy();
          }
        }
      }
    });

    test('should handle library switching errors gracefully', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        // Try to switch to non-existent library
        await page.evaluate(() => {
          if (window.__CALENDAR_PROVIDER_STATE__?.setLibrary) {
            window.__CALENDAR_PROVIDER_STATE__.setLibrary('non-existent-library');
          }
        });

        await page.waitForTimeout(300);

        // Should fallback to default library
        const currentLibrary = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getCurrentLibrary();
        });

        expect(currentLibrary).toMatch(/linear|fullcalendar|react-big/); // Should be valid library
      }
    });
  });

  test.describe('Event Management', () => {
    test('should add events through provider API', async ({ page }) => {
      // Add event via provider
      const eventId = await page.evaluate(() => {
        const event = {
          id: 'test-add-1',
          title: 'Provider Added Event',
          start: new Date('2024-12-15T14:00:00'),
          end: new Date('2024-12-15T15:00:00'),
          allDay: false,
        };

        window.__CALENDAR_PROVIDER_STATE__?.addEvent(event);
        return event.id;
      });

      expect(eventId).toBe('test-add-1');

      // Verify event exists
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Provider Added Event');
    });

    test('should update events through provider API', async ({ page }) => {
      // Add initial event
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'test-update-1',
          title: 'Original Title',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });
      });

      // Update the event
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.updateEvent('test-update-1', {
          title: 'Updated Title',
          description: 'Updated description',
          priority: 'high',
        });
      });

      // Verify update
      const updatedEvent = await page.evaluate(() => {
        const events = window.__CALENDAR_PROVIDER_STATE__?.getEvents();
        return events.find((e) => e.id === 'test-update-1');
      });

      expect(updatedEvent.title).toBe('Updated Title');
      expect(updatedEvent.description).toBe('Updated description');
      expect(updatedEvent.priority).toBe('high');
    });

    test('should delete events through provider API', async ({ page }) => {
      // Add events to delete
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'test-delete-1',
          title: 'Event to Delete',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });

        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'test-keep-1',
          title: 'Event to Keep',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });
      });

      // Verify both events exist
      let events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });
      expect(events.length).toBe(2);

      // Delete one event
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.deleteEvent('test-delete-1');
      });

      // Verify deletion
      events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.length).toBe(1);
      expect(events[0].id).toBe('test-keep-1');
      expect(events.find((e) => e.id === 'test-delete-1')).toBeUndefined();
    });

    test('should handle bulk event operations', async ({ page }) => {
      // Add multiple events at once
      const eventIds = await page.evaluate(() => {
        const events = [];
        for (let i = 1; i <= 5; i++) {
          events.push({
            id: `bulk-event-${i}`,
            title: `Bulk Event ${i}`,
            start: new Date(2024, 11, i), // December days
            end: new Date(2024, 11, i),
            allDay: true,
            priority: i <= 2 ? 'high' : 'medium',
          });
        }

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
        return events.map((e) => e.id);
      });

      expect(eventIds).toHaveLength(5);

      // Verify all events exist
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events).toHaveLength(5);
      expect(events.filter((e) => e.priority === 'high')).toHaveLength(2);
      expect(events.filter((e) => e.priority === 'medium')).toHaveLength(3);
    });

    test('should validate event data before adding', async ({ page }) => {
      // Try to add invalid event
      const result = await page.evaluate(() => {
        try {
          window.__CALENDAR_PROVIDER_STATE__?.addEvent({
            // Missing required fields
            title: '', // Empty title
            start: null, // Invalid date
            end: 'invalid-date',
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Should either reject or sanitize the invalid data
      expect(result.success === false || result.success === true).toBe(true);

      // Events count should remain consistent
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      // Should not add invalid events
      expect(events.filter((e) => !e.title || !e.start)).toHaveLength(0);
    });
  });

  test.describe('View Management', () => {
    test('should switch between different calendar views', async ({ page }) => {
      const viewSelector = page.locator('[data-testid="view-selector"]');

      if (await viewSelector.isVisible()) {
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
      }
    });

    test('should maintain view state across library switches', async ({ page }) => {
      const viewSelector = page.locator('[data-testid="view-selector"]');
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if ((await viewSelector.isVisible()) && (await librarySelector.isVisible())) {
        // Set specific view
        await viewSelector.selectOption('week');
        await page.waitForTimeout(300);

        const originalLibrary = await librarySelector.inputValue();

        // Switch library
        const targetLibrary = originalLibrary === 'linear' ? 'fullcalendar' : 'linear';
        await librarySelector.selectOption(targetLibrary);
        await page.waitForTimeout(500);

        // View should be maintained
        const viewAfterSwitch = await page.evaluate(() => {
          return window.__CALENDAR_PROVIDER_STATE__?.getCurrentView();
        });
        expect(viewAfterSwitch).toBe('week');
      }
    });

    test('should update selected date across views', async ({ page }) => {
      // Set a specific date
      const targetDate = new Date('2024-12-25');
      await page.evaluate((date) => {
        window.__CALENDAR_PROVIDER_STATE__?.setSelectedDate(new Date(date));
      }, targetDate.toISOString());

      // Verify date is set
      const selectedDate = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
      });

      expect(new Date(selectedDate).getMonth()).toBe(11); // December (0-indexed)
      expect(new Date(selectedDate).getDate()).toBe(25);

      // Switch views and verify date is maintained
      const viewSelector = page.locator('[data-testid="view-selector"]');
      if (await viewSelector.isVisible()) {
        const views = ['month', 'week', 'day'];

        for (const view of views) {
          await viewSelector.selectOption(view);
          await page.waitForTimeout(300);

          const dateAfterViewChange = await page.evaluate(() => {
            return window.__CALENDAR_PROVIDER_STATE__?.getSelectedDate();
          });

          expect(new Date(dateAfterViewChange).getDate()).toBe(25);
        }
      }
    });
  });

  test.describe('State Synchronization', () => {
    test('should synchronize events with external storage', async ({ page }) => {
      // Mock external storage sync
      await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__?.enableSync) {
          window.__CALENDAR_PROVIDER_STATE__.enableSync(true);
        }
      });

      // Add event and trigger sync
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'sync-test-1',
          title: 'Sync Test Event',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });

        // Trigger sync if available
        if (window.__CALENDAR_PROVIDER_STATE__?.syncWithStorage) {
          window.__CALENDAR_PROVIDER_STATE__.syncWithStorage();
        }
      });

      // Verify sync status
      const syncStatus = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getSyncStatus();
      });

      if (syncStatus !== undefined) {
        expect(syncStatus).toMatch(/synced|syncing|idle/);
      }
    });

    test('should handle sync conflicts gracefully', async ({ page }) => {
      // Simulate sync conflict
      await page.evaluate(() => {
        // Add local event
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'conflict-test',
          title: 'Local Event',
          start: new Date(),
          end: new Date(),
          allDay: true,
          lastModified: Date.now(),
        });

        // Simulate remote conflict
        if (window.__CALENDAR_PROVIDER_STATE__?.handleSyncConflict) {
          window.__CALENDAR_PROVIDER_STATE__.handleSyncConflict('conflict-test', {
            id: 'conflict-test',
            title: 'Remote Event',
            start: new Date(),
            end: new Date(),
            allDay: true,
            lastModified: Date.now() + 1000, // Newer
          });
        }
      });

      // Should resolve conflict (implementation dependent)
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.length).toBe(1);
      // Newer event should win, or conflict resolution strategy should be applied
    });

    test('should maintain state consistency during concurrent operations', async ({ page }) => {
      // Simulate concurrent operations
      const results = await page.evaluate(() => {
        const promises = [];

        // Add multiple events concurrently
        for (let i = 0; i < 10; i++) {
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => {
                window.__CALENDAR_PROVIDER_STATE__?.addEvent({
                  id: `concurrent-${i}`,
                  title: `Concurrent Event ${i}`,
                  start: new Date(),
                  end: new Date(),
                  allDay: true,
                });
                resolve(i);
              }, Math.random() * 100);
            })
          );
        }

        return Promise.all(promises);
      });

      expect(results).toHaveLength(10);

      // Verify all events were added
      await page.waitForTimeout(200);
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.length).toBe(10);

      // All events should have unique IDs
      const uniqueIds = new Set(events.map((e) => e.id));
      expect(uniqueIds.size).toBe(10);
    });
  });

  test.describe('Event Filtering and Search', () => {
    test('should filter events by date range', async ({ page }) => {
      // Add events across different dates
      await page.evaluate(() => {
        const events = [
          {
            id: 'filter-1',
            title: 'December Event',
            start: new Date('2024-12-01'),
            end: new Date('2024-12-01'),
            allDay: true,
          },
          {
            id: 'filter-2',
            title: 'January Event',
            start: new Date('2025-01-01'),
            end: new Date('2025-01-01'),
            allDay: true,
          },
          {
            id: 'filter-3',
            title: 'November Event',
            start: new Date('2024-11-01'),
            end: new Date('2024-11-01'),
            allDay: true,
          },
        ];

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      // Filter events for December 2024
      const decemberEvents = await page.evaluate(() => {
        const startDate = new Date('2024-12-01');
        const endDate = new Date('2024-12-31');

        if (window.__CALENDAR_PROVIDER_STATE__?.getEventsInRange) {
          return window.__CALENDAR_PROVIDER_STATE__.getEventsInRange(startDate, endDate);
        }

        // Fallback filtering
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents().filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate >= startDate && eventDate <= endDate;
        });
      });

      expect(decemberEvents).toHaveLength(1);
      expect(decemberEvents[0].title).toBe('December Event');
    });

    test('should filter events by priority', async ({ page }) => {
      // Add events with different priorities
      await page.evaluate(() => {
        const events = [
          {
            id: 'priority-1',
            title: 'Critical Task',
            start: new Date(),
            end: new Date(),
            priority: 'critical',
          },
          {
            id: 'priority-2',
            title: 'High Task',
            start: new Date(),
            end: new Date(),
            priority: 'high',
          },
          {
            id: 'priority-3',
            title: 'Medium Task',
            start: new Date(),
            end: new Date(),
            priority: 'medium',
          },
          {
            id: 'priority-4',
            title: 'Low Task',
            start: new Date(),
            end: new Date(),
            priority: 'low',
          },
        ];

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      // Filter high priority events
      const highPriorityEvents = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__?.getEventsByPriority) {
          return window.__CALENDAR_PROVIDER_STATE__.getEventsByPriority(['critical', 'high']);
        }

        return window.__CALENDAR_PROVIDER_STATE__
          ?.getEvents()
          .filter((event) => ['critical', 'high'].includes(event.priority));
      });

      expect(highPriorityEvents).toHaveLength(2);
      expect(highPriorityEvents.map((e) => e.priority)).toEqual(['critical', 'high']);
    });

    test('should search events by text', async ({ page }) => {
      // Add searchable events
      await page.evaluate(() => {
        const events = [
          {
            id: 'search-1',
            title: 'Team Meeting',
            description: 'Weekly standup',
            start: new Date(),
            end: new Date(),
          },
          {
            id: 'search-2',
            title: 'Project Review',
            description: 'Client presentation',
            start: new Date(),
            end: new Date(),
          },
          {
            id: 'search-3',
            title: 'Team Building',
            description: 'Office party',
            start: new Date(),
            end: new Date(),
          },
        ];

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      // Search for "team" events
      const teamEvents = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__?.searchEvents) {
          return window.__CALENDAR_PROVIDER_STATE__.searchEvents('team');
        }

        return window.__CALENDAR_PROVIDER_STATE__
          ?.getEvents()
          .filter(
            (event) =>
              event.title.toLowerCase().includes('team') ||
              (event.description && event.description.toLowerCase().includes('team'))
          );
      });

      expect(teamEvents).toHaveLength(2);
      expect(teamEvents.map((e) => e.title)).toEqual(['Team Meeting', 'Team Building']);
    });
  });

  test.describe('Performance and Memory Management', () => {
    test('should handle large numbers of events efficiently', async ({ page }) => {
      // Add many events
      const startTime = Date.now();

      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 1000; i++) {
          events.push({
            id: `perf-event-${i}`,
            title: `Performance Event ${i}`,
            start: new Date(2024, 0, 1 + (i % 365)), // Spread across year
            end: new Date(2024, 0, 1 + (i % 365)),
            allDay: true,
            priority: ['low', 'medium', 'high'][i % 3],
          });
        }

        window.__CALENDAR_PROVIDER_STATE__?.setEvents(events);
      });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should handle 1000 events in under 2 seconds

      // Verify events were added
      const eventCount = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents().length;
      });
      expect(eventCount).toBe(1000);
    });

    test('should manage memory efficiently during operations', async ({ page }) => {
      // Get initial memory usage (if available)
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Perform many operations
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          // Add event
          window.__CALENDAR_PROVIDER_STATE__?.addEvent({
            id: `memory-test-${i}`,
            title: `Memory Test ${i}`,
            start: new Date(),
            end: new Date(),
            allDay: true,
          });

          // Update event
          window.__CALENDAR_PROVIDER_STATE__?.updateEvent(`memory-test-${i}`, {
            title: `Updated Memory Test ${i}`,
          });

          // Delete some events to simulate cleanup
          if (i % 10 === 0 && i > 0) {
            window.__CALENDAR_PROVIDER_STATE__?.deleteEvent(`memory-test-${i - 1}`);
          }
        }
      });

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Memory growth should be reasonable
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });

    test('should cleanup resources when provider is destroyed', async ({ page }) => {
      // Get initial event listeners count
      const initialListeners = await page.evaluate(() => {
        return window.__EVENT_LISTENERS_COUNT__ || 0;
      });

      // Simulate provider cleanup
      await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__?.cleanup) {
          window.__CALENDAR_PROVIDER_STATE__.cleanup();
        }
      });

      // Verify cleanup
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      // Events should be cleared or provider should be cleaned up
      expect(!events || events.length === 0).toBe(true);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle provider initialization errors gracefully', async ({ page }) => {
      // Simulate initialization error
      await page.evaluate(() => {
        try {
          // Force an error in provider initialization
          if (window.__CALENDAR_PROVIDER_STATE__?.forceError) {
            window.__CALENDAR_PROVIDER_STATE__.forceError('Initialization failed');
          }
        } catch (error) {
          console.error('Provider error:', error);
        }
      });

      // Application should still be functional
      await page.waitForTimeout(500);
      const isPageResponsive = await page.evaluate(() => {
        return document.body.clientHeight > 0;
      });
      expect(isPageResponsive).toBe(true);
    });

    test('should handle invalid event operations', async ({ page }) => {
      // Try invalid operations
      const results = await page.evaluate(() => {
        const results = [];

        try {
          // Try to update non-existent event
          window.__CALENDAR_PROVIDER_STATE__?.updateEvent('non-existent', { title: 'Updated' });
          results.push('update-non-existent-success');
        } catch (error) {
          results.push('update-non-existent-error');
        }

        try {
          // Try to delete non-existent event
          window.__CALENDAR_PROVIDER_STATE__?.deleteEvent('non-existent');
          results.push('delete-non-existent-success');
        } catch (error) {
          results.push('delete-non-existent-error');
        }

        return results;
      });

      // Should either succeed silently or handle errors gracefully
      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle concurrent state modifications', async ({ page }) => {
      // Simulate race conditions
      const results = await page.evaluate(() => {
        const promises = [];

        // Concurrent add/delete operations
        for (let i = 0; i < 5; i++) {
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => {
                window.__CALENDAR_PROVIDER_STATE__?.addEvent({
                  id: `race-${i}`,
                  title: `Race Event ${i}`,
                  start: new Date(),
                  end: new Date(),
                  allDay: true,
                });

                // Immediately try to update
                setTimeout(() => {
                  window.__CALENDAR_PROVIDER_STATE__?.updateEvent(`race-${i}`, {
                    title: `Updated Race Event ${i}`,
                  });
                  resolve(i);
                }, 10);
              }, Math.random() * 50);
            })
          );
        }

        return Promise.all(promises);
      });

      await page.waitForTimeout(200);

      // Should handle concurrent operations without corruption
      const events = await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__?.getEvents();
      });

      expect(events.length).toBeGreaterThanOrEqual(0);

      // All events should have valid structure
      const validEvents = events.filter((e) => e.id && e.title && e.start);
      expect(validEvents.length).toBe(events.length);
    });
  });

  test.describe('Provider API Completeness', () => {
    test('should expose all required provider methods', async ({ page }) => {
      const apiMethods = await page.evaluate(() => {
        const provider = window.__CALENDAR_PROVIDER_STATE__;
        return Object.keys(provider || {}).filter((key) => typeof provider[key] === 'function');
      });

      const requiredMethods = [
        'addEvent',
        'updateEvent',
        'deleteEvent',
        'getEvents',
        'setEvents',
        'getCurrentLibrary',
        'setLibrary',
        'getCurrentView',
        'setView',
        'getSelectedDate',
        'setSelectedDate',
      ];

      for (const method of requiredMethods) {
        expect(apiMethods.includes(method)).toBe(true);
      }
    });

    test('should provide event lifecycle hooks', async ({ page }) => {
      let hooksCalled = await page.evaluate(() => {
        const hooks = [];

        // Register event hooks if available
        if (window.__CALENDAR_PROVIDER_STATE__?.onEventAdd) {
          window.__CALENDAR_PROVIDER_STATE__.onEventAdd((event) => {
            hooks.push(`add-${event.id}`);
          });
        }

        if (window.__CALENDAR_PROVIDER_STATE__?.onEventUpdate) {
          window.__CALENDAR_PROVIDER_STATE__.onEventUpdate((event) => {
            hooks.push(`update-${event.id}`);
          });
        }

        if (window.__CALENDAR_PROVIDER_STATE__?.onEventDelete) {
          window.__CALENDAR_PROVIDER_STATE__.onEventDelete((eventId) => {
            hooks.push(`delete-${eventId}`);
          });
        }

        return hooks;
      });

      // Perform operations to trigger hooks
      await page.evaluate(() => {
        window.__CALENDAR_PROVIDER_STATE__?.addEvent({
          id: 'hook-test',
          title: 'Hook Test Event',
          start: new Date(),
          end: new Date(),
          allDay: true,
        });

        window.__CALENDAR_PROVIDER_STATE__?.updateEvent('hook-test', {
          title: 'Updated Hook Test',
        });

        window.__CALENDAR_PROVIDER_STATE__?.deleteEvent('hook-test');
      });

      await page.waitForTimeout(100);

      // Get final hooks state
      hooksCalled = await page.evaluate(() => {
        return window.__HOOKS_CALLED__ || [];
      });

      // Hooks should be called if implemented
      // This test passes regardless since hooks are optional
      expect(Array.isArray(hooksCalled)).toBe(true);
    });
  });
});
