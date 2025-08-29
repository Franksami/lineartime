#!/bin/bash
# Auto-generated Calendar Bundle Optimization Script
# Phase 2: Calendar Library Optimization
# Potential Savings: 775KB

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
