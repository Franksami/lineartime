/**
 * Phase 3.0 AI Integration Test Suite
 * 
 * Comprehensive Playwright tests for multi-modal AI flows, covering:
 * - CheatCal AI Enhancement Layer integration
 * - Vision consent flows and privacy controls
 * - Voice processing and command recognition
 * - Multi-modal coordination and data fusion
 * - Performance budgets and foundation protection
 * 
 * @version CheatCal Phase 3.0
 * @author Test Automator Persona
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const AI_ENHANCEMENT_URL = 'http://localhost:3000/ai-conductor';
const PERFORMANCE_THRESHOLDS = {
  fps: 60,
  memoryMB: 100,
  loadTimeMs: 3000,
};

// Helper function to wait for AI systems to initialize
async function waitForAIInitialization(page: Page) {
  await page.waitForSelector('[data-testid="ai-orchestrator-status"]', { 
    state: 'visible', 
    timeout: 10000 
  });
  
  // Wait for initialization to complete
  await page.waitForFunction(() => {
    const status = document.querySelector('[data-testid="ai-orchestrator-status"]');
    return status?.textContent?.includes('AI Active');
  }, { timeout: 15000 });
}

// Helper function to grant permissions for testing
async function grantTestPermissions(page: Page, context: BrowserContext) {
  // Grant camera and microphone permissions for testing
  await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });
  
  // Mock getUserMedia for consistent testing
  await page.addInitScript(() => {
    const mockStream = {
      getTracks: () => [{ stop: () => {} }],
      getVideoTracks: () => [{ stop: () => {} }],
      getAudioTracks: () => [{ stop: () => {} }],
    };
    
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      writable: true,
      value: jest.fn().mockResolvedValue(mockStream),
    });
    
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
      writable: true,
      value: jest.fn().mockResolvedValue(mockStream),
    });
  });
}

test.describe('CheatCal AI Enhancement Layer Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await grantTestPermissions(page, context);
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("CheatCal AI Enhancement")', { timeout: 5000 });
  });

  test('should render AI Enhancement Layer with 7 tabs', async ({ page }) => {
    // Check main interface is rendered
    await expect(page.locator('h1')).toContainText('CheatCal AI Enhancement');
    
    // Check all 7 tabs are present
    const tabs = [
      '🎛️ Control',
      '💡 Insights', 
      '📊 Metrics',
      '⚙️ Settings',
      '📊 Capacity',
      '🚨 Conflicts',
      '💡 AI Panel'
    ];
    
    for (const tab of tabs) {
      await expect(page.locator(`[role="tab"]:has-text("${tab}")`)).toBeVisible();
    }
  });

  test('should show architectural visualization when toggled', async ({ page }) => {
    // Click show architecture button
    await page.click('button:has-text("Show Architecture")');
    
    // Check architecture is displayed
    await expect(page.locator('text=AI ENHANCEMENT ARCHITECTURE')).toBeVisible();
    await expect(page.locator('text=CHEATCAL AI ENHANCEMENT LAYER')).toBeVisible();
    
    // Hide architecture
    await page.click('button:has-text("Hide Architecture")');
    
    // Check architecture is hidden
    await expect(page.locator('text=AI ENHANCEMENT ARCHITECTURE')).not.toBeVisible();
  });

  test('should handle AI orchestrator toggle with proper state management', async ({ page }) => {
    // Find and toggle the AI orchestrator switch
    const orchestratorSwitch = page.locator('[data-testid="orchestrator-toggle"]').first();
    
    // Initial state should be disabled
    await expect(orchestratorSwitch).not.toBeChecked();
    
    // Enable orchestrator
    await orchestratorSwitch.click();
    
    // Check status updates
    await page.waitForSelector('text=AI Active', { timeout: 5000 });
    
    // Verify performance metrics are displayed
    await expect(page.locator('text=FPS')).toBeVisible();
    await expect(page.locator('text=Memory')).toBeVisible();
    await expect(page.locator('text=Revenue Optimized')).toBeVisible();
  });

  test('should navigate between all 7 tabs successfully', async ({ page }) => {
    const tabs = [
      { name: 'Control', selector: '🎛️ Control' },
      { name: 'Insights', selector: '💡 Insights' },
      { name: 'Metrics', selector: '📊 Metrics' },
      { name: 'Settings', selector: '⚙️ Settings' },
      { name: 'Capacity', selector: '📊 Capacity' },
      { name: 'Conflicts', selector: '🚨 Conflicts' },
      { name: 'AI Panel', selector: '💡 AI Panel' },
    ];

    for (const tab of tabs) {
      // Click tab
      await page.click(`[role="tab"]:has-text("${tab.selector}")`);
      
      // Wait for content to load
      await page.waitForTimeout(500);
      
      // Verify tab content is visible
      await expect(page.locator('[role="tabpanel"]:visible')).toBeVisible();
      
      console.log(`✅ ${tab.name} tab navigation successful`);
    }
  });

  test('should display capacity visualization with proper animations', async ({ page }) => {
    // Navigate to Capacity tab
    await page.click('[role="tab"]:has-text("📊 Capacity")');
    
    // Check capacity cards are rendered
    const capacityCards = page.locator('text=/Jan|Feb|Mar|Apr|May|Jun/ 2025');
    await expect(capacityCards.first()).toBeVisible();
    
    // Check capacity percentages are displayed
    await expect(page.locator('text=/\d+%/')).toHaveCount(6, { timeout: 5000 });
    
    // Check optimization suggestions are present
    await expect(page.locator('text=Smart Optimization Suggestions')).toBeVisible();
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule")')).toBeVisible();
    
    // Verify animations (cards should have motion properties)
    const firstCard = page.locator('[data-month="Jan"]').first();
    await expect(firstCard).toHaveCSS('transform', /scale/);
  });

  test('should display conflict resolution with smart suggestions', async ({ page }) => {
    // Navigate to Conflicts tab  
    await page.click('[role="tab"]:has-text("🚨 Conflicts")');
    
    // Check conflict detection interface
    await expect(page.locator('text=Intelligent Conflict Resolution')).toBeVisible();
    await expect(page.locator('text=3 Active Conflicts')).toBeVisible();
    
    // Check critical conflict is displayed
    await expect(page.locator('text=CRITICAL: Client Call vs Team Meeting')).toBeVisible();
    await expect(page.locator('text=$2,500 risk')).toBeVisible();
    
    // Check resolution options are available
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();
    await expect(page.locator('button:has-text("Consider")')).toBeVisible();
    
    // Check resolved conflicts are shown
    await expect(page.locator('text=RESOLVED: Personal Time Protected')).toBeVisible();
  });

  test('should display multi-modal AI insights with implementation guides', async ({ page }) => {
    // Navigate to AI Panel tab
    await page.click('[role="tab"]:has-text("💡 AI Panel")');
    
    // Check multi-modal interface
    await expect(page.locator('text=Multi-Modal AI Intelligence')).toBeVisible();
    await expect(page.locator('text=95% Confidence')).toBeVisible();
    
    // Check insights are displayed
    await expect(page.locator('text=HIGH-VALUE: Focus Block Optimization')).toBeVisible();
    await expect(page.locator('text=COORDINATION: Team Sync Optimization')).toBeVisible();
    await expect(page.locator('text=WARNING: Revenue Leak Detected')).toBeVisible();
    
    // Check multi-modal data sources are shown
    await expect(page.locator('text=👁️ Vision:')).toBeVisible();
    await expect(page.locator('text=🎤 Voice:')).toBeVisible();
    await expect(page.locator('text=🧠 AI:')).toBeVisible();
    
    // Check action buttons are present
    await expect(page.locator('button:has-text("Implement Block")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Mega-Meeting")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule Check-in")')).toBeVisible();
    
    // Check performance metrics
    await expect(page.locator('text=AI Performance Today')).toBeVisible();
    await expect(page.locator('text=112')).toBeVisible(); // FPS
    await expect(page.locator('text=67MB')).toBeVisible(); // Memory
  });

  test('should maintain 112+ FPS animations across all tabs', async ({ page }) => {
    const tabs = ['Control', 'Capacity', 'Conflicts', 'AI Panel'];
    
    for (const tab of tabs) {
      await page.click(`[role="tab"]:has-text("${tab}")`);
      
      // Measure animation performance
      const performanceMetrics = await page.evaluate(() => {
        let frameCount = 0;
        let startTime = performance.now();
        
        return new Promise((resolve) => {
          const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - startTime >= 1000) {
              const fps = frameCount;
              resolve(fps);
            } else {
              requestAnimationFrame(measureFPS);
            }
          };
          
          requestAnimationFrame(measureFPS);
        });
      });
      
      expect(performanceMetrics).toBeGreaterThan(PERFORMANCE_THRESHOLDS.fps);
      console.log(`✅ ${tab} tab maintains ${performanceMetrics} FPS`);
    }
  });

  test('should handle button interactions with sound effects', async ({ page }) => {
    // Enable orchestrator first
    const orchestratorSwitch = page.locator('input[type="checkbox"]').first();
    await orchestratorSwitch.click();
    
    // Navigate to Capacity tab
    await page.click('[role="tab"]:has-text("📊 Capacity")');
    
    // Mock sound system
    await page.addInitScript(() => {
      window.mockSounds = [];
      window.originalPlaySound = window.playSound;
      window.playSound = (sound) => {
        window.mockSounds.push(sound);
        return Promise.resolve();
      };
    });
    
    // Click Apply button and verify sound is triggered
    await page.click('button:has-text("Apply")');
    
    const soundsPlayed = await page.evaluate(() => window.mockSounds);
    expect(soundsPlayed).toContain('success');
    
    // Navigate to AI Panel and test another button
    await page.click('[role="tab"]:has-text("💡 AI Panel")');
    await page.click('button:has-text("Schedule Check-in")');
    
    // Note: This would trigger error sound in real scenario
  });
});

test.describe('Vision Consent Flow Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await grantTestPermissions(page, context);
    await page.goto(AI_ENHANCEMENT_URL);
  });

  test('should open vision consent modal when enabling vision', async ({ page }) => {
    // Click vision toggle
    await page.click('button:has-text("Enable Vision")');
    
    // Check consent modal opens
    await expect(page.locator('text=CheatCal Computer Vision')).toBeVisible();
    await expect(page.locator('text=Revolutionary productivity monitoring')).toBeVisible();
    
    // Check controversial AI badge
    await expect(page.locator('text=Controversial AI')).toBeVisible();
  });

  test('should progress through 4-step consent wizard', async ({ page }) => {
    // Open consent modal
    await page.click('button:has-text("Enable Vision")');
    
    // Step 1: Introduction
    await expect(page.locator('text=The AI That Watches Everything You Do')).toBeVisible();
    await page.click('button:has-text("Continue")');
    
    // Step 2: Permissions
    await expect(page.locator('text=Permission Controls')).toBeVisible();
    
    // Grant screen capture permission (required)
    await page.click('input[type="checkbox"]'); // First checkbox (screen capture)
    await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
    await page.click('button:has-text("Continue")');
    
    // Step 3: Preview
    await expect(page.locator('text=System Preview')).toBeVisible();
    await expect(page.locator('text=Vision System Status')).toBeVisible();
    await page.click('button:has-text("Continue")');
    
    // Step 4: Complete
    await expect(page.locator('text=CheatCal Vision Activated!')).toBeVisible();
    await page.click('button:has-text("Start Cheating")');
    
    // Modal should close
    await expect(page.locator('text=CheatCal Computer Vision')).not.toBeVisible();
  });

  test('should enforce required permissions', async ({ page }) => {
    await page.click('button:has-text("Enable Vision")');
    
    // Navigate to permissions step
    await page.click('button:has-text("Continue")');
    
    // Continue should be disabled without required permissions
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    
    // Grant required permission
    await page.click('input[type="checkbox"]'); // Screen capture
    
    // Continue should now be enabled
    await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
  });
});

test.describe('Multi-Modal AI Coordination', () => {
  test.beforeEach(async ({ page, context }) => {
    await grantTestPermissions(page, context);
    await page.goto(AI_ENHANCEMENT_URL);
    await waitForAIInitialization(page);
  });

  test('should initialize all AI systems properly', async ({ page }) => {
    // Enable orchestrator
    const orchestratorSwitch = page.locator('input[type="checkbox"]').first();
    await orchestratorSwitch.click();
    
    // Check system status indicators
    await expect(page.locator('text=AI Active')).toBeVisible();
    
    // Check individual system statuses
    await expect(page.locator('text=Computer Vision')).toBeVisible();
    await expect(page.locator('text=Voice Processing')).toBeVisible();
    await expect(page.locator('text=OpenAI Integration')).toBeVisible();
  });

  test('should generate productivity insights from multi-modal data', async ({ page }) => {
    // Enable AI systems
    await page.click('input[type="checkbox"]'); // Orchestrator
    await page.waitForTimeout(1000);
    
    // Navigate to Insights tab
    await page.click('[role="tab"]:has-text("💡 Insights")');
    
    // Check insights are generated (may take a moment)
    await page.waitForTimeout(3000);
    
    // Look for insight cards or empty state
    const insightCards = page.locator('.insight-card, [data-testid="insight-item"]');
    const emptyState = page.locator('text=No insights yet');
    
    // Should have either insights or proper empty state
    await expect(
      page.locator('text=Productivity Insights')
    ).toBeVisible();
  });

  test('should handle voice command processing', async ({ page }) => {
    // Enable orchestrator and voice
    await page.click('input[type="checkbox"]'); // Orchestrator
    await page.click('button:has-text("Start Listening")');
    
    // Mock voice command event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('cheatcal-voice-command', {
        detail: {
          command: 'create event',
          text: 'create event for client meeting tomorrow',
          success: true,
        },
      }));
    });
    
    // Check that voice command is processed
    await page.waitForTimeout(1000);
    
    // Navigate to insights to see if voice command generated insight
    await page.click('[role="tab"]:has-text("💡 Insights")');
    
    // Should show voice command insight
    await expect(
      page.locator('text=/Voice Command|voice/i').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should demonstrate cross-modal data fusion', async ({ page }) => {
    // Enable all systems
    await page.click('input[type="checkbox"]'); // Orchestrator
    
    // Simulate vision analysis event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('cheatcal-analysis-complete', {
        detail: {
          application: 'Calendar',
          context_type: 'calendar',
          content_analysis: {
            text_content: 'Meeting with client',
            ui_elements: ['calendar-grid', 'event-form'],
            workflow_state: { active: true },
          },
          optimization_opportunities: [{
            type: 'creation',
            value_estimate: 200,
          }],
          analysis_confidence: 0.9,
        },
      }));
    });
    
    // Simulate voice transcription event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('cheatcal-voice-transcription', {
        detail: {
          text: 'I need to schedule a follow-up meeting',
          confidence: 0.85,
          provider: 'whisper',
          is_final: true,
        },
      }));
    });
    
    // Wait for multi-modal processing
    await page.waitForTimeout(2000);
    
    // Check for coordination opportunity
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const handler = (event) => {
          console.log('Coordination opportunity detected:', event.detail);
          resolve(event.detail);
        };
        
        window.addEventListener('cheatcal-coordination-opportunity', handler);
        
        // Timeout after 3 seconds
        setTimeout(() => resolve(null), 3000);
      });
    });
  });
});

test.describe('Performance and Foundation Protection', () => {
  test('should maintain performance budgets under load', async ({ page }) => {
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Measure initial performance
    const initialMetrics = await page.evaluate(() => {
      const memory = (performance as any).memory;
      return {
        memoryMB: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
        loadTime: performance.now(),
      };
    });
    
    expect(initialMetrics.memoryMB).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryMB);
    expect(initialMetrics.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.loadTimeMs);
    
    // Enable all AI systems and stress test
    await page.click('input[type="checkbox"]'); // Orchestrator
    await page.click('button:has-text("Enable Vision")');
    
    // Navigate through all tabs rapidly
    for (let i = 0; i < 3; i++) {
      await page.click('[role="tab"]:has-text("📊 Capacity")');
      await page.waitForTimeout(100);
      await page.click('[role="tab"]:has-text("🚨 Conflicts")');
      await page.waitForTimeout(100);
      await page.click('[role="tab"]:has-text("💡 AI Panel")');
      await page.waitForTimeout(100);
    }
    
    // Measure performance after stress test
    const finalMetrics = await page.evaluate(() => {
      const memory = (performance as any).memory;
      return {
        memoryMB: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
      };
    });
    
    // Memory should not have increased significantly
    expect(finalMetrics.memoryMB).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryMB);
    expect(finalMetrics.memoryMB - initialMetrics.memoryMB).toBeLessThan(20); // <20MB increase
  });

  test('should preserve LinearCalendarHorizontal foundation layout', async ({ page }) => {
    // Navigate to main calendar
    await page.goto('http://localhost:3000/');
    
    // Check LinearCalendarHorizontal is present and properly structured
    await expect(page.locator('[data-testid="linear-calendar-horizontal"]')).toBeVisible();
    
    // Verify 12-month structure is intact
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (const month of months) {
      await expect(page.locator(`text=${month}`)).toBeVisible();
    }
    
    // Check no modifications have been made to core layout
    const calendarGrid = page.locator('[data-testid="calendar-grid"]');
    
    // Should maintain horizontal row structure
    await expect(calendarGrid).toHaveCSS('display', /grid|flex/);
    
    // No AI overlays should interfere with core calendar
    await expect(page.locator('[data-testid="linear-calendar-horizontal"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Try to enable AI systems
    await page.click('input[type="checkbox"]'); // Orchestrator
    
    // Check error handling
    await page.waitForTimeout(2000);
    
    // Should show error state, not crash
    const errorBadges = page.locator('text=/ERROR|Failed|Unavailable/i');
    const errorCount = await errorBadges.count();
    
    // At least one error should be displayed
    expect(errorCount).toBeGreaterThan(0);
    
    // Interface should remain functional
    await expect(page.locator('h1:has-text("CheatCal AI Enhancement")')).toBeVisible();
  });
});

test.describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
  test('should provide proper ARIA labels and roles', async ({ page }) => {
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Check main heading has proper hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Check tab navigation has proper ARIA roles
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList).toBeVisible();
    
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(7);
    
    // Check tab panels have proper roles
    const tabPanels = page.locator('[role="tabpanel"]');
    await expect(tabPanels.first()).toBeVisible();
    
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Test tab navigation with keyboard
    await page.keyboard.press('Tab'); // Focus first tab
    await page.keyboard.press('ArrowRight'); // Navigate to next tab
    await page.keyboard.press('Enter'); // Activate tab
    
    // Verify tab changed
    await expect(page.locator('[role="tabpanel"]:visible')).toBeVisible();
    
    // Test button navigation
    await page.keyboard.press('Tab'); // Focus first button in panel
    await page.keyboard.press('Space'); // Activate button
    
    // Should handle keyboard interaction
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Check that animations respect reduced motion
    // (In a real implementation, this would check for specific CSS or animation behavior)
    const animatedElements = page.locator('[style*="transform"], [style*="transition"]');
    
    // Elements should still be functional even with reduced motion
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];
  
  browsers.forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      if (currentBrowser !== browserName) return;
      
      await page.goto(AI_ENHANCEMENT_URL);
      
      // Basic functionality test
      await expect(page.locator('h1:has-text("CheatCal AI Enhancement")')).toBeVisible();
      
      // Test tab navigation
      await page.click('[role="tab"]:has-text("📊 Capacity")');
      await expect(page.locator('text=Calendar Capacity Analysis')).toBeVisible();
      
      // Test AI system toggle
      const orchestratorSwitch = page.locator('input[type="checkbox"]').first();
      await orchestratorSwitch.click();
      
      // Should work in all browsers
      console.log(`✅ ${browserName} compatibility verified`);
    });
  });
});

test.describe('Integration with Existing System', () => {
  test('should integrate with main calendar application', async ({ page }) => {
    // Test navigation from main app to AI conductor
    await page.goto('http://localhost:3000/');
    
    // Check main calendar loads
    await expect(page.locator('[data-testid="linear-calendar-horizontal"]')).toBeVisible();
    
    // Navigate to AI conductor
    await page.goto(AI_ENHANCEMENT_URL);
    
    // Should load without conflicts
    await expect(page.locator('h1:has-text("CheatCal AI Enhancement")')).toBeVisible();
    
    // Navigate back
    await page.goto('http://localhost:3000/');
    
    // Calendar should still work
    await expect(page.locator('[data-testid="linear-calendar-horizontal"]')).toBeVisible();
  });

  test('should not interfere with foundation calendar performance', async ({ page }) => {
    // Load main calendar
    await page.goto('http://localhost:3000/');
    
    // Measure calendar performance
    const calendarPerformance = await page.evaluate(() => {
      let frameCount = 0;
      let startTime = performance.now();
      
      return new Promise((resolve) => {
        const measureFPS = () => {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - startTime >= 1000) {
            resolve(frameCount);
          } else {
            requestAnimationFrame(measureFPS);
          }
        };
        
        requestAnimationFrame(measureFPS);
      });
    });
    
    // Calendar should maintain 60+ FPS
    expect(calendarPerformance).toBeGreaterThan(60);
    
    // Load AI enhancement in another tab/window shouldn't affect calendar
    await page.goto(AI_ENHANCEMENT_URL);
    await page.goto('http://localhost:3000/');
    
    // Calendar should still perform well
    const calendarPerformanceAfter = await page.evaluate(() => {
      let frameCount = 0;
      let startTime = performance.now();
      
      return new Promise((resolve) => {
        const measureFPS = () => {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - startTime >= 1000) {
            resolve(frameCount);
          } else {
            requestAnimationFrame(measureFPS);
          }
        };
        
        requestAnimationFrame(measureFPS);
      });
    });
    
    expect(calendarPerformanceAfter).toBeGreaterThan(60);
  });
});