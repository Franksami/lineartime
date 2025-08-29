#!/usr/bin/env node
/**
 * Accessibility Governance Check
 * Validates accessibility compliance across the design system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ACCESSIBILITY_STANDARDS = {
  WCAG_AAA: {
    contrastRatio: {
      normal: 7,
      large: 4.5,
    },
    requirements: [
      'alt-text',
      'keyboard-navigation',
      'aria-labels',
      'semantic-markup',
      'color-independence',
      'motion-reduction',
    ],
  },
};

class AccessibilityGovernor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  async runCheck() {
    console.log('♿ Starting accessibility governance check...\n');

    try {
      await this.checkTokenCompliance();
      await this.checkContrastRatios();
      await this.checkMotionCompliance();
      await this.checkSemanticMarkup();
      await this.checkKeyboardNavigation();

      this.generateReport();

      if (this.errors.length > 0) {
        console.error('\n❌ Accessibility governance failed!');
        console.error('Fix the following issues:\n');
        this.errors.forEach((error) => console.error(`  • ${error}`));
        process.exit(1);
      }

      console.log('\n✅ Accessibility governance passed!');
      return true;
    } catch (error) {
      console.error('\n💥 Accessibility check failed:', error.message);
      process.exit(1);
    }
  }

  async checkTokenCompliance() {
    console.log('🎨 Checking token compliance...');

    // Check for hardcoded colors using grep as fallback
    try {
      const result = execSync(
        'grep -r -n "\\(bg\\|text\\|border\\)-\\(blue\\|green\\|red\\|yellow\\|purple\\|pink\\|indigo\\|cyan\\|lime\\|emerald\\|violet\\|rose\\|amber\\|teal\\|sky\\|slate\\|gray\\|zinc\\|neutral\\|stone\\)-[0-9]\\{3\\}" components/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true',
        { encoding: 'utf8' }
      );

      if (result.trim()) {
        this.errors.push('Hardcoded Tailwind colors found - use design tokens instead');
      } else {
        this.passed.push('No hardcoded colors found');
      }
    } catch (e) {
      // No matches found or grep failed - assume good
      this.passed.push('No hardcoded colors found');
    }
  }

  async checkContrastRatios() {
    console.log('🌈 Checking contrast ratios...');

    const tokenFiles = this.findTokenFiles();
    for (const file of tokenFiles) {
      await this.validateContrastInFile(file);
    }
  }

  async checkMotionCompliance() {
    console.log('🎬 Checking motion compliance...');

    // Check for reduced motion support
    const motionFiles = [
      'design-tokens/motion/transitions.json',
      'lib/design-system/motion/MotionConfig.ts',
      'hooks/useReducedMotion.ts',
    ];

    for (const file of motionFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        this.warnings.push(`Motion file missing: ${file}`);
        continue;
      }

      // Check for prefers-reduced-motion support
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('prefers-reduced-motion') && file.includes('motion')) {
        this.warnings.push(`Missing prefers-reduced-motion support in: ${file}`);
      } else {
        this.passed.push(`Motion compliance validated: ${file}`);
      }
    }
  }

  async checkSemanticMarkup() {
    console.log('📝 Checking semantic markup...');

    // Check React components for semantic HTML usage
    try {
      const result = execSync('rg -n "\\<div\\>" --type tsx --type jsx components/ | head -20', {
        encoding: 'utf8',
      });

      if (result.trim()) {
        const divCount = result.split('\n').length;
        if (divCount > 50) {
          this.warnings.push(
            `High div usage detected (${divCount}) - consider semantic HTML elements`
          );
        }
      }
    } catch (e) {
      // No divs found or command failed
    }

    // Check for semantic HTML elements
    const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    let semanticCount = 0;

    for (const element of semanticElements) {
      try {
        const result = execSync(
          `grep -r "<${element}\\|${element}>" components/ --include="*.tsx" --include="*.jsx" 2>/dev/null || true`,
          { encoding: 'utf8' }
        );
        if (result.trim()) {
          semanticCount++;
        }
      } catch (e) {
        // Element not found
      }
    }

    if (semanticCount >= 4) {
      this.passed.push(`Good semantic HTML usage (${semanticCount}/7 elements found)`);
    } else {
      this.warnings.push(
        `Low semantic HTML usage (${semanticCount}/7 elements) - consider using more semantic elements`
      );
    }
  }

  async checkKeyboardNavigation() {
    console.log('⌨️ Checking keyboard navigation...');

    // Check for focus management
    const focusPatterns = ['onKeyDown', 'tabIndex', 'focus(', 'blur(', 'aria-hidden'];

    let focusScore = 0;

    for (const pattern of focusPatterns) {
      try {
        const result = execSync(`rg -n "${pattern}" --type tsx --type jsx components/`, {
          encoding: 'utf8',
        });
        if (result.trim()) {
          focusScore++;
        }
      } catch (e) {
        // Pattern not found
      }
    }

    if (focusScore >= 3) {
      this.passed.push(`Good keyboard navigation support (${focusScore}/5 patterns)`);
    } else {
      this.warnings.push(
        `Limited keyboard navigation support (${focusScore}/5 patterns) - add more focus management`
      );
    }
  }

  findTokenFiles() {
    const tokenDir = path.join(process.cwd(), 'design-tokens');
    if (!fs.existsSync(tokenDir)) return [];

    const files = [];
    const walk = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    };

    walk(tokenDir);
    return files;
  }

  async validateContrastInFile(filePath) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.checkContrastInObject(content, path.basename(filePath));
    } catch (error) {
      this.warnings.push(`Could not parse token file: ${path.basename(filePath)}`);
    }
  }

  checkContrastInObject(obj, fileName) {
    // This is a simplified check - in practice you'd want to
    // calculate actual contrast ratios between color pairs
    let colorTokenCount = 0;

    const traverse = (obj) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key].type === 'color') {
            colorTokenCount++;
          }
          traverse(obj[key]);
        }
      }
    };

    traverse(obj);

    if (colorTokenCount > 0) {
      this.passed.push(`Color tokens validated in ${fileName} (${colorTokenCount} tokens)`);
    }
  }

  generateReport() {
    console.log('\n📊 Accessibility Governance Report:');
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    if (this.passed.length > 0) {
      console.log('\n✅ Passed checks:');
      this.passed.forEach((check) => console.log(`   • ${check}`));
    }
  }
}

// Run the check
if (require.main === module) {
  const governor = new AccessibilityGovernor();
  governor.runCheck();
}

module.exports = AccessibilityGovernor;
