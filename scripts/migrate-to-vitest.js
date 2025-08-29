#!/usr/bin/env node

/**
 * Jest to Vitest Migration Script
 * Automated migration with safety checks and rollback capability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Jest to Vitest migration...\n');

// Migration configuration
const MIGRATION_CONFIG = {
  testFilePatterns: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
  excludePaths: ['node_modules', 'dist', '.next', 'coverage'],
  backupDir: '.migration-backup',
  dryRun: process.argv.includes('--dry-run'),
};

// Step 1: Create backup
function createBackup() {
  console.log('📦 Creating backup of current test configuration...');

  if (!MIGRATION_CONFIG.dryRun) {
    if (!fs.existsSync(MIGRATION_CONFIG.backupDir)) {
      fs.mkdirSync(MIGRATION_CONFIG.backupDir, { recursive: true });
    }

    // Backup Jest config
    const filesToBackup = [
      'jest.config.js',
      'jest.config.ts',
      'jest.setup.js',
      'jest.setup.ts',
      'package.json',
    ];

    filesToBackup.forEach((file) => {
      if (fs.existsSync(file)) {
        const backupPath = path.join(MIGRATION_CONFIG.backupDir, file);
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        fs.copyFileSync(file, backupPath);
        console.log(`  ✅ Backed up ${file}`);
      }
    });
  }

  console.log();
}

// Step 2: Update package.json
function updatePackageJson() {
  console.log('📝 Updating package.json...');

  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update scripts
  const scriptMappings = {
    test: 'vitest',
    'test:coverage': 'vitest --coverage',
    'test:watch': 'vitest --watch',
    'test:ui': 'vitest --ui',
    'test:run': 'vitest run',
    'test:bench': 'vitest bench',
  };

  Object.entries(scriptMappings).forEach(([key, value]) => {
    if (packageJson.scripts[key] && packageJson.scripts[key].includes('jest')) {
      console.log(`  📝 Updating script: ${key}`);
      if (!MIGRATION_CONFIG.dryRun) {
        packageJson.scripts[key] = value;
      }
    }
  });

  // Add Vitest-specific scripts if not present
  if (!packageJson.scripts['test:ui']) {
    console.log('  ➕ Adding test:ui script');
    if (!MIGRATION_CONFIG.dryRun) {
      packageJson.scripts['test:ui'] = 'vitest --ui';
    }
  }

  if (!packageJson.scripts['test:bench']) {
    console.log('  ➕ Adding test:bench script');
    if (!MIGRATION_CONFIG.dryRun) {
      packageJson.scripts['test:bench'] = 'vitest bench';
    }
  }

  if (!MIGRATION_CONFIG.dryRun) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('  ✅ package.json updated');
  }

  console.log();
}

// Step 3: Migrate test files
function migrateTestFiles() {
  console.log('🔄 Migrating test files...');

  const testFiles = findTestFiles();
  let migratedCount = 0;

  testFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    // Replace Jest imports with Vitest
    const importReplacements = [
      // Basic Jest to Vitest
      [/from ['"]jest['"];?/g, "from 'vitest'"],
      [/import jest from ['"]jest['"]/g, "import { vi } from 'vitest'"],

      // Jest globals to Vitest imports
      [
        /^(describe|it|test|expect|beforeAll|beforeEach|afterAll|afterEach)\(/gm,
        (match) => {
          if (!content.includes("from 'vitest'")) {
            return `import { ${match.slice(0, -1)} } from 'vitest'\n${match}`;
          }
          return match;
        },
      ],

      // jest.fn() to vi.fn()
      [/jest\.fn\(/g, 'vi.fn('],
      [/jest\.mock\(/g, 'vi.mock('],
      [/jest\.unmock\(/g, 'vi.unmock('],
      [/jest\.spyOn\(/g, 'vi.spyOn('],
      [/jest\.clearAllMocks\(/g, 'vi.clearAllMocks('],
      [/jest\.resetAllMocks\(/g, 'vi.resetAllMocks('],
      [/jest\.restoreAllMocks\(/g, 'vi.restoreAllMocks('],

      // Timers
      [/jest\.useFakeTimers\(/g, 'vi.useFakeTimers('],
      [/jest\.useRealTimers\(/g, 'vi.useRealTimers('],
      [/jest\.advanceTimersByTime\(/g, 'vi.advanceTimersByTime('],
      [/jest\.runAllTimers\(/g, 'vi.runAllTimers('],
      [/jest\.runOnlyPendingTimers\(/g, 'vi.runOnlyPendingTimers('],

      // Module mocking
      [/jest\.requireActual\(/g, 'vi.importActual('],
      [/jest\.requireMock\(/g, 'vi.importMock('],
    ];

    importReplacements.forEach(([pattern, replacement]) => {
      newContent = newContent.replace(pattern, replacement);
    });

    if (newContent !== content) {
      migratedCount++;
      console.log(`  🔄 Migrating ${file}`);
      if (!MIGRATION_CONFIG.dryRun) {
        fs.writeFileSync(file, newContent);
      }
    }
  });

  console.log(`  ✅ Migrated ${migratedCount} test files`);
  console.log();
}

// Step 4: Install dependencies
function installDependencies() {
  console.log('📦 Installing Vitest dependencies...');

  const dependencies = [
    'vitest',
    '@vitest/ui',
    '@vitest/coverage-v8',
    'jsdom',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
  ];

  const devDepsToRemove = [
    'jest',
    'jest-environment-jsdom',
    '@types/jest',
    'babel-jest',
    'ts-jest',
  ];

  if (!MIGRATION_CONFIG.dryRun) {
    // Install Vitest dependencies
    console.log('  📥 Installing Vitest packages...');
    execSync(`npm install --save-dev ${dependencies.join(' ')}`, {
      stdio: 'inherit',
    });

    // Remove Jest dependencies
    console.log('  🗑️  Removing Jest packages...');
    execSync(`npm uninstall ${devDepsToRemove.join(' ')}`, {
      stdio: 'inherit',
    });
  } else {
    console.log('  📋 Would install:', dependencies.join(', '));
    console.log('  📋 Would remove:', devDepsToRemove.join(', '));
  }

  console.log();
}

// Step 5: Clean up old Jest files
function cleanupJestFiles() {
  console.log('🧹 Cleaning up Jest configuration files...');

  const filesToRemove = ['jest.config.js', 'jest.config.ts', 'jest.setup.js', 'jest.setup.ts'];

  filesToRemove.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`  🗑️  Removing ${file}`);
      if (!MIGRATION_CONFIG.dryRun) {
        fs.unlinkSync(file);
      }
    }
  });

  console.log();
}

// Helper: Find all test files
function findTestFiles(dir = '.', files = []) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);

    // Skip excluded paths
    if (MIGRATION_CONFIG.excludePaths.some((exclude) => fullPath.includes(exclude))) {
      return;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (stat.isFile()) {
      // Check if it matches test patterns
      const isTestFile = MIGRATION_CONFIG.testFilePatterns.some((pattern) => {
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\{.*\}/g, '(ts|tsx|js|jsx)')
        );
        return regex.test(fullPath);
      });

      if (isTestFile) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

// Step 6: Run verification
function verifyMigration() {
  console.log('✅ Verifying migration...');

  if (!MIGRATION_CONFIG.dryRun) {
    try {
      // Try running Vitest
      execSync('npx vitest run --no-coverage', {
        stdio: 'pipe',
        timeout: 30000,
      });
      console.log('  ✅ Vitest is working!');
    } catch (error) {
      console.error('  ❌ Vitest verification failed. You may need to fix some tests manually.');
      console.error('     Run "npm test" to see specific errors.');
    }
  }

  console.log();
}

// Step 7: Create migration report
function createMigrationReport() {
  console.log('📊 Migration Report');
  console.log('═══════════════════');

  const testFiles = findTestFiles();
  const stats = {
    totalTestFiles: testFiles.length,
    vitestConfigCreated: fs.existsSync('vitest.config.ts'),
    backupCreated: fs.existsSync(MIGRATION_CONFIG.backupDir),
    dryRun: MIGRATION_CONFIG.dryRun,
  };

  console.log(`  Test files found: ${stats.totalTestFiles}`);
  console.log(`  Vitest config: ${stats.vitestConfigCreated ? '✅' : '❌'}`);
  console.log(`  Backup created: ${stats.backupCreated ? '✅' : '❌'}`);
  console.log(`  Mode: ${stats.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log();

  if (stats.dryRun) {
    console.log('ℹ️  This was a dry run. No changes were made.');
    console.log('   Run without --dry-run to perform the actual migration.');
  } else {
    console.log('✨ Migration complete!');
    console.log('   Your backup is stored in:', MIGRATION_CONFIG.backupDir);
    console.log('   Run "npm test" to verify everything works.');
  }

  console.log();
}

// Main migration flow
async function migrate() {
  try {
    createBackup();
    updatePackageJson();
    migrateTestFiles();
    installDependencies();
    cleanupJestFiles();
    verifyMigration();
    createMigrationReport();
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Your backup is in:', MIGRATION_CONFIG.backupDir);
    console.error('   You can restore from backup and try again.');
    process.exit(1);
  }
}

// Run migration
migrate();
