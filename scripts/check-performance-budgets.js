#!/usr/bin/env node

/**
 * Performance Budget Checker for Command Center Calendar
 *
 * CI/CD integration script for validating performance budgets.
 * Runs after build to check bundle sizes and performance metrics.
 *
 * Usage: node scripts/check-performance-budgets.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUILD_DIR = '.next';
const ANALYZE_DIR = '.next/analyze';
const STATS_FILE = '.next/analyze/client.stats.json';

// Performance budget thresholds (in KB)
const BUDGETS = {
  'main.js': { warning: 150, error: 200, critical: 300 },
  'framework.js': { warning: 200, error: 300, critical: 500 },
  '_app.js': { warning: 100, error: 150, critical: 200 },
  'total-js': { warning: 400, error: 600, critical: 1000 },
  'total-css': { warning: 50, error: 75, critical: 100 },
  'first-load': { warning: 400, error: 600, critical: 1000 },
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get size of file in KB
 */
function getFileSizeInKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / 1024;
  } catch (error) {
    return 0;
  }
}

/**
 * Get all JS chunks from build
 */
function getJSChunks() {
  const chunksDir = path.join(BUILD_DIR, 'static', 'chunks');
  const chunks = new Map();

  if (!fs.existsSync(chunksDir)) {
    console.error('Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Read main chunks
  const files = fs.readdirSync(chunksDir, { recursive: true });

  for (const file of files) {
    if (file.endsWith('.js') && !file.endsWith('.js.map')) {
      const filePath = path.join(chunksDir, file);
      const size = getFileSizeInKB(filePath);

      // Categorize chunks
      if (file.includes('main')) {
        chunks.set('main.js', (chunks.get('main.js') || 0) + size);
      } else if (file.includes('framework')) {
        chunks.set('framework.js', (chunks.get('framework.js') || 0) + size);
      } else if (file.includes('_app')) {
        chunks.set('_app.js', (chunks.get('_app.js') || 0) + size);
      } else if (file.startsWith('pages/')) {
        chunks.set(file, size);
      }
    }
  }

  // Calculate total JS
  let totalJS = 0;
  for (const [, size] of chunks) {
    totalJS += size;
  }
  chunks.set('total-js', totalJS);

  return chunks;
}

/**
 * Get all CSS files from build
 */
function getCSSFiles() {
  const cssDir = path.join(BUILD_DIR, 'static', 'css');
  let totalCSS = 0;

  if (fs.existsSync(cssDir)) {
    const files = fs.readdirSync(cssDir);
    for (const file of files) {
      if (file.endsWith('.css') && !file.endsWith('.css.map')) {
        const filePath = path.join(cssDir, file);
        totalCSS += getFileSizeInKB(filePath);
      }
    }
  }

  return totalCSS;
}

/**
 * Parse build manifest for first load sizes
 */
function getFirstLoadSize() {
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // This is simplified - actual implementation would parse the manifest properly
    return null; // Will calculate from chunks instead
  } catch (error) {
    return null;
  }
}

/**
 * Check budget and return status
 */
function checkBudget(name, size, budget) {
  if (!budget) return { status: 'pass', message: '' };

  if (size > budget.critical) {
    return {
      status: 'critical',
      message: `🚨 CRITICAL: ${name} is ${size.toFixed(2)}KB (limit: ${budget.critical}KB)`,
    };
  }

  if (size > budget.error) {
    return {
      status: 'error',
      message: `❌ ERROR: ${name} is ${size.toFixed(2)}KB (limit: ${budget.error}KB)`,
    };
  }

  if (size > budget.warning) {
    return {
      status: 'warning',
      message: `⚠️  WARNING: ${name} is ${size.toFixed(2)}KB (limit: ${budget.warning}KB)`,
    };
  }

  return {
    status: 'pass',
    message: `✅ ${name}: ${size.toFixed(2)}KB`,
  };
}

/**
 * Generate performance report
 */
function generateReport(chunks, cssSize) {
  const results = [];
  let hasErrors = false;
  let hasCritical = false;

  console.log('\n' + '='.repeat(80));
  console.log('                    PERFORMANCE BUDGET CHECK RESULTS');
  console.log('='.repeat(80));
  console.log();

  // Check JavaScript chunks
  console.log('JavaScript Bundles:');
  console.log('-'.repeat(40));

  for (const [name, budget] of Object.entries(BUDGETS)) {
    if (name === 'total-css' || name === 'first-load') continue;

    const size = chunks.get(name) || 0;
    if (size > 0) {
      const result = checkBudget(name, size, budget);
      console.log(`  ${result.message}`);

      if (result.status === 'error') hasErrors = true;
      if (result.status === 'critical') hasCritical = true;

      results.push({ name, size, ...result });
    }
  }

  // Check CSS
  console.log('\nCSS Bundles:');
  console.log('-'.repeat(40));

  const cssResult = checkBudget('total-css', cssSize, BUDGETS['total-css']);
  console.log(`  ${cssResult.message}`);
  if (cssResult.status === 'error') hasErrors = true;
  if (cssResult.status === 'critical') hasCritical = true;

  // Check first load
  const firstLoadSize =
    (chunks.get('main.js') || 0) +
    (chunks.get('framework.js') || 0) +
    (chunks.get('_app.js') || 0) +
    cssSize;

  console.log('\nFirst Load JS + CSS:');
  console.log('-'.repeat(40));

  const firstLoadResult = checkBudget('first-load', firstLoadSize, BUDGETS['first-load']);
  console.log(`  ${firstLoadResult.message}`);
  if (firstLoadResult.status === 'error') hasErrors = true;
  if (firstLoadResult.status === 'critical') hasCritical = true;

  // Generate ASCII chart
  console.log('\n' + '='.repeat(80));
  console.log('                         BUDGET STATUS CHART');
  console.log('='.repeat(80));
  console.log();
  console.log('  Budget Name          │ Size (KB) │ Status    │ Limit (KB) │ Usage');
  console.log('  ────────────────────────────────────────────────────────────────────');

  const allResults = [
    ...results,
    { name: 'total-css', size: cssSize, ...cssResult },
    { name: 'first-load', size: firstLoadSize, ...firstLoadResult },
  ];

  for (const result of allResults) {
    const budget = BUDGETS[result.name];
    const limit = budget ? budget.error : 'N/A';
    const usage = budget ? ((result.size / budget.error) * 100).toFixed(1) + '%' : 'N/A';
    const statusIcon =
      result.status === 'critical'
        ? '🚨'
        : result.status === 'error'
          ? '❌'
          : result.status === 'warning'
            ? '⚠️ '
            : '✅';

    console.log(
      `  ${result.name.padEnd(20)} │ ${result.size.toFixed(2).padStart(9)} │ ${statusIcon.padEnd(9)} │ ${limit
        .toString()
        .padStart(10)} │ ${usage.padStart(6)}`
    );
  }

  console.log();
  console.log('='.repeat(80));

  // Summary
  if (hasCritical) {
    console.log('\n🚨 CRITICAL VIOLATIONS DETECTED - Build should be blocked!');
    return 2;
  } else if (hasErrors) {
    console.log('\n❌ ERRORS DETECTED - Performance budgets exceeded!');
    return 1;
  } else {
    console.log('\n✅ ALL PERFORMANCE BUDGETS PASSED!');
    return 0;
  }
}

/**
 * Generate detailed bundle report if analyzer is available
 */
async function generateBundleReport() {
  if (!fs.existsSync(STATS_FILE)) {
    console.log('\n📊 Run "ANALYZE=true npm run build" for detailed bundle analysis.');
    return;
  }

  console.log('\n📊 Bundle Analysis Report Available:');
  console.log(`   - Client: ${path.join(ANALYZE_DIR, 'client.html')}`);
  console.log(`   - Stats: ${STATS_FILE}`);

  // Parse stats file for more detailed info
  try {
    const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    const assets = stats.assets || [];

    console.log('\n   Top 5 Largest Assets:');
    assets
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)
      .forEach((asset, index) => {
        const sizeInKB = (asset.size / 1024).toFixed(2);
        console.log(`   ${index + 1}. ${asset.name}: ${sizeInKB}KB`);
      });
  } catch (error) {
    // Stats file parsing failed, skip detailed report
  }
}

/**
 * Check for common performance issues
 */
function checkCommonIssues(chunks) {
  console.log('\n🔍 Common Performance Issues Check:');
  console.log('-'.repeat(40));

  const issues = [];

  // Check for large vendor bundle
  const vendorSize = chunks.get('framework.js') || 0;
  if (vendorSize > 300) {
    issues.push('⚠️  Large vendor bundle detected. Consider code splitting.');
  }

  // Check for too many route chunks
  let routeChunks = 0;
  for (const [name] of chunks) {
    if (name.startsWith('pages/')) routeChunks++;
  }
  if (routeChunks > 20) {
    issues.push('⚠️  Many route chunks detected. Consider dynamic imports.');
  }

  // Check total size
  const totalSize = chunks.get('total-js') || 0;
  if (totalSize > 1000) {
    issues.push('🚨 Total JavaScript exceeds 1MB. Critical optimization needed!');
  }

  if (issues.length === 0) {
    console.log('  ✅ No common performance issues detected.');
  } else {
    issues.forEach((issue) => console.log(`  ${issue}`));
  }

  // Suggestions
  console.log('\n💡 Optimization Suggestions:');
  console.log('-'.repeat(40));
  console.log('  1. Use dynamic imports for heavy components');
  console.log('  2. Implement route-based code splitting');
  console.log('  3. Analyze dependencies with "ANALYZE=true npm run build"');
  console.log('  4. Consider lazy loading for below-the-fold content');
  console.log('  5. Optimize images with next/image component');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Command Center Calendar Performance Budget Checker v1.0.0');
  console.log('='.repeat(80));

  // Check if build exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('\n❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Get bundle sizes
  const chunks = getJSChunks();
  const cssSize = getCSSFiles();

  // Generate report
  const exitCode = generateReport(chunks, cssSize);

  // Check common issues
  checkCommonIssues(chunks);

  // Generate bundle report if available
  await generateBundleReport();

  console.log('\n' + '='.repeat(80));
  console.log(`Completed at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80));

  // Exit with appropriate code for CI/CD
  process.exit(exitCode);
}

// Run the checker
main().catch((error) => {
  console.error('Error running performance budget check:', error);
  process.exit(1);
});
