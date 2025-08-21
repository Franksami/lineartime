// Performance test script for Virtual Calendar
// Run this in the browser console on /test-virtual page

console.log('Starting performance test...');

// Test 1: Verify event count
const eventCount = document.querySelector('[class*="font-mono"]').textContent;
console.log(`✓ Events loaded: ${eventCount}`);

// Test 2: Check render time
const renderTimeElement = Array.from(document.querySelectorAll('[class*="font-mono"]'))[1];
const renderTime = parseInt(renderTimeElement.textContent);
const renderPass = renderTime < 500;
console.log(`${renderPass ? '✓' : '✗'} Render time: ${renderTime}ms (Target: <500ms)`);

// Test 3: Check memory usage
const memoryElement = Array.from(document.querySelectorAll('[class*="font-mono"]'))[3];
const memory = parseInt(memoryElement.textContent);
const memoryPass = memory < 100;
console.log(`${memoryPass ? '✓' : '✗'} Memory usage: ${memory}MB (Target: <100MB)`);

// Test 4: Check tree performance
const treeElement = Array.from(document.querySelectorAll('[class*="font-mono"]'))[4];
const treeTime = parseInt(treeElement.textContent);
const treePass = treeTime < 50;
console.log(`${treePass ? '✓' : '✗'} IntervalTree time: ${treeTime}ms (Target: <50ms)`);

// Test 5: Simulate scroll for FPS test
console.log('\nSimulating scroll test...');
let frameCount = 0;
let startTime = performance.now();

function measureFPS() {
  frameCount++;
  if (performance.now() - startTime >= 1000) {
    const fps = frameCount;
    const fpsPass = fps >= 60;
    console.log(`${fpsPass ? '✓' : '✗'} FPS during scroll: ${fps} (Target: 60)`);
    
    // Summary
    console.log('\n=== PERFORMANCE TEST RESULTS ===');
    console.log(`Events: ${eventCount}`);
    console.log(`Render: ${renderTime}ms ${renderPass ? '✅' : '❌'}`);
    console.log(`Memory: ${memory}MB ${memoryPass ? '✅' : '❌'}`);
    console.log(`Tree: ${treeTime}ms ${treePass ? '✅' : '❌'}`);
    console.log(`FPS: ${fps} ${fpsPass ? '✅' : '❌'}`);
    
    const allPass = renderPass && memoryPass && treePass && fpsPass;
    console.log(`\nOverall: ${allPass ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed'}`);
    return;
  }
  requestAnimationFrame(measureFPS);
}

// Trigger scroll
window.scrollBy(0, 100);
requestAnimationFrame(measureFPS);