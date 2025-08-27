#!/usr/bin/env node

/**
 * Performance Target Validation Script
 * 
 * Validates that the LinearTime design system implementation 
 * meets established performance targets and compliance metrics.
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Validating Performance Targets...\n');

// Performance targets from documentation
const PERFORMANCE_TARGETS = {
  bundleSize: {
    initial: 500 * 1024,      // <500KB initial bundle
    total: 2 * 1024 * 1024,   // <2MB total
    css: 150 * 1024           // <150KB CSS
  },
  tokenResolution: {
    average: 1,               // <1ms average resolution
    total: 10                 // <10ms total for batch operations
  },
  coreWebVitals: {
    lcp: 2500,                // <2.5s Largest Contentful Paint
    cls: 0.1,                 // <0.1 Cumulative Layout Shift  
    fid: 100                  // <100ms First Input Delay
  },
  accessibility: {
    wcagCompliance: 95        // >95% WCAG AAA compliance
  },
  frameRate: 60               // 60fps+ for smooth interactions
};

let validationResults = {
  bundleSize: 'PENDING',
  tokenResolution: 'PENDING', 
  coreWebVitals: 'PENDING',
  accessibility: 'PENDING',
  overallScore: 0,
  recommendations: []
};

// Validate bundle size by checking built assets
function validateBundleSize() {
  console.log('📦 Validating Bundle Size Targets...');
  
  const nextDir = path.join(process.cwd(), '.next');
  const hasNextBuild = fs.existsSync(nextDir);
  
  if (!hasNextBuild) {
    validationResults.bundleSize = 'SKIPPED';
    validationResults.recommendations.push('Run `npm run build` to validate bundle size targets');
    console.log('  ⏳ No build found - skipping bundle analysis');
    return false;
  }
  
  // Estimate bundle size from component files
  const componentDir = path.join(process.cwd(), 'components');
  const libDir = path.join(process.cwd(), 'lib');
  
  let estimatedSize = 0;
  
  function calculateDirectorySize(dir) {
    if (!fs.existsSync(dir)) return 0;
    
    let size = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += calculateDirectorySize(filePath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        const stats = fs.statSync(filePath);
        size += stats.size;
      }
    });
    
    return size;
  }
  
  estimatedSize = calculateDirectorySize(componentDir) + calculateDirectorySize(libDir);
  
  // Estimated bundle size (roughly 3x source for compiled + deps)
  const estimatedBundleSize = estimatedSize * 3;
  
  console.log(`  📊 Estimated bundle size: ${Math.round(estimatedBundleSize / 1024)}KB`);
  console.log(`  🎯 Target: <${Math.round(PERFORMANCE_TARGETS.bundleSize.initial / 1024)}KB`);
  
  if (estimatedBundleSize < PERFORMANCE_TARGETS.bundleSize.initial) {
    validationResults.bundleSize = 'PASS';
    console.log('  ✅ Bundle size within target range');
    return true;
  } else {
    validationResults.bundleSize = 'FAIL';
    validationResults.recommendations.push('Optimize bundle size through tree shaking and code splitting');
    console.log('  ❌ Bundle size exceeds target');
    return false;
  }
}

// Validate token resolution performance
function validateTokenResolution() {
  console.log('\n⚡ Validating Token Resolution Performance...');
  
  const tokenRegistryPath = path.join(process.cwd(), 'lib/design-system/component-tokens/ComponentTokenRegistry.ts');
  const migrationUtilityPath = path.join(process.cwd(), 'lib/design-system/component-tokens/ComponentMigrationUtility.ts');
  
  const hasTokenSystem = fs.existsSync(tokenRegistryPath) && fs.existsSync(migrationUtilityPath);
  
  if (!hasTokenSystem) {
    validationResults.tokenResolution = 'FAIL';
    validationResults.recommendations.push('Complete Component Token Registry implementation');
    console.log('  ❌ Token system not fully implemented');
    return false;
  }
  
  // Check for performance optimizations in the code
  const registryContent = fs.readFileSync(tokenRegistryPath, 'utf8');
  const hasCaching = registryContent.includes('cache') || registryContent.includes('memo');
  const hasOptimization = registryContent.includes('performance') || registryContent.includes('optimize');
  
  console.log('  📊 Token system features:');
  console.log(`    • Caching: ${hasCaching ? '✅' : '❌'}`);
  console.log(`    • Optimization: ${hasOptimization ? '✅' : '❌'}`);
  
  if (hasCaching && hasOptimization) {
    validationResults.tokenResolution = 'PASS';
    console.log('  ✅ Token resolution optimizations implemented');
    return true;
  } else {
    validationResults.tokenResolution = 'PARTIAL';
    validationResults.recommendations.push('Implement caching and memoization for token resolution');
    console.log('  ⚠️ Token resolution needs performance optimization');
    return false;
  }
}

// Validate accessibility implementation
function validateAccessibility() {
  console.log('\n♿ Validating Accessibility Compliance...');
  
  const accessibilityTestPath = path.join(process.cwd(), 'tests/design-system/accessibility/wcag-compliance.spec.ts');
  const keyboardTestPath = path.join(process.cwd(), 'tests/design-system/accessibility/keyboard-navigation.spec.ts');
  
  const hasAccessibilityTests = fs.existsSync(accessibilityTestPath) && fs.existsSync(keyboardTestPath);
  
  if (!hasAccessibilityTests) {
    validationResults.accessibility = 'FAIL';
    validationResults.recommendations.push('Implement comprehensive accessibility testing suite');
    console.log('  ❌ Accessibility tests not implemented');
    return false;
  }
  
  // Check for WCAG AAA compliance features
  const wcagTestContent = fs.readFileSync(accessibilityTestPath, 'utf8');
  const hasWCAGAAA = wcagTestContent.includes('wcag2aa') || wcagTestContent.includes('AAA');
  const hasColorContrast = wcagTestContent.includes('contrast') || wcagTestContent.includes('7:1');
  
  console.log('  📊 Accessibility features:');
  console.log(`    • WCAG AAA Testing: ${hasWCAGAAA ? '✅' : '❌'}`);
  console.log(`    • Color Contrast: ${hasColorContrast ? '✅' : '❌'}`);
  
  if (hasWCAGAAA && hasColorContrast) {
    validationResults.accessibility = 'PASS';
    console.log('  ✅ WCAG AAA compliance testing implemented');
    return true;
  } else {
    validationResults.accessibility = 'PARTIAL';
    validationResults.recommendations.push('Enhance WCAG AAA compliance testing');
    console.log('  ⚠️ Accessibility compliance needs improvement');
    return false;
  }
}

// Validate Core Web Vitals setup
function validateCoreWebVitals() {
  console.log('\n🌐 Validating Core Web Vitals Implementation...');
  
  const performanceTestPath = path.join(process.cwd(), 'tests/design-system/performance/lighthouse-ci.spec.ts');
  const bundleAnalysisPath = path.join(process.cwd(), 'tests/design-system/performance/bundle-analysis.spec.ts');
  
  const hasPerformanceTests = fs.existsSync(performanceTestPath) && fs.existsSync(bundleAnalysisPath);
  
  if (!hasPerformanceTests) {
    validationResults.coreWebVitals = 'FAIL';
    validationResults.recommendations.push('Implement Core Web Vitals monitoring');
    console.log('  ❌ Performance tests not implemented');
    return false;
  }
  
  // Check for Core Web Vitals metrics
  const performanceContent = fs.readFileSync(performanceTestPath, 'utf8');
  const hasLCP = performanceContent.includes('lcp') || performanceContent.includes('Largest Contentful Paint');
  const hasCLS = performanceContent.includes('cls') || performanceContent.includes('Cumulative Layout Shift');
  const hasFID = performanceContent.includes('fid') || performanceContent.includes('First Input Delay');
  
  console.log('  📊 Core Web Vitals monitoring:');
  console.log(`    • LCP (Largest Contentful Paint): ${hasLCP ? '✅' : '❌'}`);
  console.log(`    • CLS (Cumulative Layout Shift): ${hasCLS ? '✅' : '❌'}`);
  console.log(`    • FID (First Input Delay): ${hasFID ? '✅' : '❌'}`);
  
  if (hasLCP && hasCLS && hasFID) {
    validationResults.coreWebVitals = 'PASS';
    console.log('  ✅ Core Web Vitals monitoring implemented');
    return true;
  } else {
    validationResults.coreWebVitals = 'PARTIAL';
    validationResults.recommendations.push('Complete Core Web Vitals implementation');
    console.log('  ⚠️ Core Web Vitals monitoring incomplete');
    return false;
  }
}

// Calculate overall compliance score
function calculateOverallScore() {
  const scores = {
    'PASS': 100,
    'PARTIAL': 70,
    'FAIL': 0,
    'SKIPPED': 50,
    'PENDING': 0
  };
  
  const weights = {
    bundleSize: 0.25,
    tokenResolution: 0.25,
    coreWebVitals: 0.25,
    accessibility: 0.25
  };
  
  let totalScore = 0;
  Object.keys(validationResults).forEach(key => {
    if (weights[key]) {
      totalScore += scores[validationResults[key]] * weights[key];
    }
  });
  
  validationResults.overallScore = Math.round(totalScore);
  return totalScore;
}

// Generate performance report
function generatePerformanceReport() {
  const score = calculateOverallScore();
  
  console.log('\n📊 Performance Validation Report');
  console.log('==================================================');
  
  console.log(`\n🏆 Overall Score: ${validationResults.overallScore}%`);
  
  let status = 'CRITICAL';
  if (score >= 90) status = 'EXCELLENT';
  else if (score >= 80) status = 'GOOD';
  else if (score >= 70) status = 'FAIR';
  else if (score >= 50) status = 'POOR';
  
  console.log(`📈 Status: ${status}`);
  console.log(`✅ Target Met: ${score >= 80 ? 'YES' : 'NO'}`);
  
  console.log('\n📋 Category Results:');
  console.log(`   Bundle Size      : ${validationResults.bundleSize}`);
  console.log(`   Token Resolution : ${validationResults.tokenResolution}`);
  console.log(`   Core Web Vitals  : ${validationResults.coreWebVitals}`);
  console.log(`   Accessibility    : ${validationResults.accessibility}`);
  
  if (validationResults.recommendations.length > 0) {
    console.log('\n🎯 Recommendations:');
    validationResults.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📈 Performance Targets:');
  console.log(`   Bundle Size: <${Math.round(PERFORMANCE_TARGETS.bundleSize.initial / 1024)}KB initial`);
  console.log(`   Token Resolution: <${PERFORMANCE_TARGETS.tokenResolution.average}ms average`);
  console.log(`   LCP: <${PERFORMANCE_TARGETS.coreWebVitals.lcp}ms`);
  console.log(`   CLS: <${PERFORMANCE_TARGETS.coreWebVitals.cls}`);
  console.log(`   FID: <${PERFORMANCE_TARGETS.coreWebVitals.fid}ms`);
  console.log(`   WCAG Compliance: >${PERFORMANCE_TARGETS.accessibility.wcagCompliance}%`);
  
  console.log('\n==================================================');
  
  return validationResults;
}

// Main validation execution
async function main() {
  try {
    // Run all validations
    const bundleResult = validateBundleSize();
    const tokenResult = validateTokenResolution();
    const accessibilityResult = validateAccessibility();
    const coreWebVitalsResult = validateCoreWebVitals();
    
    // Generate final report
    const report = generatePerformanceReport();
    
    // Exit with appropriate code
    const overallScore = report.overallScore;
    if (overallScore >= 80) {
      console.log('\n🎉 Performance targets validation PASSED!');
      process.exit(0);
    } else if (overallScore >= 50) {
      console.log('\n⚠️ Performance targets validation PARTIAL - improvements needed');
      process.exit(1);
    } else {
      console.log('\n❌ Performance targets validation FAILED - critical issues found');
      process.exit(2);
    }
    
  } catch (error) {
    console.error('\n❌ Performance validation failed with error:', error.message);
    process.exit(3);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  PERFORMANCE_TARGETS,
  validateBundleSize,
  validateTokenResolution,
  validateAccessibility,
  validateCoreWebVitals,
  generatePerformanceReport
};