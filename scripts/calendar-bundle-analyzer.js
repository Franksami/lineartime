#!/usr/bin/env node

/**
 * Calendar Bundle Size Analyzer
 *
 * Analyzes the bundle impact of individual calendar libraries
 * Identifies optimization opportunities for Phase 2 bundle reduction
 */

const fs = require('fs');
const path = require('path');

// Calendar library configurations with estimated bundle sizes
const calendarLibraries = {
  '@fullcalendar/core': { size: '180KB', category: 'fullcalendar' },
  '@fullcalendar/daygrid': { size: '45KB', category: 'fullcalendar' },
  '@fullcalendar/interaction': { size: '35KB', category: 'fullcalendar' },
  '@fullcalendar/list': { size: '25KB', category: 'fullcalendar' },
  '@fullcalendar/react': { size: '20KB', category: 'fullcalendar' },
  '@fullcalendar/rrule': { size: '40KB', category: 'fullcalendar' },
  '@fullcalendar/timegrid': { size: '50KB', category: 'fullcalendar' },

  '@toast-ui/calendar': { size: '120KB', category: 'toast-ui' },
  '@toast-ui/react-calendar': { size: '15KB', category: 'toast-ui' },
  'tui-date-picker': { size: '25KB', category: 'toast-ui' },
  'tui-time-picker': { size: '20KB', category: 'toast-ui' },

  'react-big-calendar': { size: '140KB', category: 'react-big-calendar' },
  '@types/react-big-calendar': { size: '5KB', category: 'react-big-calendar' },

  'react-infinite-calendar': { size: '85KB', category: 'react-infinite-calendar' },

  primereact: {
    size: '280KB',
    category: 'primereact',
    note: 'Full suite - calendar is ~30KB portion',
  },
  primeflex: { size: '45KB', category: 'primereact' },
  primeicons: { size: '120KB', category: 'primereact' },

  'react-calendar': { size: '35KB', category: 'react-calendar' },
  'react-datepicker': { size: '65KB', category: 'react-datepicker' },
  'react-day-picker': { size: '45KB', category: 'react-day-picker' },

  moment: { size: '180KB', category: 'utilities', alternative: 'date-fns' },
  'date-fns': { size: '60KB', category: 'utilities' },
};

// Usage analysis from codebase scanning
const usageAnalysis = {
  linear: { priority: 'LOCKED', files: ['LinearCalendarHorizontal.tsx'], removable: false },
  fullcalendar: {
    priority: 'HIGH',
    files: ['CommandCenterCalendarPro.tsx', 'FullCalendarView.tsx'],
    removable: false,
  },
  'toast-ui': { priority: 'MEDIUM', files: ['ToastUICalendarView.tsx'], removable: true },
  progress: { priority: 'MEDIUM', files: ['ProgressCalendarView.tsx'], removable: true },
  'react-big-calendar': { priority: 'LOW', files: ['ReactBigCalendarView.tsx'], removable: true },
  'react-infinite-calendar': {
    priority: 'LOW',
    files: ['ReactInfiniteCalendarView.tsx'],
    removable: true,
  },
  primereact: { priority: 'LOW', files: ['PrimeReactCalendarView.tsx'], removable: true },
  'mui-x': { priority: 'LOW', files: ['MUIXCalendarView.tsx'], removable: true },
  'react-calendar': { priority: 'LOW', files: ['ReactCalendarView.tsx'], removable: true },
  'react-datepicker': { priority: 'LOW', files: ['ReactDatePickerView.tsx'], removable: true },
};

function analyzeCalendarBundles() {
  console.log('\n🎯 Calendar Bundle Size Analysis - Phase 2 Optimization\n');
  console.log('='.repeat(70));

  let totalEstimatedSize = 0;
  let potentialSavings = 0;

  // Group libraries by category
  const categories = {};
  Object.entries(calendarLibraries).forEach(([lib, config]) => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push({ name: lib, ...config });

    const sizeInKB = parseInt(config.size.replace('KB', ''));
    totalEstimatedSize += sizeInKB;
  });

  console.log('\n📊 Calendar Libraries by Category:\n');

  Object.entries(categories).forEach(([category, libs]) => {
    const categorySize = libs.reduce((sum, lib) => sum + parseInt(lib.size.replace('KB', '')), 0);
    const usage = usageAnalysis[category] ||
      usageAnalysis[libs[0].name] || { priority: 'UNKNOWN', removable: 'UNKNOWN' };

    console.log(`\n🔶 ${category.toUpperCase()}`);
    console.log(`   Total Size: ${categorySize}KB`);
    console.log(`   Priority: ${usage.priority}`);
    console.log(`   Removable: ${usage.removable ? '✅ Yes' : '❌ No'}`);

    if (usage.removable && usage.priority === 'LOW') {
      potentialSavings += categorySize;
    }

    libs.forEach((lib) => {
      const indicator = usage.removable ? '📦' : '🔒';
      console.log(`     ${indicator} ${lib.name}: ${lib.size}${lib.note ? ` (${lib.note})` : ''}`);
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n💾 Bundle Size Summary:`);
  console.log(
    `   Total Calendar Libraries: ${totalEstimatedSize}KB (~${Math.round((totalEstimatedSize / 1024) * 10) / 10}MB)`
  );
  console.log(
    `   Potential Savings: ${potentialSavings}KB (~${Math.round((potentialSavings / 1024) * 10) / 10}MB)`
  );
  console.log(`   Optimization Target: 800KB (Phase 2 Goal)`);
  console.log(
    `   Achievable Savings: ${potentialSavings >= 800 ? '✅ Goal Achievable' : '⚠️  May need additional optimization'}`
  );

  // Optimization recommendations
  console.log('\n🎯 Optimization Recommendations:\n');

  const recommendations = [
    {
      action: 'Remove Low-Priority Libraries',
      impact: `${Math.round(potentialSavings * 0.6)}KB`,
      libraries: ['react-big-calendar', 'react-infinite-calendar', 'primereact'],
      priority: 'HIGH',
    },
    {
      action: 'Replace moment.js with date-fns',
      impact: '120KB',
      libraries: ['moment'],
      priority: 'HIGH',
    },
    {
      action: 'Remove unused PrimeReact components',
      impact: '200KB',
      libraries: ['primereact', 'primeflex', 'primeicons'],
      priority: 'MEDIUM',
    },
    {
      action: 'Optimize Toast UI Calendar usage',
      impact: '80KB',
      libraries: ['@toast-ui/calendar', 'tui-date-picker', 'tui-time-picker'],
      priority: 'MEDIUM',
    },
    {
      action: 'Keep Core Libraries',
      impact: '0KB',
      libraries: ['@fullcalendar/*', 'LinearCalendarHorizontal'],
      priority: 'LOCKED',
    },
  ];

  recommendations.forEach((rec, index) => {
    const icon = rec.priority === 'HIGH' ? '🔥' : rec.priority === 'MEDIUM' ? '⚡' : '🔒';
    console.log(`${index + 1}. ${icon} ${rec.action}`);
    console.log(`   Impact: -${rec.impact}`);
    console.log(`   Libraries: ${rec.libraries.join(', ')}`);
    console.log(`   Priority: ${rec.priority}\n`);
  });

  // Create optimization script
  generateOptimizationScript(potentialSavings);

  return {
    totalSize: totalEstimatedSize,
    potentialSavings,
    achievable: potentialSavings >= 800,
    recommendations,
  };
}

function generateOptimizationScript(potentialSavings) {
  const script = `#!/bin/bash
# Auto-generated Calendar Bundle Optimization Script
# Phase 2: Calendar Library Optimization
# Potential Savings: ${potentialSavings}KB

echo "🚀 Starting Phase 2: Calendar Bundle Optimization"
echo "Target: 800KB reduction"

# Step 1: Remove low-priority calendar libraries
echo "📦 Removing low-priority libraries..."
pnpm remove react-big-calendar @types/react-big-calendar
pnpm remove react-infinite-calendar  
pnpm remove primereact primeflex primeicons

# Step 2: Replace moment.js with date-fns
echo "⏰ Migrating moment.js to date-fns..."
# Manual code changes required in ReactBigCalendarView.tsx

# Step 3: Remove unused Toast UI components (optional)
echo "🎨 Optimizing Toast UI usage..."
# pnpm remove tui-date-picker tui-time-picker  # Keep if actively used

# Step 4: Validate bundle reduction
echo "📊 Running bundle analysis..."
npm run build:analyze

echo "✅ Phase 2 optimization complete!"
echo "Run tests: npm run test:foundation && npm run test:all"
`;

  fs.writeFileSync(path.join(__dirname, 'optimize-calendar-bundle.sh'), script, { mode: 0o755 });
  console.log('📝 Generated optimization script: scripts/optimize-calendar-bundle.sh\n');
}

// Run analysis
if (require.main === module) {
  const results = analyzeCalendarBundles();

  console.log('🎉 Analysis complete! Run the generated script to apply optimizations.');
  console.log('⚠️  Remember to test after each optimization step.\n');
}

module.exports = { analyzeCalendarBundles, calendarLibraries, usageAnalysis };
