/**
 * ARCHIVED COMPONENT - DO NOT USE
 * 
 * This component violates the LinearTime horizontal layout requirement.
 * The full implementation has been moved to _archive/LinearCalendarVertical.tsx
 * 
 * LinearTime MUST use the horizontal 12-month row layout as specified in
 * the foundation documentation. Use LinearCalendarHorizontal instead.
 * 
 * @deprecated This component is archived and should not be imported or used.
 */

// Export nothing to prevent imports
export {}

// Throw error if somehow imported and called
export function LinearCalendarVertical() {
  throw new Error(
    'LinearCalendarVertical is archived and must not be used. ' +
    'Use LinearCalendarHorizontal for the proper horizontal 12-month layout.'
  )
}