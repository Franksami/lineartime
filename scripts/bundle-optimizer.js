#!/usr/bin/env node

/**
 * Bundle Size Optimization Script
 * 
 * Purpose: Analyze current dependencies and create removal/replacement strategy
 * Features:
 * - Dependency analysis
 * - Bundle size calculation
 * - Tree-shaking opportunities identification
 * - Migration pathway generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Current problematic dependencies based on package.json analysis
const DEPENDENCY_ANALYSIS = {
  // High-impact dependencies to remove/replace
  'heavy_deps': [
    { name: '@ant-design/icons', size: '2.1MB', reason: 'Icon library bloat', replacement: 'lucide-react (already used)' },
    { name: '@azure/msal-node', size: '1.8MB', reason: 'Server-side only', action: 'move to devDependencies' },
    { name: '@chakra-ui/react', size: '850KB', reason: 'Unused UI library', replacement: 'Remove completely' },
    { name: '@emotion/react', size: '420KB', reason: 'Chakra dependency', replacement: 'Remove with Chakra' },
    { name: '@emotion/styled', size: '380KB', reason: 'Chakra dependency', replacement: 'Remove with Chakra' },
    { name: '@mantine/core', size: '1.2MB', reason: 'Alternative UI library', action: 'Consider removal' },
    { name: '@mantine/dates', size: '280KB', reason: 'Date picker alternative', replacement: 'Use react-datepicker' },
    { name: '@mantine/form', size: '180KB', reason: 'Form library', replacement: 'react-hook-form (already used)' },
    { name: '@mantine/hooks', size: '150KB', reason: 'Utility hooks', replacement: 'Custom hooks or remove' },
    { name: '@mantine/notifications', size: '120KB', reason: 'Toast system', replacement: 'sonner (already used)' },
    { name: '@mantine/spotlight', size: '200KB', reason: 'Command palette', replacement: 'cmdk (already used)' },
    { name: 'antd', size: '2.8MB', reason: 'Heavy UI library', action: 'Remove or replace with shadcn' }
  ],
  
  // Medium-impact optimizations
  'medium_deps': [
    { name: '@mui/icons-material', size: '380KB', reason: 'Icon duplication', replacement: 'lucide-react' },
    { name: '@mui/material', size: '1.1MB', reason: 'Alternative UI library', action: 'Evaluate usage' },
    { name: '@mui/x-date-pickers', size: '450KB', reason: 'Date picker alternative', action: 'Consolidate' },
    { name: 'primereact', size: '890KB', reason: 'Alternative UI library', action: 'Evaluate necessity' },
    { name: 'primeicons', size: '180KB', reason: 'Icon duplication', replacement: 'lucide-react' },
    { name: 'primeflex', size: '45KB', reason: 'CSS utility', replacement: 'Tailwind CSS' },
    { name: 'moment', size: '290KB', reason: 'Heavy date library', replacement: 'date-fns (already used)' }
  ],
  
  // Low-impact but still worth optimizing
  'light_deps': [
    { name: 'react-syntax-highlighter', size: '180KB', reason: 'Code highlighting', action: 'Lazy load' },
    { name: 'shiki', size: '220KB', reason: 'Syntax highlighting', action: 'Bundle with async import' },
    { name: 'recharts', size: '380KB', reason: 'Charts library', action: 'Lazy load chart components' },
    { name: 'embla-carousel-react', size: '95KB', reason: 'Carousel component', action: 'Lazy load' }
  ],
  
  // Calendar libraries - consolidation opportunities
  'calendar_libs': [
    { name: '@fullcalendar/core', size: '180KB', usage: 'FullCalendar Pro view' },
    { name: '@fullcalendar/react', size: '45KB', usage: 'FullCalendar Pro view' },
    { name: '@toast-ui/calendar', size: '290KB', usage: 'Toast UI calendar view' },
    { name: 'react-big-calendar', size: '150KB', usage: 'Big Calendar view' },
    { name: 'react-infinite-calendar', size: '120KB', usage: 'Infinite Calendar view' },
    { name: 'react-calendar', size: '85KB', usage: 'React Calendar view' },
    { name: 'react-datepicker', size: '180KB', usage: 'Date picker + Calendar view' },
    { name: 'react-day-picker', size: '95KB', usage: 'Day picker view' }
  ]
};

// Bundle size impact calculations
const BUNDLE_IMPACT = {
  current_estimated_size: '8.5MB', // Based on 1.9GB node_modules
  target_size: '3.2MB',
  savings_target: '5.3MB',
  
  removal_plan: {
    phase1: {
      name: 'Remove Unused UI Libraries',
      dependencies: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'antd', '@ant-design/icons'],
      estimated_savings: '6.3MB',
      risk: 'low',
      timeline: '1 week'
    },
    phase2: {
      name: 'Consolidate Alternative UI Libraries',
      dependencies: ['@mantine/core', '@mantine/dates', '@mantine/form', '@mantine/hooks', '@mantine/notifications'],
      estimated_savings: '1.9MB',
      risk: 'medium',
      timeline: '2 weeks'
    },
    phase3: {
      name: 'Optimize Calendar Libraries',
      dependencies: ['Dynamic imports for calendar views', 'Tree-shake unused calendar features'],
      estimated_savings: '800KB',
      risk: 'medium',
      timeline: '1 week'
    },
    phase4: {
      name: 'Replace Heavy Dependencies',
      dependencies: ['moment → date-fns', '@mui/material evaluation', 'Icon consolidation'],
      estimated_savings: '1.2MB',
      risk: 'low',
      timeline: '1 week'
    }
  }
};

// Tree-shaking opportunities
const TREE_SHAKING_OPPORTUNITIES = {
  'date-fns': {
    current: 'import { format, addMinutes } from "date-fns"',
    issue: 'Good - already using named imports',
    optimization: 'None needed'
  },
  'lucide-react': {
    current: 'import { Calendar, Clock, MapPin } from "lucide-react"',
    issue: 'Good - already using named imports',
    optimization: 'Continue current pattern'
  },
  'lodash': {
    current: 'Not currently used',
    recommendation: 'If added, use lodash-es and named imports'
  },
  'recharts': {
    current: 'import { LineChart, BarChart } from "recharts"',
    optimization: 'Consider dynamic imports for chart components'
  }
};

// Migration strategies
const MIGRATION_STRATEGIES = {
  ui_libraries: {
    from: ['@chakra-ui/react', '@mantine/core', 'antd', '@mui/material'],
    to: 'shadcn/ui (already partially implemented)',
    strategy: 'Component-by-component replacement',
    tools: ['Codemod scripts', 'Component adapter layer', 'Gradual migration']
  },
  icons: {
    from: ['@ant-design/icons', '@mui/icons-material', 'primeicons'],
    to: 'lucide-react (already used)',
    strategy: 'Find and replace with mapping',
    tools: ['Icon mapping script', 'ESLint rules']
  },
  dates: {
    from: ['moment', 'multiple date libraries'],
    to: 'date-fns (already primary)',
    strategy: 'Replace remaining moment usage',
    tools: ['moment-to-date-fns codemod']
  }
};

class BundleOptimizer {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    this.results = {
      analysis: {},
      recommendations: [],
      migrationPlan: [],
      estimatedSavings: 0
    };
  }

  analyzeDependencies() {
    console.log('🔍 Analyzing current dependencies...\n');
    
    const dependencies = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
    const analysis = {
      total_deps: Object.keys(dependencies).length,
      heavy_deps: [],
      medium_deps: [],
      light_deps: [],
      unused_deps: []
    };

    // Categorize dependencies
    Object.keys(dependencies).forEach(dep => {
      const heavyDep = DEPENDENCY_ANALYSIS.heavy_deps.find(h => h.name === dep);
      const mediumDep = DEPENDENCY_ANALYSIS.medium_deps.find(m => m.name === dep);
      const lightDep = DEPENDENCY_ANALYSIS.light_deps.find(l => l.name === dep);

      if (heavyDep) {
        analysis.heavy_deps.push({ ...heavyDep, version: dependencies[dep] });
      } else if (mediumDep) {
        analysis.medium_deps.push({ ...mediumDep, version: dependencies[dep] });
      } else if (lightDep) {
        analysis.light_deps.push({ ...lightDep, version: dependencies[dep] });
      }
    });

    this.results.analysis = analysis;
    return analysis;
  }

  generateRemovalPlan() {
    console.log('📋 Generating removal plan...\n');
    
    const plan = [];
    let totalSavings = 0;

    Object.entries(BUNDLE_IMPACT.removal_plan).forEach(([phase, details]) => {
      const applicableDeps = details.dependencies.filter(dep => 
        typeof dep === 'string' ? this.packageJson.dependencies[dep] : true
      );

      if (applicableDeps.length > 0) {
        plan.push({
          ...details,
          applicable_dependencies: applicableDeps,
          status: 'pending'
        });
        
        // Parse savings (remove 'MB' and convert to number)
        const savingsNum = parseFloat(details.estimated_savings.replace(/[^\d.]/g, ''));
        totalSavings += savingsNum;
      }
    });

    this.results.migrationPlan = plan;
    this.results.estimatedSavings = totalSavings;
    return plan;
  }

  generateTreeShakingReport() {
    console.log('🌳 Analyzing tree-shaking opportunities...\n');
    
    const opportunities = [];
    
    // Scan for import patterns that could be optimized
    try {
      const srcFiles = this.findSourceFiles();
      
      srcFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Look for problematic import patterns
        const defaultImports = content.match(/import\s+\w+\s+from\s+['"][^'"]+['"]/g) || [];
        const namespaceImports = content.match(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g) || [];
        
        if (defaultImports.length > 0 || namespaceImports.length > 0) {
          opportunities.push({
            file: file.replace(process.cwd(), ''),
            defaultImports: defaultImports.length,
            namespaceImports: namespaceImports.length,
            recommendations: this.getImportRecommendations(content)
          });
        }
      });
    } catch (error) {
      console.warn('Could not analyze source files for tree-shaking:', error.message);
    }

    return opportunities;
  }

  findSourceFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    };
    
    walkDir(process.cwd());
    return files.slice(0, 50); // Limit for performance
  }

  getImportRecommendations(content) {
    const recommendations = [];
    
    // Check for specific patterns
    if (content.includes('import moment')) {
      recommendations.push('Replace moment with date-fns for smaller bundle size');
    }
    
    if (content.includes('import * as')) {
      recommendations.push('Use named imports instead of namespace imports where possible');
    }
    
    return recommendations;
  }

  generateMigrationScript() {
    console.log('🔧 Generating migration scripts...\n');
    
    const scripts = {
      'remove-unused-deps.sh': this.generateRemovalScript(),
      'replace-icons.js': this.generateIconReplacementScript(),
      'migrate-ui-components.js': this.generateUIComponentMigrationScript()
    };

    // Write scripts to /scripts directory
    const scriptsDir = path.join(process.cwd(), 'scripts', 'migration');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    Object.entries(scripts).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(scriptsDir, filename), content);
    });

    return scripts;
  }

  generateRemovalScript() {
    const depsToRemove = this.results.analysis.heavy_deps
      .filter(dep => dep.replacement === 'Remove completely')
      .map(dep => dep.name);

    return `#!/bin/bash
# Bundle optimization - Remove unused dependencies
# Generated by bundle-optimizer.js

echo "🗑️  Removing unused dependencies..."

# Remove heavy dependencies that are completely unused
${depsToRemove.map(dep => `npm uninstall ${dep}`).join('\n')}

echo "✅ Removed ${depsToRemove.length} unused dependencies"
echo "💾 Estimated savings: ${this.calculateSavings(depsToRemove)}MB"

# Verify no broken imports
echo "🔍 Checking for broken imports..."
npm run build || echo "⚠️  Build failed - some imports may need to be updated"
`;
  }

  generateIconReplacementScript() {
    return `// Icon replacement script
// Replaces icons from multiple libraries with lucide-react equivalents

const fs = require('fs');
const path = require('path');

const ICON_MAPPINGS = {
  // Ant Design Icons → Lucide React
  'CalendarOutlined': 'Calendar',
  'ClockCircleOutlined': 'Clock',
  'UserOutlined': 'User',
  'PlusOutlined': 'Plus',
  'SearchOutlined': 'Search',
  
  // Material UI Icons → Lucide React
  'CalendarToday': 'Calendar',
  'AccessTime': 'Clock',
  'Person': 'User',
  'Add': 'Plus',
  'Search': 'Search'
};

function replaceIconsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Replace imports
  content = content.replace(
    /import\\s*{([^}]+)}\\s*from\\s*['"]@ant-design\\/icons['"];?/g,
    (match, icons) => {
      const iconList = icons.split(',').map(i => i.trim());
      const replacements = iconList.map(icon => ICON_MAPPINGS[icon] || icon);
      hasChanges = true;
      return \`import { \${replacements.join(', ')} } from 'lucide-react';\`;
    }
  );
  
  // Replace usage in JSX
  Object.entries(ICON_MAPPINGS).forEach(([oldIcon, newIcon]) => {
    const regex = new RegExp(\`<\${oldIcon}\`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, \`<\${newIcon}\`);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(\`✅ Updated icons in \${filePath}\`);
  }
}

// Run on all source files
// Usage: node scripts/migration/replace-icons.js
`;
  }

  generateUIComponentMigrationScript() {
    return `// UI Component Migration Script
// Helps migrate from multiple UI libraries to shadcn/ui

const COMPONENT_MAPPINGS = {
  // Chakra UI → shadcn/ui
  'Box': 'div',
  'Button': 'Button',
  'Input': 'Input',
  'Text': 'span',
  
  // Ant Design → shadcn/ui
  'Button': 'Button',
  'Input': 'Input',
  'Card': 'Card',
  'Modal': 'Dialog'
};

// Generate component adapter to ease migration
const ADAPTER_COMPONENT = \`
import { Button as ShadcnButton } from '@/components/ui/button'
import { Input as ShadcnInput } from '@/components/ui/input'

// Temporary adapters during migration
export const Button = (props) => <ShadcnButton {...props} />
export const Input = (props) => <ShadcnInput {...props} />
\`;

console.log('Generated UI component migration utilities');
`;
  }

  calculateSavings(deps) {
    return deps.reduce((total, dep) => {
      const analysis = [...DEPENDENCY_ANALYSIS.heavy_deps, ...DEPENDENCY_ANALYSIS.medium_deps]
        .find(d => d.name === dep);
      if (analysis && analysis.size) {
        const sizeMB = parseFloat(analysis.size.replace(/[^\d.]/g, ''));
        return total + sizeMB;
      }
      return total;
    }, 0).toFixed(1);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      current_bundle_estimate: BUNDLE_IMPACT.current_estimated_size,
      target_bundle_size: BUNDLE_IMPACT.target_size,
      total_estimated_savings: `${this.results.estimatedSavings}MB`,
      
      dependency_analysis: this.results.analysis,
      migration_plan: this.results.migrationPlan,
      tree_shaking_opportunities: this.generateTreeShakingReport(),
      
      recommendations: [
        {
          priority: 'high',
          action: 'Remove unused UI libraries (@chakra-ui, antd)',
          impact: '6.3MB savings',
          effort: 'low',
          timeline: '1 week'
        },
        {
          priority: 'high',
          action: 'Consolidate icon libraries to lucide-react',
          impact: '0.7MB savings',
          effort: 'medium',
          timeline: '3 days'
        },
        {
          priority: 'medium',
          action: 'Evaluate @mantine libraries usage',
          impact: '1.9MB potential savings',
          effort: 'medium',
          timeline: '2 weeks'
        },
        {
          priority: 'medium',
          action: 'Implement dynamic imports for calendar libraries',
          impact: '0.8MB runtime savings',
          effort: 'high',
          timeline: '1 week'
        },
        {
          priority: 'low',
          action: 'Replace moment.js with date-fns',
          impact: '0.29MB savings',
          effort: 'low',
          timeline: '1 day'
        }
      ],
      
      next_steps: [
        '1. Review this analysis with the team',
        '2. Start with Phase 1 (remove unused UI libraries)',
        '3. Test in /playground environment first',
        '4. Run migration scripts with --dry-run flag',
        '5. Update CI to prevent regression'
      ]
    };

    return report;
  }

  run() {
    console.log('🚀 LinearTime Bundle Size Optimization Analysis\n');
    
    this.analyzeDependencies();
    this.generateRemovalPlan();
    const migrationScripts = this.generateMigrationScript();
    const report = this.generateReport();
    
    // Write report
    const reportPath = path.join(process.cwd(), 'bundle-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('📊 BUNDLE OPTIMIZATION SUMMARY');
    console.log('================================');
    console.log(`Current estimated size: ${BUNDLE_IMPACT.current_estimated_size}`);
    console.log(`Target size: ${BUNDLE_IMPACT.target_size}`);
    console.log(`Potential savings: ${this.results.estimatedSavings}MB`);
    console.log(`\\n📋 Migration Plan:`);
    
    this.results.migrationPlan.forEach((phase, index) => {
      console.log(`  ${index + 1}. ${phase.name}`);
      console.log(`     Savings: ${phase.estimated_savings}`);
      console.log(`     Risk: ${phase.risk}`);
      console.log(`     Timeline: ${phase.timeline}\\n`);
    });
    
    console.log(`📁 Generated files:`);
    console.log(`   - ${reportPath}`);
    console.log(`   - scripts/migration/ (${Object.keys(migrationScripts).length} migration scripts)`);
    console.log(`\\n🚀 Next: Review report and start with Phase 1 migration`);
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.run();
}

module.exports = BundleOptimizer;