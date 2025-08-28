import { test, expect } from '@playwright/test';

test.describe('Debug Command Palette', () => {
  test('check CommandPalette presence in DOM', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Check if CommandPaletteProvider rendered anything
    const dialogCount = await page.locator('div[role="dialog"]').count();
    console.log('Dialogs found:', dialogCount);
    
    // Check for command-related elements
    const commandElements = await page.locator('[data-slot="command"]').count();
    console.log('Command elements found:', commandElements);
    
    // Check if CommandDialog exists (even if hidden)
    const commandDialogExists = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let found = false;
      for (const el of elements) {
        if (el.getAttribute('data-testid') === 'command-palette' || 
            (typeof el.className === 'string' && el.className.includes('command'))) {
          console.log('Found element:', el.tagName, el.className, el.getAttribute('data-testid'));
          found = true;
        }
      }
      return found;
    });
    
    console.log('CommandDialog exists in DOM:', commandDialogExists);
    
    // Try triggering the shortcut
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(1000);
    
    // Check again
    const paletteVisible = await page.locator('[data-testid="command-palette"]').isVisible();
    console.log('Palette visible after Ctrl+P:', paletteVisible);
    
    // Also try Meta+P
    await page.keyboard.press('Meta+p');
    await page.waitForTimeout(1000);
    
    const paletteVisibleMeta = await page.locator('[data-testid="command-palette"]').isVisible();
    console.log('Palette visible after Meta+P:', paletteVisibleMeta);
    
    // Listen to console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      console.log('Browser console:', msg.text());
    });
    
    // Reload to capture all console logs
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      console.log('LocalStorage flags:', 
        Object.keys(localStorage).filter(k => k.startsWith('flag_'))
      );
    });
  });
});