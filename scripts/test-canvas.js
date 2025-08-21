// Canvas Performance Test Script
// Run this in the browser console on /test-canvas page

console.log('Starting Canvas performance test...');

// Test Configuration
const tests = {
  canvasRendering: false,
  eventCount: false,
  memoryUsage: false,
  renderTime: false
};

// Wait for page load
setTimeout(() => {
  // Test 1: Check Canvas is active
  const modeElement = Array.from(document.querySelectorAll('[class*="font-mono"]')).find(
    el => el.parentElement?.textContent?.includes('Mode')
  );
  
  if (modeElement) {
    const mode = modeElement.textContent;
    tests.canvasRendering = mode === 'CANVAS' || mode === 'HYBRID';
    console.log(`${tests.canvasRendering ? '✓' : '✗'} Canvas Mode: ${mode}`);
  }
  
  // Test 2: Event Count
  const eventElement = Array.from(document.querySelectorAll('[class*="font-mono"]'))[0];
  if (eventElement) {
    const eventCount = parseInt(eventElement.textContent.replace(',', ''));
    tests.eventCount = eventCount >= 1000;
    console.log(`${tests.eventCount ? '✓' : '✗'} Events: ${eventCount.toLocaleString()}`);
  }
  
  // Test 3: Render Time
  const renderElement = Array.from(document.querySelectorAll('[class*="font-mono"]'))[1];
  if (renderElement) {
    const renderTime = parseInt(renderElement.textContent);
    tests.renderTime = renderTime < 500;
    console.log(`${tests.renderTime ? '✓' : '✗'} Render Time: ${renderTime}ms (Target: <500ms)`);
  }
  
  // Test 4: Check for Canvas elements
  const canvasElements = document.querySelectorAll('canvas');
  console.log(`Found ${canvasElements.length} canvas elements`);
  
  // Test 5: Check hybrid rendering indicators
  const canvasIndicators = document.querySelectorAll('[class*="bg-blue"]');
  const hasCanvasMonths = Array.from(canvasIndicators).some(el => 
    el.textContent === 'Canvas'
  );
  console.log(`${hasCanvasMonths ? '✓' : '✗'} Canvas months detected`);
  
  // Summary
  console.log('\n=== CANVAS TEST RESULTS ===');
  console.log(`Canvas Active: ${tests.canvasRendering ? '✅' : '❌'}`);
  console.log(`Event Count: ${tests.eventCount ? '✅' : '❌'}`);
  console.log(`Render Time: ${tests.renderTime ? '✅' : '❌'}`);
  console.log(`Canvas Elements: ${canvasElements.length > 0 ? '✅' : '❌'}`);
  
  const allPass = tests.canvasRendering && tests.eventCount && tests.renderTime;
  console.log(`\nOverall: ${allPass ? '✅ Canvas rendering working!' : '⚠️ Check Canvas implementation'}`);
  
}, 2000);