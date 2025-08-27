import { test, expect } from '@playwright/test';

test.describe('Phase 6.1.1 Market Validation Research Infrastructure', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the market validation dashboard
    await page.goto('/market-validation');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('Market Validation Dashboard loads correctly', async ({ page }) => {
    // Check that the main navigation is present
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    await expect(page.getByText('Market Validation Dashboard')).toBeVisible();
    await expect(page.getByText('Phase 6.1 Research')).toBeVisible();
    await expect(page.getByText('Validation Active')).toBeVisible();
  });

  test('ASCII Charts Section displays properly', async ({ page }) => {
    // Check for the main charts section heading
    await expect(page.getByText('Market Research Visualizations')).toBeVisible();
    
    // Verify all four ASCII charts are displayed
    await expect(page.getByText('Adoption Trends Analysis')).toBeVisible();
    await expect(page.getByText('User Segment Analysis')).toBeVisible(); 
    await expect(page.getByText('Competitive Position')).toBeVisible();
    await expect(page.getByText('Hypothesis Validation')).toBeVisible();
    
    // Check for ASCII chart content
    await expect(page.locator('pre').first()).toContainText('HORIZONTAL TIMELINE ADOPTION TRENDS');
    await expect(page.locator('pre')).toContainText('USER SEGMENT PERFORMANCE COMPARISON');
    await expect(page.locator('pre')).toContainText('COMPETITIVE POSITIONING MATRIX');
    await expect(page.locator('pre')).toContainText('LIFE IS BIGGER THAN A WEEK');
  });

  test('Interactive Research Analytics Tab System works', async ({ page }) => {
    // Check that the tabs section is visible
    await expect(page.getByText('Interactive Research Analytics')).toBeVisible();
    
    // Test Timeline Analytics tab (should be active by default)
    await expect(page.getByRole('tab', { name: /timeline analytics/i })).toHaveAttribute('data-state', 'active');
    
    // Test A/B Testing tab
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    await expect(page.getByRole('tab', { name: /a\/b testing/i })).toHaveAttribute('data-state', 'active');
    
    // Verify tab content switching works
    await page.getByRole('tab', { name: /timeline analytics/i }).click();
    await expect(page.getByRole('tab', { name: /timeline analytics/i })).toHaveAttribute('data-state', 'active');
  });

  test('HorizontalTimelineAnalytics component renders', async ({ page }) => {
    // Navigate to Timeline Analytics tab if not already active
    await page.getByRole('tab', { name: /timeline analytics/i }).click();
    
    // Check for key elements from the HorizontalTimelineAnalytics component
    await expect(page.getByText('Horizontal Timeline Research')).toBeVisible();
    await expect(page.getByText('Validating "Life is bigger than a week" hypothesis')).toBeVisible();
    await expect(page.getByText('Market Validation Phase')).toBeVisible();
    
    // Check for key metrics cards
    await expect(page.getByText('Horizontal Adoption')).toBeVisible();
    await expect(page.getByText('User Satisfaction')).toBeVisible();
    await expect(page.getByText('Event Creation Rate')).toBeVisible();
    await expect(page.getByText('Session Time Improvement')).toBeVisible();
    
    // Verify tabs within the analytics component
    await expect(page.getByRole('tab', { name: /adoption/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /segments/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /validation/i })).toBeVisible();
  });

  test('ABTestingFramework component renders', async ({ page }) => {
    // Navigate to A/B Testing tab
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    
    // Check for key elements from the ABTestingFramework component
    await expect(page.getByText('A/B Testing Framework')).toBeVisible();
    await expect(page.getByText('Horizontal Timeline vs Traditional Calendar Views')).toBeVisible();
    
    // Check for stats cards
    await expect(page.getByText('Active Tests')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Timeline Win Rate')).toBeVisible();
    
    // Check for test selection buttons
    await expect(page.getByText('Horizontal Timeline vs Month View')).toBeVisible();
    await expect(page.getByText('Onboarding Flow Comparison')).toBeVisible();
    await expect(page.getByText('Pricing Page Timeline Showcase')).toBeVisible();
  });

  test('Strategic Validation Summary displays correctly', async ({ page }) => {
    // Scroll to the Strategic Validation Summary section
    await page.locator('text=Strategic Validation Summary').scrollIntoViewIfNeeded();
    
    // Check for the summary card
    await expect(page.getByText('Strategic Validation Summary')).toBeVisible();
    
    // Check for the three columns
    await expect(page.getByText('✅ Validated Strengths')).toBeVisible();
    await expect(page.getByText('⚠️ Areas for Improvement')).toBeVisible(); 
    await expect(page.getByText('🚀 Recommended Actions')).toBeVisible();
    
    // Check for the validation outcome
    await expect(page.getByText('✅ VALIDATION OUTCOME: Proceed with Horizontal Timeline')).toBeVisible();
    await expect(page.getByText('Strong evidence supports horizontal timeline')).toBeVisible();
  });

  test('Refresh functionality works in Timeline Analytics', async ({ page }) => {
    // Navigate to Timeline Analytics tab
    await page.getByRole('tab', { name: /timeline analytics/i }).click();
    
    // Find and click the refresh button
    const refreshButton = page.getByRole('button', { name: /refresh data/i });
    await expect(refreshButton).toBeVisible();
    
    // Click refresh and verify it doesn't cause errors
    await refreshButton.click();
    
    // Verify the page is still functional after refresh
    await expect(page.getByText('Horizontal Timeline Research')).toBeVisible();
  });

  test('A/B Testing Framework tab navigation works', async ({ page }) => {
    // Navigate to A/B Testing tab
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    
    // Test navigation between different A/B test views
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /results/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /trends/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /insights/i })).toBeVisible();
    
    // Test clicking different tabs
    await page.getByRole('tab', { name: /results/i }).click();
    await expect(page.getByRole('tab', { name: /results/i })).toHaveAttribute('data-state', 'active');
    
    await page.getByRole('tab', { name: /trends/i }).click();
    await expect(page.getByRole('tab', { name: /trends/i })).toHaveAttribute('data-state', 'active');
  });

  test('Page is mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify main elements are still visible and accessible
    await expect(page.getByText('Market Validation Dashboard')).toBeVisible();
    await expect(page.getByText('Market Research Visualizations')).toBeVisible();
    
    // Test that tabs are still functional on mobile
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    await expect(page.getByText('A/B Testing Framework')).toBeVisible();
  });

  test('Back button navigation works', async ({ page }) => {
    // Click the back button
    await page.getByRole('button', { name: /back/i }).click();
    
    // Verify we navigated away from the market validation page
    await page.waitForURL(url => !url.pathname.includes('/market-validation'));
  });

  test('Performance benchmarks are maintained', async ({ page }) => {
    // Test that page loads within reasonable time
    const startTime = Date.now();
    await page.goto('/market-validation');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (generous for research components with charts)
    expect(loadTime).toBeLessThan(3000);
    
    // Test that charts and complex components render without blocking
    await expect(page.getByText('Market Research Visualizations')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Interactive Research Analytics')).toBeVisible({ timeout: 5000 });
  });

  test('No console errors during component interactions', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Interact with various components
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    await page.getByRole('tab', { name: /timeline analytics/i }).click();
    
    // Navigate within A/B testing tabs
    await page.getByRole('tab', { name: /a\/b testing/i }).click();
    await page.getByRole('tab', { name: /results/i }).click();
    await page.getByRole('tab', { name: /trends/i }).click();
    
    // Should have no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && // Ignore React warnings
      !error.includes('favicon') &&  // Ignore favicon 404s
      !error.includes('sourcemap')   // Ignore sourcemap issues
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});