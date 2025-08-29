#!/usr/bin/env node
/**
 * Motion System Governance Check
 * Validates motion system compliance and performance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOTION_STANDARDS = {
  reducedMotion: {
    required: true,
    patterns: ['prefers-reduced-motion', 'useReducedMotion', 'motion-reduce'],
  },
  performance: {
    gpuAccelerated: ['transform', 'opacity', 'filter'],
    expensive: ['box-shadow', 'border-radius', 'background'],
    maxDuration: 800, // milliseconds
  },
  accessibility: {
    maxVestibularDuration: 500,
    parallaxLimit: 3,
    flashLimit: 3, // flashes per second
  },
};

class MotionGovernor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.motionStats = {
      animations: 0,
      transitions: 0,
      reducedMotionSupport: 0,
      performanceOptimized: 0,
    };
  }

  async runCheck() {
    console.log('🎬 Starting motion system governance check...\n');

    try {
      await this.checkReducedMotionSupport();
      await this.checkAnimationPerformance();
      await this.checkMotionTokens();
      await this.checkVestibularSafety();
      await this.checkInteractionFeedback();
      await this.checkMotionConsistency();

      this.generateReport();

      if (this.errors.length > 0) {
        console.error('\n❌ Motion system governance failed!');
        console.error('Fix the following issues:\n');
        this.errors.forEach((error) => console.error(`  • ${error}`));
        process.exit(1);
      }

      console.log('\n✅ Motion system governance passed!');
      return true;
    } catch (error) {
      console.error('\n💥 Motion system check failed:', error.message);
      process.exit(1);
    }
  }

  async checkReducedMotionSupport() {
    console.log('♿ Checking reduced motion support...');

    try {
      // Check for reduced motion patterns
      const patterns = MOTION_STANDARDS.reducedMotion.patterns;
      let supportCount = 0;

      for (const pattern of patterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type css --type ts --type tsx --type js --type jsx`,
            { encoding: 'utf8' }
          );

          if (result.trim()) {
            supportCount++;
            this.motionStats.reducedMotionSupport++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (supportCount >= 2) {
        this.passed.push(`Reduced motion support implemented (${supportCount}/3 patterns)`);
      } else if (supportCount >= 1) {
        this.warnings.push(
          `Limited reduced motion support (${supportCount}/3 patterns) - consider adding more`
        );
      } else {
        this.errors.push('No reduced motion support found - accessibility requirement');
      }

      // Check for motion preference hook
      if (
        fs.existsSync('hooks/useReducedMotion.ts') ||
        fs.existsSync('hooks/useReducedMotion.js')
      ) {
        this.passed.push('useReducedMotion hook found');
      } else {
        this.warnings.push('useReducedMotion hook not found - consider creating one');
      }
    } catch (error) {
      this.warnings.push(`Reduced motion check failed: ${error.message}`);
    }
  }

  async checkAnimationPerformance() {
    console.log('⚡ Checking animation performance...');

    try {
      // Check for GPU-accelerated properties
      const gpuProperties = MOTION_STANDARDS.performance.gpuAccelerated;
      let gpuOptimized = 0;

      for (const property of gpuProperties) {
        try {
          const result = execSync(
            `rg -n "animate.*${property}|transition.*${property}" --type css --type tsx`,
            { encoding: 'utf8' }
          );

          if (result.trim()) {
            gpuOptimized++;
            this.motionStats.performanceOptimized++;
          }
        } catch (e) {
          // Property not found
        }
      }

      if (gpuOptimized >= 2) {
        this.passed.push(`GPU-accelerated animations detected (${gpuOptimized}/3)`);
      } else {
        this.warnings.push(
          `Limited GPU optimization (${gpuOptimized}/3) - prefer transform/opacity`
        );
      }

      // Check for expensive properties
      const expensiveProperties = MOTION_STANDARDS.performance.expensive;
      let expensiveAnimations = 0;

      for (const property of expensiveProperties) {
        try {
          const result = execSync(
            `rg -n "animate.*${property}|transition.*${property}" --type css --type tsx`,
            { encoding: 'utf8' }
          );

          if (result.trim()) {
            expensiveAnimations++;
          }
        } catch (e) {
          // Property not found
        }
      }

      if (expensiveAnimations > 2) {
        this.warnings.push(
          `Expensive animation properties detected (${expensiveAnimations}) - consider alternatives`
        );
      } else if (expensiveAnimations === 0) {
        this.passed.push('No expensive animation properties found');
      }

      // Check for will-change usage
      try {
        const result = execSync('rg -n "will-change" --type css --type tsx', { encoding: 'utf8' });

        if (result.trim()) {
          this.passed.push('will-change property usage detected');
        }
      } catch (e) {
        this.warnings.push('Consider using will-change for complex animations');
      }
    } catch (error) {
      this.warnings.push(`Animation performance check failed: ${error.message}`);
    }
  }

  async checkMotionTokens() {
    console.log('🎨 Checking motion design tokens...');

    try {
      // Check for motion token files
      const motionTokenFiles = [
        'design-tokens/motion/transitions.json',
        'design-tokens/motion/animations.json',
        'design-tokens/motion/durations.json',
        'design-tokens/motion/easings.json',
      ];

      let tokenFiles = 0;

      for (const file of motionTokenFiles) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          tokenFiles++;

          // Validate token structure
          const content = JSON.parse(fs.readFileSync(file, 'utf8'));
          this.validateMotionTokens(content, path.basename(file));
        }
      }

      if (tokenFiles >= 2) {
        this.passed.push(`Motion design tokens found (${tokenFiles}/4 files)`);
      } else if (tokenFiles >= 1) {
        this.warnings.push(`Limited motion tokens (${tokenFiles}/4 files) - consider adding more`);
      } else {
        this.warnings.push(
          'No motion design tokens found - consider creating motion system tokens'
        );
      }
    } catch (error) {
      this.warnings.push(`Motion tokens check failed: ${error.message}`);
    }
  }

  async checkVestibularSafety() {
    console.log('🌀 Checking vestibular safety...');

    try {
      // Check for potentially problematic animations
      const vestibularPatterns = [
        'rotate\\(',
        'rotateX\\(',
        'rotateY\\(',
        'rotateZ\\(',
        'perspective\\(',
        'parallax',
      ];

      let vestibularAnimations = 0;

      for (const pattern of vestibularPatterns) {
        try {
          const result = execSync(`rg -n "${pattern}" --type css --type ts --type tsx`, {
            encoding: 'utf8',
          });

          if (result.trim()) {
            vestibularAnimations++;
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (vestibularAnimations > 0) {
        this.warnings.push(
          `Vestibular motion detected (${vestibularAnimations} instances) - ensure reduced motion alternatives`
        );
      } else {
        this.passed.push('No vestibular motion patterns detected');
      }

      // Check for flash/strobe effects
      try {
        const result = execSync('rg -n "blink|flash|strobe" --type css --type ts --type tsx', {
          encoding: 'utf8',
        });

        if (result.trim()) {
          this.warnings.push(
            'Potential flash/strobe effects detected - ensure accessibility compliance'
          );
        } else {
          this.passed.push('No flash/strobe effects detected');
        }
      } catch (e) {
        this.passed.push('No flash/strobe effects detected');
      }
    } catch (error) {
      this.warnings.push(`Vestibular safety check failed: ${error.message}`);
    }
  }

  async checkInteractionFeedback() {
    console.log('👆 Checking interaction feedback...');

    try {
      // Check for hover effects
      const hoverCount = this.countPattern(':hover', 'Hover effects');

      // Check for focus effects
      const focusCount = this.countPattern(':focus', 'Focus effects');

      // Check for active effects
      const activeCount = this.countPattern(':active', 'Active effects');

      const totalInteractions = hoverCount + focusCount + activeCount;

      if (totalInteractions >= 10) {
        this.passed.push(`Rich interaction feedback (${totalInteractions} effects)`);
      } else if (totalInteractions >= 5) {
        this.warnings.push(
          `Moderate interaction feedback (${totalInteractions} effects) - consider adding more`
        );
      } else {
        this.warnings.push(
          `Limited interaction feedback (${totalInteractions} effects) - improve user experience`
        );
      }
    } catch (error) {
      this.warnings.push(`Interaction feedback check failed: ${error.message}`);
    }
  }

  async checkMotionConsistency() {
    console.log('⚖️ Checking motion consistency...');

    try {
      // Check for consistent timing functions
      const timingFunctions = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier'];

      let timingUsage = new Map();

      for (const timing of timingFunctions) {
        try {
          const result = execSync(`rg -n "${timing}" --type css --type tsx`, { encoding: 'utf8' });

          if (result.trim()) {
            const count = result.split('\n').length;
            timingUsage.set(timing, count);
          }
        } catch (e) {
          // Timing function not found
        }
      }

      const totalUsage = Array.from(timingUsage.values()).reduce((sum, count) => sum + count, 0);

      if (totalUsage >= 5) {
        this.passed.push(`Motion timing functions in use (${totalUsage} instances)`);

        // Check for dominance of one timing function (consistency)
        const maxUsage = Math.max(...timingUsage.values());
        const consistency = maxUsage / totalUsage;

        if (consistency > 0.6) {
          this.passed.push('Good timing function consistency');
        } else {
          this.warnings.push('Mixed timing functions - consider standardizing');
        }
      } else {
        this.warnings.push('Limited timing function usage - consider motion design system');
      }
    } catch (error) {
      this.warnings.push(`Motion consistency check failed: ${error.message}`);
    }
  }

  countPattern(pattern, description) {
    try {
      const result = execSync(`rg -n "${pattern}" --type css --type tsx`, { encoding: 'utf8' });

      return result.trim() ? result.split('\n').length : 0;
    } catch (e) {
      return 0;
    }
  }

  validateMotionTokens(content, fileName) {
    let tokenCount = 0;

    const traverse = (obj) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key].value && obj[key].type) {
            tokenCount++;

            // Validate duration values
            if (obj[key].type === 'duration' || key.includes('duration')) {
              const value = obj[key].value;
              if (typeof value === 'string' && value.includes('ms')) {
                const duration = parseInt(value);
                if (duration > MOTION_STANDARDS.performance.maxDuration) {
                  this.warnings.push(`Long animation duration in ${fileName}: ${duration}ms`);
                }
              }
            }
          }
          traverse(obj[key]);
        }
      }
    };

    traverse(content);

    if (tokenCount > 0) {
      this.passed.push(`Motion tokens validated in ${fileName} (${tokenCount} tokens)`);
    }
  }

  generateReport() {
    console.log('\n📊 Motion System Governance Report:');
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);

    // Motion statistics
    console.log('\n🎬 Motion Statistics:');
    console.log(`   Reduced Motion Support: ${this.motionStats.reducedMotionSupport}`);
    console.log(`   Performance Optimized: ${this.motionStats.performanceOptimized}`);

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    if (this.passed.length > 0) {
      console.log('\n✅ Passed checks:');
      this.passed.forEach((check) => console.log(`   • ${check}`));
    }

    // Motion score
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const score = totalChecks > 0 ? Math.round((this.passed.length / totalChecks) * 100) : 0;
    console.log(`\n🎬 Motion Score: ${score}%`);
  }
}

// Run the check
if (require.main === module) {
  const governor = new MotionGovernor();
  governor.runCheck();
}

module.exports = MotionGovernor;
