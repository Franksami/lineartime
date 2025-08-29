# Cron / Notion Calendar — Keyboard-first Patterns

## Summary
- **Keyboard-First Design**: Modern calendars prioritize keyboard accessibility with events being "clickable" via keyboard input
- **Modal Focus Management**: UI modals automatically receive focus when opened via keyboard, ensuring seamless navigation
- **Escape Key Handling**: Consistent escape key patterns with customizable behavior (onEscapeKeyDown callbacks)
- **Minimal UI Principle**: Clean interfaces with streamlined view selection (hidden when only single view available)
- **Double-Click Patterns**: Fast event creation via double-click on dates/times with configurable callbacks
- **Responsive Breakpoints**: Automatic UI adaptation based on screen size (700px breakpoint for mobile)

## Citations (Research Validated via Context7)
- [Schedule X Modern Calendar](https://github.com/schedule-x/schedule-x) - Modern JS calendar with keyboard accessibility and minimal UI principles
- [Keyboard Event Interaction](https://github.com/schedule-x/schedule-x/blob/main/CHANGELOG.md#_snippet_14) - Events can be "clicked" using keyboard input for enhanced accessibility
- [Modal Focus Management](https://github.com/schedule-x/schedule-x/blob/main/CHANGELOG.md#_snippet_11) - Modals opened via keyboard automatically receive focus
- [Escape Key Handler](https://github.com/schedule-x/schedule-x/blob/main/packages/theme-default/CHANGELOG.md#_snippet_10) - onEscapeKeyDown callback for date picker with custom behavior

## Design Implications
- **Keyboard Navigation**: Implement comprehensive keyboard navigation patterns with automatic focus management
- **Double-Click Creation**: onDoubleClickDateTime and onDoubleClickDate callbacks for rapid event creation
- **Escape Key Pattern**: Consistent escape key behavior across all modals and popups
- **Responsive UI**: 700px breakpoint for mobile adaptation, single-view optimization
- **Modal Focus**: Automatic focus management when modals opened via keyboard

## Acceptance Criteria Updates
- **Complete Keyboard Map**: Define keyboard shortcuts for Week/Day navigation, event selection, and creation
- **Fast Event Creation**: Double-click patterns for <120ms event creation response time
- **Escape Key Standard**: Consistent escape key behavior across all Command Workspace modals
- **Focus Management**: Automatic focus when modals/panels opened via keyboard navigation
- **Responsive Breakpoints**: Mobile-first design with 700px breakpoint for shell adaptation
