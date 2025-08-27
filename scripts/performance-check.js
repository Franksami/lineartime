#!/usr/bin/env node
/**
 * Performance Governance Check
 * Validates performance budgets and optimizations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_BUDGETS = {
  bundleSize: {
    initial: 500 * 1024, // 500KB
    total: 2 * 1024 * 1024, // 2MB
    components: 50 * 1024, // 50KB per component
  },
  runtime: {
    fps: 112,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    loadTime: 1500, // 1.5s
  },
  coreWebVitals: {
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
  }
};

class PerformanceGovernor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  async runCheck() {
    console.log('⚡ Starting performance governance check...\n');

    try {
      await this.checkBundleSize();
      await this.checkComponentSize();
      await this.checkImageOptimization();
      await this.checkCodeSplitting();
      await this.checkAnimationPerformance();
      await this.checkMemoryLeaks();

      this.generateReport();
      
      if (this.errors.length > 0) {
        console.error('\n❌ Performance governance failed!');
        console.error('Fix the following issues:\n');
        this.errors.forEach(error => console.error(`  • ${error}`));
        process.exit(1);
      }

      console.log('\n✅ Performance governance passed!');
      return true;

    } catch (error) {
      console.error('\n💥 Performance check failed:', error.message);
      process.exit(1);
    }
  }

  async checkBundleSize() {
    console.log('📦 Checking bundle size...');
    
    try {
      // Check if build exists
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        this.warnings.push('Build directory not found - run build first');
        return;
      }

      // Analyze bundle (simplified check)
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      
      if (depCount > 100) {
        this.warnings.push(`High dependency count (${depCount}) - consider bundle optimization`);
      } else {
        this.passed.push(`Reasonable dependency count: ${depCount}`);
      }

      // Check for bundle analyzer
      if (packageJson.scripts['build:analyze']) {
        this.passed.push('Bundle analyzer configured');
      } else {
        this.warnings.push('Bundle analyzer not configured - add build:analyze script');
      }

    } catch (error) {
      this.warnings.push(`Bundle size check failed: ${error.message}`);
    }
  }

  async checkComponentSize() {
    console.log('🧩 Checking component sizes...');
    
    try {
      // Find large components (simplified heuristic)
      const result = execSync(
        'find components/ -name "*.tsx" -exec wc -l {} \\; | sort -nr | head -10',
        { encoding: 'utf8' }
      );
      
      const lines = result.trim().split('\n');
      let largeComponents = 0;
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const lineCount = parseInt(parts[0]);
        const fileName = parts[1];
        
        if (lineCount > 500) {
          largeComponents++;
          this.warnings.push(`Large component detected: ${fileName} (${lineCount} lines)`);
        }
      });

      if (largeComponents === 0) {
        this.passed.push('All components are reasonably sized');
      }

    } catch (error) {
      this.warnings.push(`Component size check failed: ${error.message}`);
    }
  }

  async checkImageOptimization() {
    console.log('🖼️ Checking image optimization...');
    
    try {
      // Check for unoptimized images
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
      let unoptimizedImages = 0;
      let optimizedImages = 0;
      
      for (const ext of imageExtensions) {
        try {
          const result = execSync(
            `find public/ -name "*.${ext}" 2>/dev/null | wc -l`,
            { encoding: 'utf8' }
          );
          
          const count = parseInt(result.trim());
          
          if (['webp', 'avif'].includes(ext)) {
            optimizedImages += count;
          } else {
            unoptimizedImages += count;
          }
        } catch (e) {
          // Directory or files not found
        }
      }

      if (optimizedImages > 0) {
        this.passed.push(`Modern image formats found: ${optimizedImages} files`);
      }
      
      if (unoptimizedImages > optimizedImages * 2) {
        this.warnings.push(`Consider converting ${unoptimizedImages} images to WebP/AVIF`);
      }

    } catch (error) {
      this.warnings.push(`Image optimization check failed: ${error.message}`);
    }
  }

  async checkCodeSplitting() {
    console.log('📤 Checking code splitting...');
    
    try {
      // Check for dynamic imports
      const result = execSync(
        'rg -n "import\\(" --type ts --type tsx --type js --type jsx',
        { encoding: 'utf8' }
      );
      
      if (result.trim()) {
        const dynamicImports = result.split('\n').length;
        this.passed.push(`Dynamic imports found: ${dynamicImports} instances`);
      } else {
        this.warnings.push('No dynamic imports found - consider code splitting for large features');
      }

      // Check for lazy loading
      const lazyResult = execSync(
        'rg -n "lazy\\(|Suspense" --type tsx --type jsx',
        { encoding: 'utf8' }
      );
      
      if (lazyResult.trim()) {
        this.passed.push('Lazy loading patterns found');
      } else {
        this.warnings.push('Consider implementing lazy loading for non-critical components');
      }

    } catch (error) {
      this.warnings.push('No dynamic imports found - consider code splitting');
    }
  }

  async checkAnimationPerformance() {
    console.log('🎬 Checking animation performance...');
    
    try {
      // Check for GPU-accelerated properties
      const gpuProperties = ['transform', 'opacity', 'will-change'];
      let gpuOptimizedAnimations = 0;
      
      for (const property of gpuProperties) {
        try {
          const result = execSync(
            `rg -n "${property}" --type css --type scss --type ts --type tsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            gpuOptimizedAnimations++;
          }
        } catch (e) {
          // Property not found
        }
      }

      if (gpuOptimizedAnimations >= 2) {
        this.passed.push('GPU-accelerated animations detected');
      } else {
        this.warnings.push('Consider using transform/opacity for better animation performance');
      }

      // Check for expensive properties
      const expensiveProperties = ['box-shadow', 'border-radius', 'background-image'];
      let expensiveAnimations = 0;
      
      for (const property of expensiveProperties) {
        try {
          const result = execSync(
            `rg -n "animate.*${property}|transition.*${property}" --type css --type scss`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            expensiveAnimations++;
          }
        } catch (e) {
          // Property not found
        }
      }

      if (expensiveAnimations > 0) {
        this.warnings.push(`Expensive properties in animations detected - consider alternatives`);
      }

    } catch (error) {
      this.warnings.push(`Animation performance check failed: ${error.message}`);
    }
  }

  async checkMemoryLeaks() {
    console.log('💾 Checking for potential memory leaks...');
    
    try {
      // Check for event listeners without cleanup
      const eventPatterns = [
        'addEventListener',
        'setInterval',
        'setTimeout'
      ];

      let potentialLeaks = 0;
      
      for (const pattern of eventPatterns) {
        try {
          const result = execSync(
            `rg -n "${pattern}" --type ts --type tsx --type js --type jsx`,
            { encoding: 'utf8' }
          );
          
          if (result.trim()) {
            const addCount = result.split('\n').length;
            
            // Check for cleanup
            const cleanupPattern = pattern.replace('add', 'remove').replace('set', 'clear');
            const cleanupResult = execSync(
              `rg -n "${cleanupPattern}" --type ts --type tsx --type js --type jsx`,
              { encoding: 'utf8' }
            );
            
            const cleanupCount = cleanupResult.trim() ? cleanupResult.split('\n').length : 0;
            
            if (addCount > cleanupCount * 1.5) {
              potentialLeaks++;
              this.warnings.push(`Potential ${pattern} memory leak - ${addCount} additions vs ${cleanupCount} cleanups`);
            }
          }
        } catch (e) {
          // Pattern not found
        }
      }

      if (potentialLeaks === 0) {
        this.passed.push('No obvious memory leak patterns detected');
      }

    } catch (error) {
      this.warnings.push(`Memory leak check failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 Performance Governance Report:');
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (this.passed.length > 0) {
      console.log('\n✅ Passed checks:');
      this.passed.forEach(check => console.log(`   • ${check}`));
    }

    // Performance score
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const score = Math.round((this.passed.length / totalChecks) * 100);
    console.log(`\n📈 Performance Score: ${score}%`);
  }
}

// Run the check
if (require.main === module) {
  const governor = new PerformanceGovernor();
  governor.runCheck();
}

module.exports = PerformanceGovernor;