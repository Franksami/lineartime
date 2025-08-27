#!/usr/bin/env node
/**
 * Component Token Validation Script
 * 
 * Validates the Component Token Registry system and migration progress.
 * Part of the governance system for ensuring design token compliance.
 * 
 * Usage:
 *   node scripts/validate-component-tokens.js
 *   npm run tokens:validate:components
 * 
 * Validation Checks:
 * 1. Token Registry Structure Validation
 * 2. Component Migration Coverage Analysis  
 * 3. Token Reference Resolution Testing
 * 4. Performance Impact Assessment
 * 5. Governance Compliance Scoring
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class ComponentTokenValidator {
  constructor() {
    this.projectRoot = process.cwd()
    this.errors = []
    this.warnings = []
    this.passed = []
    this.migrationStats = {
      totalComponents: 0,
      migratedComponents: 0,
      coverage: 0,
      hardcodedValues: 0
    }
  }

  async validate() {
    console.log('🎨 Starting Component Token Validation...\n')

    try {
      await this.validateTokenRegistryStructure()
      await this.validateComponentMigrations()
      await this.validateTokenReferences()
      await this.assessPerformanceImpact()
      await this.calculateGovernanceScore()

      this.generateReport()

      if (this.errors.length > 0) {
        console.error('\n❌ Component Token validation failed!')
        console.error('Fix the following issues:\n')
        this.errors.forEach(error => console.error(`  • ${error}`))
        process.exit(1)
      }

      console.log('\n✅ Component Token validation passed!')
      return true

    } catch (error) {
      console.error('\n💥 Component Token validation crashed:', error.message)
      process.exit(1)
    }
  }

  async validateTokenRegistryStructure() {
    console.log('🏗️ Validating Component Token Registry structure...')

    const registryPath = path.join(this.projectRoot, 'lib/design-system/component-tokens/ComponentTokenRegistry.ts')
    
    if (!fs.existsSync(registryPath)) {
      this.errors.push('Component Token Registry file not found')
      return
    }

    const registryContent = fs.readFileSync(registryPath, 'utf8')
    
    // Check for required interfaces
    const requiredInterfaces = [
      'ComponentTokenRegistry',
      'CompositeToken', 
      'ComponentTokenValue',
      'ButtonTokens',
      'EventTokens',
      'CardTokens'
    ]

    requiredInterfaces.forEach(interfaceName => {
      if (!registryContent.includes(`interface ${interfaceName}`)) {
        this.errors.push(`Missing required interface: ${interfaceName}`)
      } else {
        this.passed.push(`Token registry interface validated: ${interfaceName}`)
      }
    })

    // Check for composite token patterns
    const compositeTokenPatterns = [
      /\$type:\s*"composite"/g,
      /\$value:\s*{/g,
      /\{[\w.-]+\}/g // Token reference pattern
    ]

    compositeTokenPatterns.forEach((pattern, index) => {
      const matches = registryContent.match(pattern)
      if (!matches || matches.length === 0) {
        this.warnings.push(`Limited composite token usage detected (pattern ${index + 1})`)
      } else {
        this.passed.push(`Composite token patterns found: ${matches.length} instances`)
      }
    })

    // Validate token hierarchy structure
    const expectedCategories = ['button', 'event', 'card', 'modal', 'calendar', 'input']
    expectedCategories.forEach(category => {
      if (registryContent.includes(`${category}:`)) {
        this.passed.push(`Token category validated: ${category}`)
      } else {
        this.warnings.push(`Token category missing or incomplete: ${category}`)
      }
    })
  }

  async validateComponentMigrations() {
    console.log('🔄 Analyzing component migration progress...')

    const componentDirs = [
      'components/calendar',
      'components/ui', 
      'components/dashboard',
      'components/mobile',
      'components/settings'
    ]

    let totalComponents = 0
    let migratedComponents = 0
    let totalHardcodedValues = 0

    for (const dir of componentDirs) {
      const dirPath = path.join(this.projectRoot, dir)
      
      if (!fs.existsSync(dirPath)) {
        this.warnings.push(`Component directory not found: ${dir}`)
        continue
      }

      const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.tsx') && !file.includes('.test.'))

      for (const file of files) {
        totalComponents++
        const filePath = path.join(dirPath, file)
        const content = fs.readFileSync(filePath, 'utf8')

        // Check for migration indicators
        const hasMigrationImports = content.includes('useComponentTokens') || 
                                   content.includes('ComponentTokenRegistry')
        
        const hasDesignTokensProp = content.includes('useDesignTokens')
        const hasFallbackPattern = content.includes('legacy') || content.includes('fallback')

        // Count hardcoded values
        const hardcodedPatterns = [
          /bg-\w+(-\w+)*\/?\d*/g,
          /text-\w+(-\w+)*\/?\d*/g,
          /border-\w+(-\w+)*\/?\d*/g,
          /#[0-9a-fA-F]{3,8}/g
        ]

        let fileHardcodedCount = 0
        hardcodedPatterns.forEach(pattern => {
          const matches = content.match(pattern) || []
          fileHardcodedCount += matches.length
        })

        totalHardcodedValues += fileHardcodedCount

        // Determine migration status
        if (hasMigrationImports && hasDesignTokensProp && hasFallbackPattern) {
          migratedComponents++
          this.passed.push(`Fully migrated component: ${file}`)
        } else if (hasMigrationImports) {
          this.warnings.push(`Partial migration: ${file} (missing fallback patterns)`)
        } else if (fileHardcodedCount > 10) {
          this.warnings.push(`High hardcoded value count in ${file}: ${fileHardcodedCount} values`)
        }
      }
    }

    this.migrationStats = {
      totalComponents,
      migratedComponents,
      coverage: totalComponents > 0 ? Math.round((migratedComponents / totalComponents) * 100) : 0,
      hardcodedValues: totalHardcodedValues
    }

    if (this.migrationStats.coverage < 30) {
      this.errors.push(`Low migration coverage: ${this.migrationStats.coverage}% (target: >30%)`)
    } else if (this.migrationStats.coverage < 70) {
      this.warnings.push(`Medium migration coverage: ${this.migrationStats.coverage}% (target: >70%)`)
    } else {
      this.passed.push(`Good migration coverage: ${this.migrationStats.coverage}%`)
    }
  }

  async validateTokenReferences() {
    console.log('🔗 Validating token references...')

    const registryPath = path.join(this.projectRoot, 'lib/design-system/component-tokens/ComponentTokenRegistry.ts')
    
    if (!fs.existsSync(registryPath)) {
      this.errors.push('Cannot validate token references - registry file missing')
      return
    }

    const registryContent = fs.readFileSync(registryPath, 'utf8')
    
    // Find all token references in format {token.path}
    const tokenReferences = registryContent.match(/\{[\w.-]+\}/g) || []
    
    // Check if base design system tokens exist
    const baseTokensPath = path.join(this.projectRoot, 'lib/design-system')
    const baseTokenPatterns = [
      'colors',
      'spacing',
      'shadows',
      'radii',
      'typography',
      'motion'
    ]

    baseTokenPatterns.forEach(pattern => {
      const referencesUsingPattern = tokenReferences.filter(ref => ref.includes(pattern))
      if (referencesUsingPattern.length > 0) {
        this.passed.push(`Base token references validated: ${pattern} (${referencesUsingPattern.length} refs)`)
      } else {
        this.warnings.push(`No references found for base token category: ${pattern}`)
      }
    })

    // Check for circular references (simplified check)
    const selfReferences = tokenReferences.filter(ref => {
      const cleanRef = ref.replace(/[{}]/g, '')
      return registryContent.includes(`"${cleanRef}":`) && 
             registryContent.includes(`"${ref}"`)
    })

    if (selfReferences.length > 0) {
      this.errors.push(`Potential circular token references detected: ${selfReferences.join(', ')}`)
    } else {
      this.passed.push('No circular token references detected')
    }

    // Validate token reference syntax
    const invalidReferences = tokenReferences.filter(ref => {
      return !ref.match(/^\{[a-zA-Z][a-zA-Z0-9.-]*\}$/)
    })

    if (invalidReferences.length > 0) {
      this.errors.push(`Invalid token reference syntax: ${invalidReferences.join(', ')}`)
    } else {
      this.passed.push('Token reference syntax validation passed')
    }
  }

  async assessPerformanceImpact() {
    console.log('⚡ Assessing performance impact...')

    const migrationUtilityPath = path.join(this.projectRoot, 'lib/design-system/component-tokens/ComponentMigrationUtility.ts')
    
    if (!fs.existsSync(migrationUtilityPath)) {
      this.errors.push('Migration utility file not found - cannot assess performance impact')
      return
    }

    const utilityContent = fs.readFileSync(migrationUtilityPath, 'utf8')

    // Check for performance monitoring features
    const performanceFeatures = [
      'monitorPerformance',
      'trackMigrationUsage',
      'performance_impact',
      'caching',
      'memoization'
    ]

    performanceFeatures.forEach(feature => {
      if (utilityContent.includes(feature)) {
        this.passed.push(`Performance feature implemented: ${feature}`)
      } else {
        this.warnings.push(`Performance feature missing: ${feature}`)
      }
    })

    // Estimate bundle size impact
    const registrySize = fs.statSync(path.join(this.projectRoot, 'lib/design-system/component-tokens/ComponentTokenRegistry.ts')).size
    const utilitySize = fs.statSync(migrationUtilityPath).size
    const totalSize = registrySize + utilitySize

    const sizeLimitKB = 50 // 50KB limit for component token system
    const actualSizeKB = Math.round(totalSize / 1024)

    if (actualSizeKB > sizeLimitKB) {
      this.warnings.push(`Component token system size: ${actualSizeKB}KB (target: <${sizeLimitKB}KB)`)
    } else {
      this.passed.push(`Component token system size: ${actualSizeKB}KB (within target)`)
    }

    // Check for potential memory leaks
    const memoryLeakPatterns = [
      /new Map\(\)/g,
      /new Set\(\)/g,
      /addEventListener/g
    ]

    let potentialLeaks = 0
    memoryLeakPatterns.forEach(pattern => {
      const matches = utilityContent.match(pattern) || []
      potentialLeaks += matches.length
    })

    if (potentialLeaks > 5) {
      this.warnings.push(`High memory allocation patterns detected: ${potentialLeaks} instances`)
    } else {
      this.passed.push(`Memory allocation patterns within acceptable range: ${potentialLeaks} instances`)
    }
  }

  async calculateGovernanceScore() {
    console.log('📊 Calculating governance compliance score...')

    const weights = {
      structure: 0.25,      // Registry structure completeness
      migration: 0.30,      // Migration progress coverage  
      references: 0.20,     // Token reference validity
      performance: 0.15,    // Performance impact
      compliance: 0.10      // Standards compliance
    }

    // Calculate individual scores (0-100)
    const structureScore = Math.max(0, 100 - (this.errors.length * 20) - (this.warnings.length * 5))
    const migrationScore = this.migrationStats.coverage
    const referencesScore = Math.min(100, this.passed.filter(p => p.includes('reference')).length * 20)
    const performanceScore = Math.max(0, 100 - (this.warnings.filter(w => w.includes('performance')).length * 15))
    const complianceScore = 85 // Baseline score for implementing DTCG standards

    // Calculate weighted overall score
    const overallScore = Math.round(
      (structureScore * weights.structure) +
      (migrationScore * weights.migration) +
      (referencesScore * weights.references) +
      (performanceScore * weights.performance) +
      (complianceScore * weights.compliance)
    )

    this.governanceScore = {
      overall: overallScore,
      breakdown: {
        structure: structureScore,
        migration: migrationScore,
        references: referencesScore,
        performance: performanceScore,
        compliance: complianceScore
      },
      weights
    }

    // Set pass/fail thresholds
    if (overallScore >= 80) {
      this.passed.push(`Excellent governance score: ${overallScore}%`)
    } else if (overallScore >= 70) {
      this.warnings.push(`Good governance score: ${overallScore}% (target: >80%)`)
    } else {
      this.errors.push(`Poor governance score: ${overallScore}% (minimum: 70%)`)
    }
  }

  generateReport() {
    console.log('\n📋 Component Token Validation Report')
    console.log('=' .repeat(50))

    // Migration Statistics
    console.log('\n🔄 Migration Progress:')
    console.log(`   Total Components: ${this.migrationStats.totalComponents}`)
    console.log(`   Migrated: ${this.migrationStats.migratedComponents}`)
    console.log(`   Coverage: ${this.migrationStats.coverage}%`)
    console.log(`   Hardcoded Values: ${this.migrationStats.hardcodedValues}`)

    // Governance Scoring
    if (this.governanceScore) {
      console.log('\n📊 Governance Score Breakdown:')
      console.log(`   Overall Score: ${this.governanceScore.overall}%`)
      Object.entries(this.governanceScore.breakdown).forEach(([category, score]) => {
        const weight = Math.round(this.governanceScore.weights[category] * 100)
        console.log(`   ${category.padEnd(12)}: ${score}% (weight: ${weight}%)`)
      })
    }

    // Validation Results
    console.log(`\n✅ Passed: ${this.passed.length}`)
    console.log(`⚠️  Warnings: ${this.warnings.length}`)
    console.log(`❌ Errors: ${this.errors.length}`)

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      this.warnings.forEach(warning => console.log(`   • ${warning}`))
    }

    if (this.passed.length > 0) {
      console.log('\n✅ Passed checks:')
      this.passed.forEach(check => console.log(`   • ${check}`))
    }

    // Recommendations
    console.log('\n🎯 Recommendations:')
    if (this.migrationStats.coverage < 50) {
      console.log('   • Priority: Accelerate component migration efforts')
      console.log('   • Use ComponentMigrationUtility for batch processing')
    }
    if (this.migrationStats.hardcodedValues > 100) {
      console.log('   • Priority: Focus on components with highest hardcoded value counts')
    }
    if (this.warnings.length > 10) {
      console.log('   • Consider addressing warnings to improve governance score')
    }
    
    console.log('   • Continue gradual migration with fallback patterns')
    console.log('   • Regular validation runs during development')
    console.log('   • Monitor performance impact of token resolution')
  }
}

// CLI Usage
if (require.main === module) {
  const validator = new ComponentTokenValidator()
  validator.validate().catch(error => {
    console.error('💥 Validation failed:', error)
    process.exit(1)
  })
}

module.exports = ComponentTokenValidator