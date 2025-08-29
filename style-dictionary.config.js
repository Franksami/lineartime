/**
 * Style Dictionary Configuration
 * Enterprise Design Token System for Command Center Calendar Calendar
 * 
 * Supports: CSS, SCSS, JS, TS, JSON outputs
 * Compatible with: Tailwind CSS 4, shadcn/ui, Mantine, Ant Design
 */

import StyleDictionary from 'style-dictionary';

// Custom transforms for enhanced token processing using v5 API
StyleDictionary.registerTransform({
  name: 'size/pxToRem',
  type: 'value',
  filter: (token) => token.type === 'dimension' && token.value.toString().endsWith('px'),
  transform: (token) => {
    const pxValue = parseFloat(token.value);
    return `${pxValue / 16}rem`;
  }
});

StyleDictionary.registerTransform({
  name: 'color/oklchToHsl',
  type: 'value',
  filter: (token) => token.type === 'color' && token.value.toString().includes('oklch'),
  transform: (token) => {
    // Simplified OKLCH to HSL conversion for compatibility
    // In production, you'd use a proper color conversion library
    const oklchMatch = token.value.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
    if (oklchMatch) {
      const [, l, c, h] = oklchMatch;
      // Approximate conversion for demonstration
      const lightness = Math.round(parseFloat(l) * 100);
      const saturation = Math.round(parseFloat(c) * 100);
      const hue = Math.round(parseFloat(h));
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    return token.value;
  }
});

StyleDictionary.registerTransform({
  name: 'shadow/cssValue',
  type: 'value',
  filter: (token) => token.type === 'shadow',
  transform: (token) => {
    if (typeof token.value === 'object') {
      const { offsetX, offsetY, blur, spread, color, inset } = token.value;
      const insetValue = inset ? 'inset ' : '';
      return `${insetValue}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
    }
    return token.value;
  }
});

StyleDictionary.registerTransform({
  name: 'typography/fontStack',
  type: 'value',
  filter: (token) => token.type === 'fontFamily',
  transform: (token) => {
    if (Array.isArray(token.value)) {
      return token.value.map(font => font.includes(' ') ? `"${font}"` : font).join(', ');
    }
    return token.value;
  }
});

// Custom transform group for web platforms
StyleDictionary.registerTransformGroup({
  name: 'web/enhanced',
  transforms: [
    'attribute/cti',
    'name/kebab',
    'size/pxToRem',
    'color/oklchToHsl',
    'shadow/cssValue',
    'typography/fontStack'
  ]
});

// Custom transform group for JavaScript platforms
StyleDictionary.registerTransformGroup({
  name: 'js/enhanced',
  transforms: [
    'attribute/cti',
    'name/camel',
    'size/pxToRem',
    'color/oklchToHsl',
    'shadow/cssValue',
    'typography/fontStack'
  ]
});

// Custom formats for different output types
StyleDictionary.registerFormat({
  name: 'css/enhanced-variables',
  format: function({dictionary}) {
    return `:root {\n${dictionary.allTokens
      .map(token => `  --${token.name}: ${token.value};`)
      .join('\n')}\n}\n\n.dark {\n${dictionary.allTokens
        .filter(token => token.attributes.category === 'color')
        .map(token => `  --${token.name}: ${token.darkValue || token.value};`)
        .join('\n')}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'tailwind/config',
  format: function({dictionary}) {
    const tokens = dictionary.allTokens;
    const colors = tokens.filter(t => t.attributes.category === 'color');
    const spacing = tokens.filter(t => t.attributes.category === 'spacing');
    const typography = tokens.filter(t => t.attributes.category === 'typography');
    
    return `// Tailwind CSS configuration tokens
// Auto-generated from Style Dictionary
module.exports = {
  theme: {
    extend: {
      colors: {
${colors.map(token => `        '${token.path.slice(1).join('-')}': '${token.value}',`).join('\n')}
      },
      spacing: {
${spacing.map(token => `        '${token.path.slice(1).join('-')}': '${token.value}',`).join('\n')}
      },
      fontSize: {
${typography.filter(t => t.attributes.type === 'fontSize').map(token => `        '${token.path.slice(1).join('-')}': '${token.value}',`).join('\n')}
      },
      fontFamily: {
${typography.filter(t => t.attributes.type === 'fontFamily').map(token => `        '${token.path.slice(1).join('-')}': ${JSON.stringify(token.value.split(', '))},`).join('\n')}
      }
    }
  }
};`;
  }
});

StyleDictionary.registerFormat({
  name: 'typescript/enhanced-tokens',
  format: function({dictionary}) {
    return `// Design Tokens - Auto-generated TypeScript definitions
export interface DesignTokens {
${dictionary.allTokens
  .reduce((acc, token) => {
    const path = token.path.join('.');
    acc.add(`  '${path}': string;`);
    return acc;
  }, new Set())
  .join('\n')}
}

export const tokens: DesignTokens = {
${dictionary.allTokens
  .map(token => `  '${token.path.join('.')}': '${token.value}',`)
  .join('\n')}
};

// Token categories for easy access
export const colorTokens = {
${dictionary.allTokens
  .filter(t => t.attributes.category === 'color')
  .map(token => `  '${token.path.slice(1).join('.')}': '${token.value}',`)
  .join('\n')}
};

export const spacingTokens = {
${dictionary.allTokens
  .filter(t => t.attributes.category === 'spacing')
  .map(token => `  '${token.path.slice(1).join('.')}': '${token.value}',`)
  .join('\n')}
};

export const typographyTokens = {
${dictionary.allTokens
  .filter(t => t.attributes.category === 'typography')
  .map(token => `  '${token.path.slice(1).join('.')}': '${token.value}',`)
  .join('\n')}
};

export default tokens;`;
  }
});

export default {
  source: ['design-tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'web/enhanced',
      buildPath: 'lib/design-system/tokens/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/enhanced-variables',
          options: {
            showFileHeader: true,
            fileHeader: 'design-tokens'
          }
        },
        {
          destination: 'variables.scss',
          format: 'scss/variables',
          options: {
            showFileHeader: true,
            fileHeader: 'design-tokens'
          }
        }
      ]
    },
    js: {
      transformGroup: 'js/enhanced',
      buildPath: 'lib/design-system/tokens/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
          options: {
            showFileHeader: true,
            fileHeader: 'design-tokens'
          }
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/enhanced-tokens',
          options: {
            showFileHeader: true,
            fileHeader: 'design-tokens'
          }
        },
        {
          destination: 'tokens.json',
          format: 'json/nested',
          options: {
            showFileHeader: false
          }
        }
      ]
    },
    tailwind: {
      transformGroup: 'web/enhanced',
      buildPath: 'lib/design-system/',
      files: [
        {
          destination: 'tailwind-tokens.js',
          format: 'tailwind/config',
          options: {
            showFileHeader: true,
            fileHeader: 'design-tokens'
          }
        }
      ]
    }
  }
};