#!/usr/bin/env node
/**
 * Command Center Deprecated File Detection System
 *
 * Automatically detects and reports deprecated files, unused imports,
 * dead code, and outdated dependencies for clean codebase maintenance.
 *
 * Part of the comprehensive quality assurance system for Command Center development.
 *
 * @version 1.0.0 (Automated Cleanup Release)
 * @author Command Center Quality Team
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

// ASCII Architecture Documentation
const CLEANUP_ARCHITECTURE = `
CHEATCAL AUTOMATED CLEANUP SYSTEM
═══════════════════════════════════════════════════════════════

COMPREHENSIVE CODE QUALITY MAINTENANCE:
┌─────────────────────────────────────────────────────────────┐
│                AUTOMATED DETECTION ENGINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔍 DEPRECATED FILE DETECTION:                              │
│ ├── Unused component files                                 │
│ ├── Dead code and functions                                │
│ ├── Outdated documentation                                 │
│ └── Legacy implementation files                            │
│                                                             │
│ 📦 DEPENDENCY ANALYSIS:                                    │
│ ├── Unused npm packages                                    │
│ ├── Outdated dependencies                                  │
│ ├── Security vulnerabilities                              │
│ └── Bundle size impact assessment                         │
│                                                             │
│ 🧹 AUTOMATED CLEANUP:                                     │
│ ├── Safe file removal recommendations                     │
│ ├── Import optimization                                    │
│ ├── Code deduplication                                    │
│ └── Performance optimization suggestions                   │
└─────────────────────────────────────────────────────────────┘
`;

class DeprecatedFileDetector {
  constructor() {
    this.projectRoot = process.cwd();
    this.deprecatedFiles = [];
    this.unusedImports = [];
    this.deadCode = [];
    this.outdatedDependencies = [];

    console.log('🔍 Command Center Deprecated File Detection initializing...');
    console.log(CLEANUP_ARCHITECTURE);
  }

  async detect() {
    console.log('🚀 Starting comprehensive deprecated file detection...\n');

    try {
      await this.detectUnusedFiles();
      await this.detectUnusedImports();
      await this.detectDeadCode();
      await this.detectOutdatedDependencies();
      await this.detectSecurityVulnerabilities();

      this.generateReport();

      console.log('\n✅ Deprecated file detection complete!');
      return {
        deprecatedFiles: this.deprecatedFiles,
        unusedImports: this.unusedImports,
        deadCode: this.deadCode,
        outdatedDependencies: this.outdatedDependencies,
      };
    } catch (error) {
      console.error('\n💥 Detection failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect Unused Files using Knip
   */
  async detectUnusedFiles() {
    console.log('📁 Detecting unused files...');

    try {
      // Use knip for dead code detection
      const knipOutput = execSync('npx knip --reporter json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      const knipResults = JSON.parse(knipOutput);

      // Extract unused files
      Object.keys(knipResults).forEach((file) => {
        const issues = knipResults[file];
        if (issues.unlisted || issues.unused) {
          this.deprecatedFiles.push({
            file,
            type: 'unused_file',
            reason: issues.unlisted ? 'Not listed in package.json' : 'No imports detected',
            safeToDelete: this.isSafeToDelete(file),
          });
        }
      });

      console.log(`   Found ${this.deprecatedFiles.length} potentially unused files`);
    } catch (error) {
      console.warn('   Knip analysis failed, using manual detection');
      await this.manualUnusedFileDetection();
    }
  }

  /**
   * Detect Unused Imports
   */
  async detectUnusedImports() {
    console.log('📥 Detecting unused imports...');

    try {
      // Get all TypeScript/JavaScript files
      const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
      });

      for (const file of files.slice(0, 50)) {
        // Limit for performance
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf8');

        const unusedImports = this.findUnusedImports(content, file);
        if (unusedImports.length > 0) {
          this.unusedImports.push({
            file,
            unusedImports,
            canAutoFix: true,
          });
        }
      }

      console.log(`   Found ${this.unusedImports.length} files with unused imports`);
    } catch (error) {
      console.error('   Unused import detection failed:', error.message);
    }
  }

  /**
   * Detect Dead Code Patterns
   */
  async detectDeadCode() {
    console.log('⚰️ Detecting dead code patterns...');

    const deadCodePatterns = [
      {
        pattern: /\/\* TODO:.*\*\/|\/\/ TODO:/g,
        type: 'todo_comments',
        severity: 'info',
      },
      {
        pattern: /console\.log|console\.debug/g,
        type: 'debug_statements',
        severity: 'warning',
      },
      {
        pattern: /function\s+\w+.*{[\s\S]*?\/\*\s*deprecated\s*\*\//gi,
        type: 'deprecated_functions',
        severity: 'high',
      },
      {
        pattern: /import.*from\s+['"][^'"]*deprecated[^'"]*['"]/g,
        type: 'deprecated_imports',
        severity: 'high',
      },
    ];

    try {
      const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.next/**'],
      });

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf8');

        deadCodePatterns.forEach(({ pattern, type, severity }) => {
          const matches = Array.from(content.matchAll(pattern));
          if (matches.length > 0) {
            this.deadCode.push({
              file,
              type,
              severity,
              instances: matches.length,
              locations: matches.map((match) => ({
                line: content.substring(0, match.index).split('\n').length,
                content: match[0],
              })),
            });
          }
        });
      }

      console.log(`   Found ${this.deadCode.length} dead code patterns`);
    } catch (error) {
      console.error('   Dead code detection failed:', error.message);
    }
  }

  /**
   * Detect Outdated Dependencies
   */
  async detectOutdatedDependencies() {
    console.log('📦 Detecting outdated dependencies...');

    try {
      // Use npm outdated for dependency analysis
      const outdatedOutput = execSync('pnpm outdated --format json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      const outdated = JSON.parse(outdatedOutput);

      Object.keys(outdated).forEach((pkg) => {
        const info = outdated[pkg];
        this.outdatedDependencies.push({
          package: pkg,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          severity: this.calculateUpdateSeverity(info),
          autoUpdateSafe: this.isAutoUpdateSafe(pkg, info),
        });
      });

      console.log(`   Found ${this.outdatedDependencies.length} outdated dependencies`);
    } catch (error) {
      console.warn('   Outdated dependency detection failed, continuing...');
    }
  }

  /**
   * Detect Security Vulnerabilities
   */
  async detectSecurityVulnerabilities() {
    console.log('🔒 Detecting security vulnerabilities...');

    try {
      const auditOutput = execSync('pnpm audit --audit-level moderate --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      const auditResults = JSON.parse(auditOutput);

      if (auditResults.vulnerabilities) {
        Object.keys(auditResults.vulnerabilities).forEach((pkg) => {
          const vuln = auditResults.vulnerabilities[pkg];
          this.securityIssues.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.title,
            fixAvailable: vuln.fixAvailable,
            autoFixable: vuln.severity !== 'critical',
          });
        });
      }

      console.log(`   Found ${(this.securityIssues || []).length} security vulnerabilities`);
    } catch (error) {
      console.warn('   Security audit failed:', error.message);
    }
  }

  /**
   * Generate Comprehensive Detection Report
   */
  generateReport() {
    console.log('\n📋 Command Center Cleanup Detection Report');
    console.log('='.repeat(50));

    // Deprecated Files Summary
    console.log('\n📁 Deprecated Files:');
    console.log(`   Total: ${this.deprecatedFiles.length}`);
    const safeToDelete = this.deprecatedFiles.filter((f) => f.safeToDelete);
    console.log(`   Safe to delete: ${safeToDelete.length}`);

    if (safeToDelete.length > 0) {
      console.log('\n   Safe deletion candidates:');
      safeToDelete.forEach((file) => {
        console.log(`   • ${file.file} (${file.reason})`);
      });
    }

    // Unused Imports Summary
    console.log('\n📥 Unused Imports:');
    console.log(`   Files affected: ${this.unusedImports.length}`);
    const autoFixable = this.unusedImports.filter((f) => f.canAutoFix);
    console.log(`   Auto-fixable: ${autoFixable.length}`);

    // Dead Code Summary
    console.log('\n⚰️ Dead Code Patterns:');
    const highSeverity = this.deadCode.filter((c) => c.severity === 'high');
    const warnings = this.deadCode.filter((c) => c.severity === 'warning');
    console.log(`   High severity: ${highSeverity.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    // Dependencies Summary
    console.log('\n📦 Outdated Dependencies:');
    console.log(`   Total outdated: ${this.outdatedDependencies.length}`);
    const autoUpdatable = this.outdatedDependencies.filter((d) => d.autoUpdateSafe);
    console.log(`   Auto-updatable: ${autoUpdatable.length}`);

    // Recommendations
    console.log('\n🎯 Cleanup Recommendations:');
    if (safeToDelete.length > 0) {
      console.log('   • Run automated cleanup to remove safe-to-delete files');
    }
    if (autoFixable.length > 0) {
      console.log('   • Run import cleanup to remove unused imports');
    }
    if (autoUpdatable.length > 0) {
      console.log('   • Run dependency updates for safe packages');
    }
    if (highSeverity.length > 0) {
      console.log('   • Address high-severity dead code patterns');
    }
  }

  // Helper Methods

  isSafeToDelete(file) {
    const safePaths = ['test-results', '.next', 'coverage', 'dist', 'build'];

    const unsafePaths = [
      'components/calendar/LinearCalendarHorizontal',
      'app/dashboard',
      'app/cheatcal',
      'convex',
      'lib/ai',
      'lib/marketplace',
    ];

    return (
      safePaths.some((safe) => file.includes(safe)) &&
      !unsafePaths.some((unsafe) => file.includes(unsafe))
    );
  }

  findUnusedImports(content, file) {
    const unusedImports = [];

    try {
      // Simple regex-based detection (could be enhanced with AST parsing)
      const importLines = content.match(/^import .* from .*;$/gm) || [];

      importLines.forEach((line) => {
        const importMatch = line.match(/import\s+{([^}]+)}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map((i) => i.trim());

          imports.forEach((imp) => {
            const cleanImp = imp.replace(/\s+as\s+\w+/, '');
            if (
              !content.includes(cleanImp) ||
              content.indexOf(cleanImp) === content.indexOf(line)
            ) {
              unusedImports.push(cleanImp);
            }
          });
        }
      });
    } catch (error) {
      console.warn(`Import analysis failed for ${file}:`, error.message);
    }

    return unusedImports;
  }

  calculateUpdateSeverity(info) {
    const currentMajor = parseInt(info.current.split('.')[0]);
    const latestMajor = parseInt(info.latest.split('.')[0]);

    if (latestMajor > currentMajor) return 'major';
    if (info.wanted !== info.current) return 'minor';
    return 'patch';
  }

  isAutoUpdateSafe(pkg, info) {
    const riskyPackages = ['react', 'react-dom', 'next', '@clerk/nextjs', 'convex'];

    if (riskyPackages.includes(pkg)) return false;

    const severity = this.calculateUpdateSeverity(info);
    return severity === 'patch' || severity === 'minor';
  }

  async manualUnusedFileDetection() {
    // Fallback manual detection when knip fails
    const potentialUnusedPatterns = [
      '**/*.backup.*',
      '**/*.old.*',
      '**/*.deprecated.*',
      '**/temp/**',
      '**/tmp/**',
    ];

    potentialUnusedPatterns.forEach((pattern) => {
      const matches = glob.sync(pattern, { cwd: this.projectRoot });
      matches.forEach((file) => {
        this.deprecatedFiles.push({
          file,
          type: 'potentially_unused',
          reason: 'Matches deprecated file pattern',
          safeToDelete: this.isSafeToDelete(file),
        });
      });
    });
  }
}

// CLI Usage
if (require.main === module) {
  const detector = new DeprecatedFileDetector();
  detector.detect().catch((error) => {
    console.error('💥 Detection failed:', error);
    process.exit(1);
  });
}

module.exports = DeprecatedFileDetector;
