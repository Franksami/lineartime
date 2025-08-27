#!/usr/bin/env node
/**
 * Internationalization Governance Check
 * Validates i18n completeness and RTL support
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SUPPORTED_LOCALES = ['en', 'ar', 'he', 'es', 'fr', 'de', 'ja', 'zh'];

class I18nGovernor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.translationStats = new Map();
  }

  async runCheck() {
    console.log('🌍 Starting i18n governance check...\n');

    try {
      await this.checkTranslationCompleteness();
      await this.checkRTLSupport();
      await this.checkHardcodedText();
      await this.checkLocaleConfiguration();
      await this.checkDateTimeFormatting();
      await this.checkNumberFormatting();

      this.generateReport();
      
      if (this.errors.length > 0) {
        console.error('\n❌ i18n governance failed!');
        console.error('Fix the following issues:\n');
        this.errors.forEach(error => console.error(`  • ${error}`));
        process.exit(1);
      }

      console.log('\n✅ i18n governance passed!');
      return true;

    } catch (error) {
      console.error('\n💥 i18n check failed:', error.message);
      process.exit(1);
    }
  }

  async checkTranslationCompleteness() {
    console.log('📝 Checking translation completeness...');
    
    try {
      // Find translation files
      const translationFiles = glob.sync('**/messages/*.json', { 
        cwd: process.cwd(),
        ignore: ['node_modules/**']
      });
      
      if (translationFiles.length === 0) {
        this.warnings.push('No translation files found - ensure i18n is properly configured');
        return;
      }

      // Analyze each locale
      const baseTranslation = this.loadTranslations(translationFiles[0]);
      const baseKeys = this.extractKeys(baseTranslation);
      
      this.passed.push(`Base translation loaded with ${baseKeys.size} keys`);

      for (const file of translationFiles) {
        const locale = this.extractLocaleFromPath(file);
        const translation = this.loadTranslations(file);
        const keys = this.extractKeys(translation);
        
        const completeness = (keys.size / baseKeys.size) * 100;
        this.translationStats.set(locale, {
          total: baseKeys.size,
          translated: keys.size,
          completeness: Math.round(completeness)
        });

        if (completeness < 80) {
          this.warnings.push(`Translation incomplete for ${locale}: ${Math.round(completeness)}%`);
        } else {
          this.passed.push(`Translation complete for ${locale}: ${Math.round(completeness)}%`);
        }
      }

    } catch (error) {
      this.warnings.push(`Translation completeness check failed: ${error.message}`);
    }
  }

  async checkRTLSupport() {
    console.log('↔️ Checking RTL support...');
    
    try {
      // Check for RTL CSS
      const rtlPatterns = [
        'dir="rtl"',
        '[dir="rtl"]',
        'rtl:',
        'ltr:',
        'text-right',
        'text-left'
      ];

      let rtlSupport = 0;
      
      for (const pattern of rtlPatterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type css --type tsx --type jsx --type html`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            rtlSupport++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (rtlSupport >= 3) {
        this.passed.push(`RTL support detected (${rtlSupport}/6 patterns)`);
      } else {
        this.warnings.push(`Limited RTL support (${rtlSupport}/6 patterns) - consider adding RTL styles`);
      }

      // Check for logical properties
      const logicalProperties = [
        'margin-inline',
        'padding-inline',
        'border-inline',
        'inset-inline'
      ];

      let logicalSupport = 0;
      
      for (const property of logicalProperties) {
        try {
          const result = execSync(
            `rg -n "${property}" --type css --type tsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            logicalSupport++;
          }
        } catch (e) {
          // Property not found
        }
      }

      if (logicalSupport >= 2) {
        this.passed.push(`CSS logical properties used (${logicalSupport}/4)`);
      } else {
        this.warnings.push(`Consider using CSS logical properties for better RTL support`);
      }

    } catch (error) {
      this.warnings.push(`RTL support check failed: ${error.message}`);
    }
  }

  async checkHardcodedText() {
    console.log('🔤 Checking for hardcoded text...');
    
    try {
      // Check for potential hardcoded text in JSX
      const result = execSync(
        'rg -n ">[A-Z][a-z ]{10,}<" --type tsx --type jsx components/ | head -20',
        { encoding: 'utf8' }
      );
      
      if (result.trim()) {
        const hardcodedCount = result.split('\n').length;
        this.warnings.push(`Potential hardcoded text found (${hardcodedCount} instances) - consider using translation keys`);
      } else {
        this.passed.push('No obvious hardcoded text patterns found');
      }

      // Check for translation function usage
      const translationPatterns = ['t(', 'useTranslations', 'formatMessage'];
      let translationUsage = 0;
      
      for (const pattern of translationPatterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type ts --type tsx --type js --type jsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            translationUsage++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (translationUsage >= 1) {
        this.passed.push(`Translation functions in use (${translationUsage}/3 patterns)`);
      } else {
        this.warnings.push('No translation function usage detected - ensure i18n is implemented');
      }

    } catch (error) {
      this.warnings.push(`Hardcoded text check failed: ${error.message}`);
    }
  }

  async checkLocaleConfiguration() {
    console.log('⚙️ Checking locale configuration...');
    
    const configFiles = [
      'next-intl.config.js',
      'i18n.config.js',
      'intl.config.ts',
      'next.config.ts'
    ];

    let configFound = false;
    
    for (const file of configFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        configFound = true;
        this.passed.push(`i18n configuration found: ${file}`);
        break;
      }
    }

    if (!configFound) {
      this.warnings.push('No i18n configuration file found');
    }

    // Check middleware
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      if (content.includes('intl') || content.includes('locale')) {
        this.passed.push('i18n middleware configured');
      } else {
        this.warnings.push('Middleware exists but may not include i18n routing');
      }
    } else {
      this.warnings.push('No middleware file found for i18n routing');
    }
  }

  async checkDateTimeFormatting() {
    console.log('📅 Checking date/time formatting...');
    
    try {
      // Check for internationalized date formatting
      const datePatterns = [
        'Intl.DateTimeFormat',
        'toLocaleDateString',
        'format(',
        'date-fns/locale'
      ];

      let dateFormatting = 0;
      
      for (const pattern of datePatterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type ts --type tsx --type js --type jsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            dateFormatting++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (dateFormatting >= 2) {
        this.passed.push(`Internationalized date formatting detected (${dateFormatting}/4 patterns)`);
      } else {
        this.warnings.push(`Limited date formatting i18n (${dateFormatting}/4 patterns) - consider locale-aware formatting`);
      }

    } catch (error) {
      this.warnings.push(`Date formatting check failed: ${error.message}`);
    }
  }

  async checkNumberFormatting() {
    console.log('🔢 Checking number formatting...');
    
    try {
      // Check for internationalized number formatting
      const numberPatterns = [
        'Intl.NumberFormat',
        'toLocaleString',
        'currency',
        'decimal'
      ];

      let numberFormatting = 0;
      
      for (const pattern of numberPatterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type ts --type tsx --type js --type jsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            numberFormatting++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (numberFormatting >= 2) {
        this.passed.push(`Internationalized number formatting detected (${numberFormatting}/4 patterns)`);
      } else {
        this.warnings.push(`Limited number formatting i18n (${numberFormatting}/4 patterns) - consider locale-aware formatting`);
      }

    } catch (error) {
      this.warnings.push(`Number formatting check failed: ${error.message}`);
    }
  }

  loadTranslations(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return {};
    }
  }

  extractKeys(obj, prefix = '') {
    const keys = new Set();
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedKeys = this.extractKeys(obj[key], fullKey);
        nestedKeys.forEach(k => keys.add(k));
      } else {
        keys.add(fullKey);
      }
    }
    
    return keys;
  }

  extractLocaleFromPath(filePath) {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace('.json', '');
  }

  generateReport() {
    console.log('\n📊 i18n Governance Report:');
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);

    // Translation completeness table
    if (this.translationStats.size > 0) {
      console.log('\n🌐 Translation Completeness:');
      this.translationStats.forEach((stats, locale) => {
        const bar = '█'.repeat(Math.floor(stats.completeness / 10)) + 
                   '░'.repeat(10 - Math.floor(stats.completeness / 10));
        console.log(`   ${locale.padEnd(4)} ${bar} ${stats.completeness}% (${stats.translated}/${stats.total})`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (this.passed.length > 0) {
      console.log('\n✅ Passed checks:');
      this.passed.forEach(check => console.log(`   • ${check}`));
    }

    // i18n score
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const score = totalChecks > 0 ? Math.round((this.passed.length / totalChecks) * 100) : 0;
    console.log(`\n🌍 i18n Score: ${score}%`);
  }
}

// Run the check
if (require.main === module) {
  const governor = new I18nGovernor();
  governor.runCheck();
}

module.exports = I18nGovernor;