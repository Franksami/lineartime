# Changelog

All notable changes to Linear Calendar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-21

### Added
- Comprehensive documentation (README, ARCHITECTURE, COMPONENTS, CHANGELOG)
- Component API documentation
- Architecture documentation with system design details
- Improved README with accurate feature list and setup instructions

### Changed
- Major codebase cleanup and consolidation
- Focused on vertical calendar implementation
- Improved project structure organization
- Updated all documentation to match current implementation

### Removed
- 36 obsolete files including:
  - 11 unused calendar component implementations
  - Old horizontal and grid-based calendar layouts
  - Unused UI directories (blocks/, kokonutui/, timeline/)
  - Obsolete documentation files
  - Unused utilities and type definitions
  - Duplicate configuration files

### Technical Details
- **Components Removed:**
  - LinearCalendar.tsx (old horizontal implementation)
  - MonthGrid.tsx, WeekRow.tsx, DayCell.tsx (grid components)
  - YearGrid.tsx, CalendarHeader.tsx (obsolete layouts)
  - EventList.tsx, EventBar.tsx (unused event displays)
  - DateRangePicker.tsx, MonthView.tsx (alternative views)

- **Directories Removed:**
  - /components/blocks (unused shadcn blocks)
  - /components/kokonutui (unused UI library)
  - /components/timeline (obsolete timeline view)
  - /components/layout (replaced by inline components)
  - /app/examples (demo pages)
  - /styles (consolidated into globals.css)

- **Files Cleaned:**
  - Removed unused navigation components
  - Deleted obsolete type definitions
  - Cleaned up unused utilities
  - Removed development documentation

### Fixed
- Consistent dark theme across all components
- Proper TypeScript types for all components
- LocalStorage persistence reliability
- Component export organization

## [0.1.0] - 2024-12-20

### Added
- Initial Linear Calendar implementation
- Vertical 12-month layout with CSS Grid
- Event management system with 4 categories
- LocalStorage persistence for events
- Filter panel for event visibility control
- Dark theme with glass morphism design
- Zoom controls for view density
- Year navigation (1900-2100)
- Reflection modal for year-end review
- Responsive design for different screen sizes

### Technical Stack
- Next.js 15.5.0 with Turbopack
- React 19.0.0
- TypeScript 5.0
- Tailwind CSS with OKLCH colors
- shadcn/ui component library
- date-fns for date manipulation
- Clerk authentication (configured)
- Convex backend (configured)

### Features
- **Calendar Layout**: 42-column CSS Grid (6 weeks × 7 days per month)
- **Event Categories**: Personal, Work, Effort, Note
- **Event Management**: Create, edit, delete events
- **Data Persistence**: Automatic save to LocalStorage
- **Visual Design**: Dark theme with glass morphism effects
- **Navigation**: Year selector and keyboard support

## [Unreleased]

### Planned Features
- Multi-day event spans
- Recurring events with customizable patterns
- Event import/export (iCal format)
- Cloud sync with Convex backend
- Drag and drop event rescheduling
- Event search and text filtering
- Custom event categories
- Time-based events (not just all-day)
- Print view optimization
- Mobile application
- Keyboard shortcuts for power users
- Calendar sharing and collaboration
- Integration with external calendars
- Event templates
- Bulk event operations
- Event statistics and analytics
- Custom themes and color schemes
- Notification system
- Event attachments and links

### Technical Improvements
- Performance optimization for large event counts
- Virtual scrolling for better performance
- Progressive Web App capabilities
- Offline support with service workers
- Automated testing suite
- Internationalization (i18n)
- Accessibility improvements (WCAG AAA)
- API for third-party integrations
- Plugin system for extensions

---

## Version History Summary

- **v0.2.0** - Major cleanup and documentation update
- **v0.1.0** - Initial working implementation with vertical calendar

---

*For more details about the project, see [README.md](./README.md)*
*For technical architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)*
*For component documentation, see [COMPONENTS.md](./COMPONENTS.md)*