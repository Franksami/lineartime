# Accessibility Guide

## Overview

LinearTime is committed to providing an accessible experience for all users. This document outlines our accessibility features, implementation guidelines, and testing procedures.

## WCAG 2.1 AA Compliance

We strive to meet WCAG 2.1 Level AA standards:
- ✅ **Perceivable**: Content is presented in ways users can perceive
- ✅ **Operable**: Interface components are operable by keyboard
- ✅ **Understandable**: Information and UI operation is understandable
- ✅ **Robust**: Content works with various assistive technologies

## Implemented Features

### 1. Screen Reader Support
All interactive elements include appropriate ARIA labels and roles:
```typescript
// lib/accessibility.ts
- getDayAriaLabel(): Generates descriptive labels for calendar days
- getMonthAriaLabel(): Creates month navigation labels
- getEventAriaLabel(): Provides event descriptions
- announceToScreenReader(): Live region announcements for dynamic changes
```

### 2. Keyboard Navigation

Complete keyboard navigation throughout the application:

#### Calendar Navigation
- **Arrow Keys**: Navigate between days
  - `←/→`: Previous/Next day
  - `↑/↓`: Previous/Next week
- **Page Up/Down**: Navigate months
- **Home/End**: Jump to first/last day of year
- **Enter/Space**: Open event creation modal
- **Escape**: Close modals and overlays

#### Zoom Controls
- **Ctrl/Cmd + Plus**: Zoom in
- **Ctrl/Cmd + Minus**: Zoom out
- **Ctrl/Cmd + 0**: Reset zoom

### 3. High Contrast Mode

Toggle button for users who need higher contrast:
```typescript
// components/ui/high-contrast-toggle.tsx
- Persistent preference storage
- System preference detection
- ARIA pressed state for screen readers
```

CSS implementation:
```css
.high-contrast {
  --background: oklch(0 0 0) !important;
  --foreground: oklch(1 0 0) !important;
  --border: oklch(0.5 0 0) !important;
  /* Additional high contrast overrides */
}
```

### 4. Reduced Motion Support

Respects user's motion preferences:
```typescript
// hooks/useReducedMotion.ts
- Detects prefers-reduced-motion media query
- Disables animations when preferred
- Provides utilities for conditional animations
```

CSS implementation:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 5. Focus Management

Comprehensive focus management system:
```typescript
// hooks/useFocusTrap.ts
- Focus trap for modals and overlays
- Focus restoration after modal close
- Roving tabindex for list navigation
```

```typescript
// hooks/useKeyboardNavigation.ts
- Centralized keyboard event handling
- Context-aware navigation
- Skip links for main content
```

### 6. Color Contrast

All text meets WCAG AA contrast requirements:
- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio
- Interactive elements: Clear focus indicators

Using oklch color space for perceptually uniform colors:
```css
--foreground: oklch(0.1 0 0); /* Near black on white */
--background: oklch(1 0 0);   /* Pure white */
```

## Testing Procedures

### Automated Testing

```typescript
// tests/accessibility.spec.ts
- axe-core integration for WCAG compliance
- Keyboard navigation tests
- ARIA attribute validation
- Focus management verification
```

Run accessibility tests:
```bash
npx playwright test tests/accessibility.spec.ts
```

### Manual Testing Checklist

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)

#### Keyboard Navigation
- [ ] Navigate entire app without mouse
- [ ] All interactive elements reachable
- [ ] Focus indicators clearly visible
- [ ] No keyboard traps

#### Visual Testing
- [ ] High contrast mode functions correctly
- [ ] Text remains readable when zoomed to 200%
- [ ] Color is not sole conveyor of information
- [ ] Focus indicators have sufficient contrast

## Implementation Guidelines

### Adding New Components

1. **ARIA Labels**: Always include descriptive ARIA labels
```tsx
<button 
  aria-label="Create new event for January 15, 2024"
  onClick={handleClick}
>
  +
</button>
```

2. **Keyboard Support**: Implement keyboard handlers
```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      handleAction();
      break;
    case 'Escape':
      handleClose();
      break;
  }
};
```

3. **Focus Management**: Use focus trap for modals
```tsx
const focusTrapRef = useFocusTrap(isOpen);
return (
  <div ref={focusTrapRef}>
    {/* Modal content */}
  </div>
);
```

4. **Announcements**: Use screen reader announcements
```tsx
announceToScreenReader('Event created successfully');
```

### Best Practices

1. **Semantic HTML**: Use proper HTML elements
   - Use `<button>` for actions
   - Use `<a>` for navigation
   - Use heading hierarchy (`<h1>` → `<h6>`)

2. **Form Labels**: Always associate labels with inputs
```tsx
<label htmlFor="event-title">Event Title</label>
<input id="event-title" />
```

3. **Error Messages**: Make errors accessible
```tsx
<input 
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
<span id="error-message" role="alert">
  {errorMessage}
</span>
```

4. **Loading States**: Announce loading states
```tsx
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : content}
</div>
```

## Accessibility Utilities

### Available Hooks

```typescript
// Keyboard navigation
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

// Focus management
import { useFocusTrap, useFocusList } from '@/hooks/useFocusTrap';

// Motion preferences
import { useReducedMotion } from '@/hooks/useReducedMotion';

// High contrast detection
import { prefersHighContrast } from '@/lib/accessibility';
```

### Helper Functions

```typescript
// Screen reader announcements
announceToScreenReader(message: string, priority?: 'polite' | 'assertive');

// ARIA label generation
getDayAriaLabel(date: Date, eventCount?: number): string;
getMonthAriaLabel(month: number, year: number): string;
getEventAriaLabel(event: Event): string;

// Focus management
trapFocus(element: HTMLElement): () => void;
restoreFocus(element?: HTMLElement): void;
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Reporting Issues

If you encounter accessibility barriers, please:
1. Open an issue on GitHub with the `accessibility` label
2. Include assistive technology used
3. Describe the barrier encountered
4. Provide steps to reproduce

We are committed to addressing accessibility issues promptly.