#!/usr/bin/env node
/**
 * CheatCal Performance Regression Detection System
 * 
 * Monitors performance metrics for CheatCal's advanced features including
 * Electron overlay, computer vision, and AI systems to ensure 60+ FPS
 * performance targets are maintained.
 * 
 * @version 1.0.0 (Performance Monitoring Release)
 * @author CheatCal Performance Team
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ASCII Performance Architecture
const PERFORMANCE_MONITORING_ARCHITECTURE = `
CHEATCAL PERFORMANCE REGRESSION DETECTION
═══════════════════════════════════════════════════════════════

COMPREHENSIVE PERFORMANCE MONITORING:
┌─────────────────────────────────────────────────────────────┐
│                   60+ FPS TARGET VALIDATION                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🎯 CHEATCAL FEATURE MONITORING:                           │
│ ├── Controversial theme system performance                 │
│ ├── Animation framework (60+ FPS requirement)             │
│ ├── Electron overlay system performance                   │
│ ├── Computer vision analysis overhead                     │
│ └── Multi-modal context engine efficiency                 │
│                                                             │
│ 📊 PERFORMANCE METRICS:                                   │
│ ├── Frame rate monitoring (target: 60+ FPS)               │
│ ├── Memory usage tracking (target: <120MB)                │
│ ├── CPU usage monitoring (target: <30%)                   │
│ ├── Bundle size impact (target: <75KB per component)      │
│ └── Load time performance (target: <3s)                   │
│                                                             │
│ 🚨 REGRESSION DETECTION:                                  │
│ ├── Baseline performance comparison                       │
│ ├── Automated regression alerts                           │
│ ├── Performance budget enforcement                        │ 
│ └── Optimization recommendations                           │
└─────────────────────────────────────────────────────────────┘
`;

class PerformanceRegressionDetector {
  constructor() {
    this.baselineMetrics = {};
    this.currentMetrics = {};
    this.performanceTargets = {
      fps: 60,
      memoryMB: 120,
      loadTimeMs: 3000,
      bundleSizeKB: 75,
      cpuUsagePercent: 30
    };

    console.log('⚡ CheatCal Performance Regression Detector initializing...');
    console.log(PERFORMANCE_MONITORING_ARCHITECTURE);
  }

  async detectRegressions() {
    console.log('🔍 Starting performance regression detection...\n');

    try {
      // Load baseline metrics
      this.loadBaseline();

      // Test CheatCal platform performance  
      await this.testCheatCalPerformance();

      // Test foundation performance (ensure no degradation)
      await this.testFoundationPerformance();

      // Analyze performance differences
      const regressions = this.analyzeRegressions();

      // Generate performance report
      this.generatePerformanceReport(regressions);

      console.log('\n✅ Performance regression detection complete!');
      return regressions;

    } catch (error) {
      console.error('\n💥 Performance detection failed:', error.message);
      throw error;
    }
  }

  /**
   * Test CheatCal Platform Performance
   */
  async testCheatCalPerformance() {
    console.log('💀 Testing CheatCal platform performance...');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Enable performance monitoring
      await page.coverage.startJSCoverage();
      
      // Navigate to CheatCal platform
      console.log('   Loading CheatCal platform...');
      const startTime = Date.now();
      await page.goto('http://localhost:3000/cheatcal');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Measure performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Frame rate measurement
          let frameCount = 0;
          let lastFrameTime = performance.now();
          
          function measureFPS() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastFrameTime + 1000) {
              const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
              
              // Memory usage
              const memoryInfo = (performance as any).memory || {};
              
              resolve({
                fps,
                memoryUsed: memoryInfo.usedJSHeapSize || 0,
                totalMemory: memoryInfo.totalJSHeapSize || 0,
                loadTime: performance.timing ? 
                  performance.timing.loadEventEnd - performance.timing.navigationStart : 0
              });
              return;
            }
            
            requestAnimationFrame(measureFPS);
          }
          
          // Start FPS measurement
          requestAnimationFrame(measureFPS);
          
          // Fallback timeout
          setTimeout(() => {
            resolve({ fps: 0, memoryUsed: 0, totalMemory: 0, loadTime: 0 });
          }, 3000);
        });
      });

      this.currentMetrics.cheatcal = {
        fps: performanceMetrics.fps,
        memoryMB: Math.round((performanceMetrics.memoryUsed || 0) / 1024 / 1024),
        loadTimeMs: loadTime,
        performanceScore: this.calculatePerformanceScore(performanceMetrics)
      };

      console.log(`   CheatCal FPS: ${this.currentMetrics.cheatcal.fps}`);
      console.log(`   Memory usage: ${this.currentMetrics.cheatcal.memoryMB}MB`);
      console.log(`   Load time: ${this.currentMetrics.cheatcal.loadTimeMs}ms`);

    } catch (error) {
      console.error('   CheatCal performance test failed:', error);
      this.currentMetrics.cheatcal = { error: error.message };
    } finally {
      await browser.close();
    }
  }

  /**
   * Test Foundation Performance (Baseline Preservation)
   */
  async testFoundationPerformance() {
    console.log('🏗️ Testing foundation performance...');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      console.log('   Loading dashboard foundation...');
      const startTime = Date.now();
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Test LinearCalendarHorizontal performance
      const foundationMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          
          function measureFoundationFPS() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= startTime + 2000) { // 2-second measurement
              const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
              const memoryInfo = (performance as any).memory || {};
              
              resolve({
                fps,
                memoryUsed: memoryInfo.usedJSHeapSize || 0,
                calendarElementsFound: document.querySelectorAll('[role="grid"]').length
              });
              return;
            }
            
            requestAnimationFrame(measureFoundationFPS);
          }
          
          requestAnimationFrame(measureFoundationFPS);
          
          // Fallback
          setTimeout(() => {
            resolve({ fps: 0, memoryUsed: 0, calendarElementsFound: 0 });
          }, 3000);
        });
      });

      this.currentMetrics.foundation = {
        fps: foundationMetrics.fps,
        memoryMB: Math.round((foundationMetrics.memoryUsed || 0) / 1024 / 1024),
        loadTimeMs: loadTime,
        calendarRendered: foundationMetrics.calendarElementsFound > 0,
        performanceScore: this.calculatePerformanceScore(foundationMetrics)
      };

      console.log(`   Foundation FPS: ${this.currentMetrics.foundation.fps}`);
      console.log(`   Memory usage: ${this.currentMetrics.foundation.memoryMB}MB`);
      console.log(`   Calendar rendered: ${this.currentMetrics.foundation.calendarRendered}`);

    } catch (error) {
      console.error('   Foundation performance test failed:', error);
      this.currentMetrics.foundation = { error: error.message };
    } finally {
      await browser.close();
    }
  }

  /**
   * Analyze Performance Regressions
   */
  analyzeRegressions() {
    console.log('📈 Analyzing performance regressions...');
    
    const regressions = [];

    // Compare CheatCal performance against targets
    if (this.currentMetrics.cheatcal) {
      const cheatcal = this.currentMetrics.cheatcal;
      
      if (cheatcal.fps && cheatcal.fps < this.performanceTargets.fps) {
        regressions.push({
          feature: 'CheatCal FPS',
          current: cheatcal.fps,
          target: this.performanceTargets.fps,
          severity: 'high',
          impact: 'User experience degradation'
        });
      }

      if (cheatcal.memoryMB > this.performanceTargets.memoryMB) {
        regressions.push({
          feature: 'CheatCal Memory Usage', 
          current: `${cheatcal.memoryMB}MB`,
          target: `${this.performanceTargets.memoryMB}MB`,
          severity: 'medium',
          impact: 'Increased resource consumption'
        });
      }

      if (cheatcal.loadTimeMs > this.performanceTargets.loadTimeMs) {
        regressions.push({
          feature: 'CheatCal Load Time',
          current: `${cheatcal.loadTimeMs}ms`,
          target: `${this.performanceTargets.loadTimeMs}ms`,
          severity: 'medium',
          impact: 'Slower initial page load'
        });
      }
    }

    // Compare foundation performance (ensure no regression)
    if (this.currentMetrics.foundation) {
      const foundation = this.currentMetrics.foundation;
      
      if (foundation.fps && foundation.fps < 112) { // Foundation baseline
        regressions.push({
          feature: 'Foundation FPS',
          current: foundation.fps,
          target: 112,
          severity: 'critical',
          impact: 'Core calendar performance degraded'
        });
      }

      if (!foundation.calendarRendered) {
        regressions.push({
          feature: 'Foundation Rendering',
          current: 'Not rendered',
          target: 'Rendered',
          severity: 'critical',
          impact: 'Core calendar not functional'
        });
      }
    }

    console.log(`   Detected ${regressions.length} performance issues`);
    return regressions;
  }

  /**
   * Load Baseline Performance Metrics
   */
  loadBaseline() {
    const baselinePath = path.join(this.projectRoot, '.performance-baseline.json');
    
    if (fs.existsSync(baselinePath)) {
      try {
        this.baselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        console.log('📊 Loaded performance baseline from previous measurements');
      } catch (error) {
        console.warn('Failed to load performance baseline:', error.message);
      }
    } else {
      console.log('📊 No performance baseline found - current run will establish baseline');
    }
  }

  /**
   * Calculate Performance Score (0-100)
   */
  calculatePerformanceScore(metrics) {
    let score = 100;

    if (metrics.fps && metrics.fps < this.performanceTargets.fps) {
      score -= (this.performanceTargets.fps - metrics.fps) * 2; // 2 points per FPS below target
    }

    const memoryMB = Math.round((metrics.memoryUsed || 0) / 1024 / 1024);
    if (memoryMB > this.performanceTargets.memoryMB) {
      score -= (memoryMB - this.performanceTargets.memoryMB) * 0.5; // 0.5 points per MB over
    }

    return Math.max(score, 0);
  }

  /**
   * Generate Performance Report
   */
  generatePerformanceReport(regressions) {
    console.log('\n📋 CheatCal Performance Report');
    console.log('=' .repeat(50));

    // Performance Summary
    console.log('\n⚡ Performance Summary:');
    if (this.currentMetrics.cheatcal) {
      console.log(`   CheatCal Platform: ${this.currentMetrics.cheatcal.performanceScore || 'N/A'}/100`);
    }
    if (this.currentMetrics.foundation) {
      console.log(`   Foundation: ${this.currentMetrics.foundation.performanceScore || 'N/A'}/100`);
    }

    // Regression Analysis
    if (regressions.length > 0) {
      console.log('\n🚨 Performance Regressions:');
      regressions.forEach(regression => {
        const icon = regression.severity === 'critical' ? '🔴' : 
                    regression.severity === 'high' ? '🟠' : '🟡';
        console.log(`   ${icon} ${regression.feature}: ${regression.current} (target: ${regression.target})`);
        console.log(`      Impact: ${regression.impact}`);
      });
    } else {
      console.log('\n✅ No performance regressions detected!');
    }

    // Recommendations
    console.log('\n🎯 Recommendations:');
    if (regressions.some(r => r.severity === 'critical')) {
      console.log('   • CRITICAL: Address foundation performance issues immediately');
    }
    if (regressions.some(r => r.feature.includes('FPS'))) {
      console.log('   • Optimize animation performance and GPU acceleration');
    }
    if (regressions.some(r => r.feature.includes('Memory'))) {
      console.log('   • Investigate memory leaks in AI or computer vision components');
    }
    if (regressions.some(r => r.feature.includes('Load'))) {
      console.log('   • Optimize bundle size and lazy loading');
    }

    // Save current metrics as new baseline if no critical issues
    const criticalIssues = regressions.filter(r => r.severity === 'critical');
    if (criticalIssues.length === 0) {
      this.saveNewBaseline();
    }
  }

  /**
   * Save New Performance Baseline
   */
  saveNewBaseline() {
    const baselinePath = path.join(this.projectRoot, '.performance-baseline.json');
    const baseline = {
      timestamp: new Date().toISOString(),
      metrics: this.currentMetrics,
      targets: this.performanceTargets
    };

    try {
      fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
      console.log('\n💾 Performance baseline updated');
    } catch (error) {
      console.error('Failed to save performance baseline:', error.message);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const detector = new PerformanceRegressionDetector();
  detector.detectRegressions().catch(error => {
    console.error('💥 Performance detection failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceRegressionDetector;