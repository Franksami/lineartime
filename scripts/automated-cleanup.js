#!/usr/bin/env node
/**
 * CheatCal Automated Cleanup System
 * 
 * Performs safe automated cleanup of deprecated files, unused imports,
 * and outdated dependencies while preserving critical CheatCal infrastructure.
 * 
 * SAFETY-FIRST: Never touches core calendar foundation or critical components.
 * 
 * @version 1.0.0 (Automated Cleanup Release)
 * @author CheatCal Quality Team
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DeprecatedFileDetector = require('./detect-deprecated-files');

// ASCII Cleanup Architecture
const AUTOMATED_CLEANUP_ARCHITECTURE = `
CHEATCAL AUTOMATED CLEANUP SYSTEM
═══════════════════════════════════════════════════════════════

SAFE AUTOMATED MAINTENANCE:
┌─────────────────────────────────────────────────────────────┐
│                   SAFETY-FIRST CLEANUP                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔒 PROTECTED AREAS (NEVER TOUCH):                         │
│ ├── components/calendar/LinearCalendarHorizontal.tsx       │
│ ├── app/dashboard/** (Core foundation)                     │
│ ├── app/cheatcal/** (Revolutionary platform)              │
│ ├── convex/** (Backend infrastructure)                    │
│ ├── lib/ai/** (AI coordination engine)                    │
│ └── lib/marketplace/** (Business model core)              │
│                                                             │
│ ✅ SAFE CLEANUP ZONES:                                    │
│ ├── Test artifacts and temporary files                    │
│ ├── Unused development dependencies                       │ 
│ ├── Dead code in non-critical components                  │
│ ├── Outdated documentation and examples                   │
│ └── Build artifacts and cache files                       │
│                                                             │
│ 🔧 AUTOMATED OPERATIONS:                                  │
│ ├── File removal with safety verification                 │
│ ├── Import cleanup and optimization                       │
│ ├── Dependency updates with compatibility checking        │
│ └── Performance optimization with validation              │
└─────────────────────────────────────────────────────────────┘
`;

class AutomatedCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.detector = new DeprecatedFileDetector();
    this.cleanupResults = {
      filesDeleted: [],
      importsFixed: [],
      dependenciesUpdated: [],
      errors: []
    };

    console.log('🧹 CheatCal Automated Cleanup System initializing...');
    console.log(AUTOMATED_CLEANUP_ARCHITECTURE);
  }

  async performCleanup(options = {}) {
    const {
      dryRun = true,
      skipDependencyUpdates = false,
      skipFileDeletes = false,
      skipImportCleanup = false
    } = options;

    console.log(`🚀 Starting automated cleanup (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

    try {
      // First, detect all deprecated items
      const detectionResults = await this.detector.detect();

      if (!skipFileDeletes) {
        await this.cleanupDeprecatedFiles(detectionResults.deprecatedFiles, dryRun);
      }

      if (!skipImportCleanup) {
        await this.cleanupUnusedImports(detectionResults.unusedImports, dryRun);
      }

      if (!skipDependencyUpdates) {
        await this.updateDependencies(detectionResults.outdatedDependencies, dryRun);
      }

      await this.performMaintenanceTasks(dryRun);

      this.generateCleanupReport(dryRun);

      console.log(`\n✅ Automated cleanup ${dryRun ? 'simulation' : 'execution'} complete!`);
      return this.cleanupResults;

    } catch (error) {
      console.error('\n💥 Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean Up Deprecated Files
   */
  async cleanupDeprecatedFiles(deprecatedFiles, dryRun) {
    console.log('🗑️ Cleaning up deprecated files...');

    const safeFiles = deprecatedFiles.filter(f => f.safeToDelete && this.isUltraSafeToDelete(f.file));

    if (safeFiles.length === 0) {
      console.log('   No safe-to-delete files found');
      return;
    }

    console.log(`   Processing ${safeFiles.length} safe-to-delete files...`);

    for (const fileInfo of safeFiles) {
      try {
        const filePath = path.join(this.projectRoot, fileInfo.file);
        
        if (fs.existsSync(filePath)) {
          console.log(`   ${dryRun ? 'Would delete' : 'Deleting'}: ${fileInfo.file}`);
          
          if (!dryRun) {
            // Create backup before deletion
            await this.createFileBackup(filePath);
            fs.unlinkSync(filePath);
          }
          
          this.cleanupResults.filesDeleted.push(fileInfo.file);
        }
      } catch (error) {
        console.error(`   Failed to delete ${fileInfo.file}:`, error.message);
        this.cleanupResults.errors.push({
          operation: 'file_delete',
          target: fileInfo.file,
          error: error.message
        });
      }
    }
  }

  /**
   * Clean Up Unused Imports
   */
  async cleanupUnusedImports(unusedImports, dryRun) {
    console.log('📥 Cleaning up unused imports...');

    const autoFixableFiles = unusedImports.filter(f => f.canAutoFix);

    if (autoFixableFiles.length === 0) {
      console.log('   No auto-fixable import issues found');
      return;
    }

    console.log(`   Processing ${autoFixableFiles.length} files with unused imports...`);

    for (const fileInfo of autoFixableFiles.slice(0, 10)) { // Limit for safety
      try {
        const filePath = path.join(this.projectRoot, fileInfo.file);
        
        if (fs.existsSync(filePath)) {
          console.log(`   ${dryRun ? 'Would fix' : 'Fixing'}: ${fileInfo.file}`);
          
          if (!dryRun) {
            await this.fixUnusedImports(filePath, fileInfo.unusedImports);
          }
          
          this.cleanupResults.importsFixed.push(fileInfo.file);
        }
      } catch (error) {
        console.error(`   Failed to fix imports in ${fileInfo.file}:`, error.message);
        this.cleanupResults.errors.push({
          operation: 'import_fix',
          target: fileInfo.file,
          error: error.message
        });
      }
    }
  }

  /**
   * Update Outdated Dependencies
   */
  async updateDependencies(outdatedDependencies, dryRun) {
    console.log('📦 Updating dependencies...');

    const safeUpdates = outdatedDependencies.filter(d => d.autoUpdateSafe);

    if (safeUpdates.length === 0) {
      console.log('   No safe dependency updates available');
      return;
    }

    console.log(`   Processing ${safeUpdates.length} safe dependency updates...`);

    for (const dep of safeUpdates.slice(0, 5)) { // Limit for safety
      try {
        console.log(`   ${dryRun ? 'Would update' : 'Updating'}: ${dep.package} ${dep.current} → ${dep.wanted}`);
        
        if (!dryRun) {
          execSync(`pnpm update ${dep.package}@${dep.wanted}`, {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
        }
        
        this.cleanupResults.dependenciesUpdated.push({
          package: dep.package,
          from: dep.current,
          to: dep.wanted
        });
      } catch (error) {
        console.error(`   Failed to update ${dep.package}:`, error.message);
        this.cleanupResults.errors.push({
          operation: 'dependency_update',
          target: dep.package,
          error: error.message
        });
      }
    }
  }

  /**
   * Perform Additional Maintenance Tasks
   */
  async performMaintenanceTasks(dryRun) {
    console.log('🔧 Performing maintenance tasks...');

    const tasks = [
      {
        name: 'Clean npm cache',
        command: 'pnpm store prune',
        safe: true
      },
      {
        name: 'Remove node_modules duplicates',
        command: 'pnpm dedupe',
        safe: true
      },
      {
        name: 'Clean build artifacts',
        command: 'rm -rf .next/cache',
        safe: true
      }
    ];

    for (const task of tasks) {
      try {
        console.log(`   ${dryRun ? 'Would run' : 'Running'}: ${task.name}`);
        
        if (!dryRun && task.safe) {
          execSync(task.command, { cwd: this.projectRoot, stdio: 'pipe' });
        }
      } catch (error) {
        console.warn(`   Warning: ${task.name} failed:`, error.message);
      }
    }
  }

  // Safety and Utility Methods

  isUltraSafeToDelete(file) {
    const protectedPatterns = [
      'components/calendar/LinearCalendarHorizontal',
      'app/dashboard',
      'app/cheatcal', 
      'lib/ai',
      'lib/marketplace',
      'lib/community',
      'lib/viral',
      'convex',
      'package.json',
      'next.config',
      'tailwind.config'
    ];

    // Never delete protected files
    if (protectedPatterns.some(pattern => file.includes(pattern))) {
      return false;
    }

    const ultraSafePatterns = [
      'test-results/',
      '.playwright/',
      '.next/cache',
      'node_modules/.cache',
      '/tmp/',
      '.DS_Store',
      'Thumbs.db'
    ];

    return ultraSafePatterns.some(pattern => file.includes(pattern));
  }

  async createFileBackup(filePath) {
    const backupDir = path.join(this.projectRoot, '.cleanup-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);
    
    fs.copyFileSync(filePath, backupPath);
    console.log(`   Backup created: ${backupPath}`);
  }

  async fixUnusedImports(filePath, unusedImports) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Simple import removal (could be enhanced with AST parsing)
    unusedImports.forEach(unusedImport => {
      // Remove from destructured imports
      const destructuredPattern = new RegExp(`\\s*,?\\s*${unusedImport}\\s*,?`, 'g');
      content = content.replace(destructuredPattern, '');
      
      // Clean up empty destructuring
      content = content.replace(/import\s+{\s*,?\s*}\s+from\s+.*;/g, '');
      content = content.replace(/import\s+{\s*}\s+from\s+.*;/g, '');
    });

    fs.writeFileSync(filePath, content);
  }

  generateCleanupReport(dryRun) {
    console.log('\n📋 CheatCal Cleanup Results Report');
    console.log('=' .repeat(50));

    console.log(`\n🗑️ Files ${dryRun ? 'Would Be' : ''} Deleted: ${this.cleanupResults.filesDeleted.length}`);
    this.cleanupResults.filesDeleted.forEach(file => {
      console.log(`   • ${file}`);
    });

    console.log(`\n📥 Imports ${dryRun ? 'Would Be' : ''} Fixed: ${this.cleanupResults.importsFixed.length}`);
    this.cleanupResults.importsFixed.forEach(file => {
      console.log(`   • ${file}`);
    });

    console.log(`\n📦 Dependencies ${dryRun ? 'Would Be' : ''} Updated: ${this.cleanupResults.dependenciesUpdated.length}`);
    this.cleanupResults.dependenciesUpdated.forEach(dep => {
      console.log(`   • ${dep.package}: ${dep.from} → ${dep.to}`);
    });

    if (this.cleanupResults.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.cleanupResults.errors.length}`);
      this.cleanupResults.errors.forEach(error => {
        console.log(`   • ${error.operation} (${error.target}): ${error.error}`);
      });
    }

    if (dryRun) {
      console.log('\n🎯 To perform actual cleanup, run: node scripts/automated-cleanup.js --live');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('   Backups available in .cleanup-backups/ directory');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  const skipDeps = args.includes('--skip-deps');
  const skipFiles = args.includes('--skip-files');
  const skipImports = args.includes('--skip-imports');

  const cleanup = new AutomatedCleanup();
  
  try {
    await cleanup.performCleanup({
      dryRun,
      skipDependencyUpdates: skipDeps,
      skipFileDeletes: skipFiles, 
      skipImportCleanup: skipImports
    });
  } catch (error) {
    console.error('💥 Automated cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutomatedCleanup;