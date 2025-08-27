#!/usr/bin/env node
/**
 * Token Validation Script
 * Validates design tokens for consistency, naming conventions, and references
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color validation
function validateColor(value) {
  const patterns = {
    hex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    rgb: /^rgb\(\d+,\s*\d+,\s*\d+\)$/,
    rgba: /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/,
    hsl: /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/,
    hsla: /^hsla\(\d+,\s*\d+%,\s*\d+%,\s*[\d.]+\)$/,
    oklch: /^oklch\([\d.]+ [\d.]+ [\d.]+\)$/,
    named: /^(transparent|inherit|currentColor)$/i
  };

  return Object.values(patterns).some(pattern => pattern.test(value));
}

// Dimension validation
function validateDimension(value) {
  const patterns = {
    px: /^\d+px$/,
    rem: /^[\d.]+rem$/,
    em: /^[\d.]+em$/,
    percent: /^[\d.]+%$/,
    vh: /^[\d.]+vh$/,
    vw: /^[\d.]+vw$/,
    auto: /^auto$/,
    zero: /^0$/
  };

  return Object.values(patterns).some(pattern => pattern.test(value));
}

// Reference validation
function validateReference(value, allTokens) {
  if (!value.startsWith('{') || !value.endsWith('}')) {
    return false;
  }

  const reference = value.slice(1, -1);
  return allTokens.has(reference);
}

// Token collection
function collectTokens(dir) {
  const tokens = new Map();
  const files = glob.sync('**/*.json', { cwd: dir });

  files.forEach(file => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      extractTokens(content, '', tokens);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error.message);
    }
  });

  return tokens;
}

// Recursive token extraction
function extractTokens(obj, prefix, tokens) {
  Object.keys(obj).forEach(key => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && value.value !== undefined) {
      // This is a token
      tokens.set(path, value);
    } else if (value && typeof value === 'object') {
      // This is a group, recurse
      extractTokens(value, path, tokens);
    }
  });
}

// Load governance configuration
function loadGovernanceConfig() {
  const governancePath = path.join(__dirname, '..', '.governancerc.json');
  if (fs.existsSync(governancePath)) {
    try {
      return JSON.parse(fs.readFileSync(governancePath, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not load governance config, using defaults');
    }
  }
  return null;
}

// Get naming patterns from governance config
function getAllowedNamingPatterns() {
  const config = loadGovernanceConfig();
  if (config?.qualityGates?.designTokens?.rules?.naming?.allowedPatterns) {
    return config.qualityGates.designTokens.rules.naming.allowedPatterns;
  }
  return ['camelCase']; // fallback to camelCase only
}

// Validate token path against allowed patterns
function validateTokenNaming(path) {
  const allowedPatterns = getAllowedNamingPatterns();
  
  // Pattern definitions - enhanced to support current token structure
  const patterns = {
    'camelCase': /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/,
    'kebab-case': /^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)*$/,
    'mixed': /^[a-z][a-zA-Z0-9-]*(\.[a-z][a-zA-Z0-9-]*)*$/,
    // Enhanced patterns to support existing token structure
    'design-system': /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*|\.[\d]+[a-z]*|\.logical\.[a-z]+\.[a-z]+\.[\d]+)*$/
  };
  
  // If no patterns specified or includes design-system, use flexible validation
  if (allowedPatterns.includes('design-system') || allowedPatterns.includes('kebab-case')) {
    // Allow current design system token structure including numerics and logical properties
    return /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)*$/.test(path);
  }
  
  // Check if path matches any allowed pattern
  return allowedPatterns.some(pattern => {
    const regex = patterns[pattern];
    return regex ? regex.test(path) : false;
  });
}

// Validation rules
const validations = [
  {
    name: 'Token naming convention',
    test: (path) => validateTokenNaming(path),
    message: 'Token names should follow governance-defined naming patterns (camelCase, kebab-case, or mixed)'
  },
  {
    name: 'Required properties',
    test: (path, token) => token.value !== undefined && token.type !== undefined,
    message: 'Tokens must have both value and type properties'
  },
  {
    name: 'Color value format',
    test: (path, token) => {
      if (token.type !== 'color') return true;
      if (typeof token.value === 'string' && token.value.startsWith('{')) return true;
      return validateColor(token.value);
    },
    message: 'Color tokens must have valid color values or references'
  },
  {
    name: 'Dimension value format',
    test: (path, token) => {
      if (token.type !== 'dimension') return true;
      if (typeof token.value === 'string' && token.value.startsWith('{')) return true;
      return validateDimension(token.value);
    },
    message: 'Dimension tokens must have valid dimension values or references'
  },
  {
    name: 'Reference validity',
    test: (path, token, allTokens) => {
      if (typeof token.value !== 'string' || !token.value.startsWith('{')) return true;
      return validateReference(token.value, allTokens);
    },
    message: 'Token references must point to existing tokens'
  },
  {
    name: 'Description presence',
    test: (path, token) => typeof token.description === 'string' && token.description.length > 0,
    message: 'All tokens should have meaningful descriptions',
    severity: 'warning'
  }
];

// Main validation function
function validateTokens() {
  console.log('🔍 Validating design tokens...\n');

  const tokensDir = path.join(__dirname, '..', 'design-tokens');
  if (!fs.existsSync(tokensDir)) {
    console.error('❌ Design tokens directory not found');
    process.exit(1);
  }

  const tokens = collectTokens(tokensDir);
  console.log(`📋 Found ${tokens.size} tokens\n`);

  let errors = 0;
  let warnings = 0;

  tokens.forEach((token, path) => {
    validations.forEach(validation => {
      if (!validation.test(path, token, tokens)) {
        const severity = validation.severity || 'error';
        const icon = severity === 'error' ? '❌' : '⚠️';
        
        console.log(`${icon} ${path}: ${validation.message}`);
        
        if (severity === 'error') {
          errors++;
        } else {
          warnings++;
        }
      }
    });
  });

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Tokens: ${tokens.size}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n✅ All tokens are valid!');
  } else if (errors === 0) {
    console.log('\n🎯 No errors found, but check warnings above');
  } else {
    console.log('\n💥 Validation failed! Fix errors above');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateTokens();
}

module.exports = { validateTokens, collectTokens };