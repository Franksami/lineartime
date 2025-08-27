/**
 * Style Dictionary Configuration (v5.0+ Compatible)
 * Enterprise Design Token System for LinearTime Calendar
 * 
 * Supports: CSS, SCSS, JS, TS, JSON outputs
 * Compatible with: Tailwind CSS 4, shadcn/ui, Mantine, Ant Design
 */

import StyleDictionary from 'style-dictionary';

// Initialize Style Dictionary with v5 API
const sd = new StyleDictionary({
  source: ['design-tokens/**/*.json'],
  
  // Hook-based API for custom transforms
  hooks: {
    transforms: {
      'size/pxToRem': {
        type: 'value',
        filter: (token) => token.type === 'dimension' && token.value.toString().endsWith('px'),
        transform: (token) => {
          const pxValue = parseFloat(token.value);
          return `${pxValue / 16}rem`;
        }
      },
      
      'color/oklchToHsl': {
        type: 'value',
        filter: (token) => token.type === 'color' && token.value.toString().includes('oklch'),
        transform: (token) => {
          // Simplified OKLCH to HSL conversion for compatibility
          const oklchMatch = token.value.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
          if (oklchMatch) {
            const [, l, c, h] = oklchMatch;
            const lightness = Math.round(parseFloat(l) * 100);
            const saturation = Math.round(parseFloat(c) * 100);
            const hue = Math.round(parseFloat(h));
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          }
          return token.value;
        }
      },
      
      'shadow/cssValue': {
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
      },
      
      'typography/fontStack': {
        type: 'value',
        filter: (token) => token.type === 'fontFamily',
        transform: (token) => {
          if (Array.isArray(token.value)) {
            return token.value.map(font => font.includes(' ') ? `"${font}"` : font).join(', ');
          }
          return token.value;
        }
      }
    },
    
    transformGroups: {
      'web/enhanced': [
        'attribute/cti',
        'name/kebab',
        'size/pxToRem',
        'color/oklchToHsl',
        'shadow/cssValue',
        'typography/fontStack'
      ],
      'js/enhanced': [
        'attribute/cti',
        'name/camel',
        'size/pxToRem',
        'color/oklchToHsl',
        'shadow/cssValue',
        'typography/fontStack'
      ]
    },
    
    formats: {
      'css/enhanced-variables': ({dictionary}) => {
          return `:root {\n${dictionary.allTokens
            .map(token => `  --${token.name}: ${token.value};`)
            .join('\n')}\n}\n\n.dark {\n${dictionary.allTokens
              .filter(token => token.attributes.category === 'color')
              .map(token => `  --${token.name}: ${token.darkValue || token.value};`)
              .join('\n')}\n}`;
        }
      },
      
      'tailwind/config': ({dictionary}) => {
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
      },
      
      'typescript/enhanced-tokens': ({dictionary}) => {
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
      }
    }
  },
  
  platforms: {
    css: {
      transformGroup: 'web/enhanced',
      buildPath: 'lib/design-system/tokens/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/enhanced-variables',
          options: {
            showFileHeader: true
          }
        },
        {
          destination: 'variables.scss',
          format: 'scss/variables',
          options: {
            showFileHeader: true
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
            showFileHeader: true
          }
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/enhanced-tokens',
          options: {
            showFileHeader: true
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
            showFileHeader: true
          }
        }
      ]
    }
  }
});

// Build tokens asynchronously (v5 API)
await sd.buildAllPlatforms();