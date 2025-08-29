# Command Center Calendar Design System

## 🎨 Overview

This design system provides a comprehensive token-based architecture for Command Center Calendar's UI components, built on Style Dictionary and compatible with all major UI frameworks.

## 📁 Architecture

```
lib/design-system/
├── README.md                 # This file
├── tokens/                   # Generated tokens (auto-generated)
│   ├── tokens.css           # CSS custom properties
│   ├── tokens.js            # JavaScript ES6 module
│   ├── tokens.d.ts          # TypeScript definitions
│   └── tokens.json          # Raw token data
├── utils/
│   └── token-bridge.ts      # Token integration utilities
├── enhanced-theme.ts        # Enhanced theme system
└── components/              # Design system components (future)

design-tokens/               # Source tokens (hand-crafted)
├── base/                    # Foundation tokens
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   └── elevation.json
├── semantic/                # Semantic meaning tokens
│   ├── colors.json
│   └── typography.json
├── component/               # Component-specific tokens
│   ├── buttons.json
│   ├── inputs.json
│   └── calendar.json
└── motion/                  # Animation & transition tokens
    └── transitions.json
```

## 🚀 Getting Started

### 1. Build Tokens

```bash
# Build all tokens from source
npm run build:tokens

# Watch for changes and rebuild
npm run watch:tokens

# Validate token structure
npm run tokens:validate

# Clean generated tokens
npm run clean:tokens
```

### 2. Import and Use

#### CSS Custom Properties
```css
@import url('./lib/design-system/tokens/tokens.css');

.my-component {
  background-color: var(--semantic-color-background-primary);
  padding: var(--spacing-4);
  border-radius: var(--elevation-border-radius-md);
}
```

#### JavaScript/TypeScript
```typescript
import { tokens, colorTokens, spacingTokens } from './lib/design-system/tokens/tokens';
import { tokenHelpers, useTokens } from './lib/design-system/utils/token-bridge';

// Direct token access
const primaryColor = tokens['semantic.color.action.primary.default'];

// Helper functions
const spacing = tokenHelpers.spacing('4'); // Returns spacing-4 value
const color = tokenHelpers.color('background.primary'); // Theme-aware color

// React hook (recommended)
function MyComponent() {
  const { get, getSemanticColor, isDark } = useTokens();
  
  return (
    <div style={{
      backgroundColor: getSemanticColor('background.primary'),
      padding: get('spacing.4'),
      borderRadius: get('elevation.borderRadius.md')
    }}>
      Content
    </div>
  );
}
```

#### Enhanced Theme System
```typescript
import { useEnhancedTheme } from './lib/design-system/enhanced-theme';

function App() {
  const { theme, mantineTheme, antdTheme, isDark } = useEnhancedTheme();
  
  return (
    <MantineProvider theme={mantineTheme}>
      <ConfigProvider theme={antdTheme}>
        {/* Your app */}
      </ConfigProvider>
    </MantineProvider>
  );
}
```

## 🎯 Token Categories

### Base Tokens
Foundation tokens that define the core design values:

- **Colors**: OKLCH color palette with full spectrum
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (0.25rem base)
- **Elevation**: Shadows, border radius, opacity, z-index

### Semantic Tokens
Tokens with semantic meaning that map to base tokens:

- **Background**: Primary, secondary, tertiary surfaces
- **Text**: Primary, secondary, tertiary, disabled text
- **Border**: Default, subtle, strong borders
- **Action**: Primary/secondary states (default, hover, active, disabled)
- **Feedback**: Success, warning, error, info states

### Component Tokens
Component-specific tokens for consistent styling:

- **Buttons**: Primary, secondary, ghost variants with all states
- **Inputs**: Text, textarea, select, checkbox, radio, switch
- **Calendar**: Grid, events, navigation, timeline specific tokens

### Motion Tokens
Animation and transition tokens:

- **Duration**: instant, fast, normal, slow, slower, slowest
- **Easing**: Linear, ease variations, spring, bounce
- **Transitions**: Component-specific transition configs
- **Animations**: Loading, pulse, bounce, slide, fade, scale

## 🔧 Customization

### Adding New Tokens

1. **Create token file** in appropriate category:
```json
{
  "component": {
    "myComponent": {
      "background": {
        "value": "{semantic.color.surface.default}",
        "type": "color",
        "description": "My component background"
      }
    }
  }
}
```

2. **Rebuild tokens**:
```bash
npm run build:tokens
```

3. **Use in components**:
```typescript
const bg = tokenHelpers.component('myComponent', 'background');
```

### Extending the Theme

Create new semantic mappings by editing `semantic/*.json` files:

```json
{
  "semantic": {
    "color": {
      "mySemanticColor": {
        "value": "{color.blue.500}",
        "darkValue": "{color.blue.400}",
        "type": "color",
        "description": "Custom semantic color"
      }
    }
  }
}
```

## 🎨 Design Principles

### Token Hierarchy
1. **Base** → Raw design values
2. **Semantic** → Meaningful references to base tokens
3. **Component** → Component-specific tokens that reference semantic tokens
4. **Application** → Application-specific overrides (rare)

### Naming Convention
- Use kebab-case for CSS variables: `--semantic-color-background-primary`
- Use dot notation for JSON paths: `semantic.color.background.primary`
- Use camelCase for JavaScript: `semanticColorBackgroundPrimary`

### Dark Mode Support
All color tokens support automatic dark mode through `darkValue` properties:

```json
{
  "primary": {
    "value": "{color.blue.500}",
    "darkValue": "{color.blue.400}",
    "type": "color"
  }
}
```

## 🔗 Framework Integration

### Tailwind CSS
Tokens automatically generate Tailwind config extensions:

```javascript
// Generated tailwind-tokens.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'semantic-background-primary': 'var(--semantic-color-background-primary)',
        // ... all color tokens
      },
      spacing: {
        // ... all spacing tokens
      }
    }
  }
};
```

### Mantine
Enhanced theme with automatic token integration:

```typescript
const { mantineTheme } = useEnhancedTheme();
// Includes all design tokens in theme.other.tokens
```

### Ant Design
Token algorithm support with semantic mapping:

```typescript
const { antdTheme } = useEnhancedTheme();
// Automatically maps design tokens to Ant Design token system
```

## 📈 Performance

### Bundle Impact
- **CSS Output**: ~8KB gzipped (all tokens)
- **JS Output**: ~12KB gzipped (with TypeScript types)
- **Runtime**: Zero performance impact (uses CSS custom properties)

### Browser Support
- Modern browsers: Full support with CSS custom properties
- Legacy browsers: Automatic fallback values in token bridge

## 🔍 Validation

The token system includes comprehensive validation:

```bash
npm run tokens:validate
```

Validates:
- ✅ Naming conventions
- ✅ Required properties (value, type, description)
- ✅ Color format validation
- ✅ Dimension format validation
- ✅ Token reference validity
- ⚠️ Description presence (warning)

## 🤝 Contributing

### Adding New Components

1. Create component token file in `design-tokens/component/`
2. Add semantic references where possible
3. Include all interactive states (hover, active, disabled)
4. Add dark mode variants for colors
5. Include comprehensive descriptions
6. Run validation and build

### Best Practices

- **Use semantic tokens** in components, not base tokens directly
- **Include descriptions** for all tokens
- **Test dark mode** for all color tokens
- **Follow naming conventions** consistently
- **Validate tokens** before committing
- **Document usage** in component files

## 🎯 Migration Guide

### From Existing CSS Variables

```css
/* Before */
.component {
  background: var(--background);
  color: var(--foreground);
}

/* After */
.component {
  background: var(--semantic-color-background-primary);
  color: var(--semantic-color-text-primary);
}
```

### From Hardcoded Values

```typescript
// Before
const styles = {
  padding: '16px',
  borderRadius: '8px',
  color: '#3b82f6'
};

// After
import { tokenHelpers } from './lib/design-system/utils/token-bridge';

const styles = {
  padding: tokenHelpers.spacing('4'),
  borderRadius: tokenHelpers.elevation('borderRadius', 'lg'),
  color: tokenHelpers.color('action.primary.default')
};
```

## 📚 References

- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)
- [OKLCH Color Space](https://oklch.com/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## 🐛 Troubleshooting

### Common Issues

**"Token not found" errors**:
- Run `npm run build:tokens` to generate latest tokens
- Check token path spelling and case sensitivity

**Dark mode not working**:
- Ensure darkValue properties are set for color tokens
- Check if document has 'dark' class applied

**TypeScript errors**:
- Rebuild tokens to update TypeScript definitions
- Import from generated `tokens.d.ts` file

**Build failures**:
- Run `npm run tokens:validate` to check for errors
- Check JSON syntax in token files
- Ensure all references point to existing tokens

---

Built with ❤️ for the Command Center Calendar Calendar Platform