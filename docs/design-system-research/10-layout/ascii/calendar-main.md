# Calendar Main - Layout Analysis (FOUNDATION - IMMUTABLE)

## 📋 Surface Overview
- **Route**: `/` (`app/page.tsx`)
- **Purpose**: Core calendar interface with horizontal 12-month timeline
- **User Context**: Primary calendar usage, event management, scheduling
- **Key Flows**: Event creation, navigation, AI scheduling, provider sync
- **⚠️ CRITICAL**: `LinearCalendarHorizontal` component is LOCKED - cannot be modified

## 📐 ASCII Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Navigation Header                              │
├─────────────────────────────────┬───────────────────────────────────────────┤
│                                 │                    Logo                   │
│                                 │              ┌─────────────┐              │
│                                 │              │   LinearTime│              │
│                                 │              └─────────────┘              │
│                                 │                                            │
│                                 │   [Dashboard] [Calendar] [Analytics]       │
│                                 │   [Settings] [Integrations] [AI]           │
│                                 │                                            │
├─────────────────────────────────┴───────────────────────────────────────────┘│
│                                                                             │
│                           CALENDAR TOOLBAR (p-4)                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │     │
│  │  │     Today   │ │   Month    │ │   Week      │ │    Day      │   │     │
│  │  │   Button    │ │   View     │ │   View      │ │   View      │   │     │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │     │
│  │                                                                     │     │
│  │                    ┌─────────────┐    ┌─────────────┐              │     │
│  │                    │Create Event│    │   Search    │              │     │
│  │                    └─────────────┘    └─────────────┘              │     │
│  │                                                                     │     │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │     │
│  │  │    Filter   │ │   Share     │ │    AI       │ │   Settings  │   │     │
│  │  │   Options   │ │   Calendar  │ │   Suggest   │ │   Button    │   │     │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│                     HORIZONTAL CALENDAR FOUNDATION                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    YEAR HEADER (2025)                              │     │
│  │              "2025 Linear Calendar - Life is bigger than a week"    │     │
│  │                                                                     │     │
│  │               WEEK DAY HEADERS (Su Mo Tu We Th Fr Sa)              │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│         MONTH COLUMNS (12 horizontal strips - January → December)          │
│                                                                             │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬─┐
│  │Jan│Feb│Mar│Apr│May│Jun│Jul│Aug│Sep│Oct│Nov│Dec│Jan│Feb│Mar│Apr│May│Jun│
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
│  │┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│
│  ││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1│││1││
│  │└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
│  │┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│
│  ││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2│││2││
│  │└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
│  │[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│[.]│
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
│  │┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│┌─┐│
│  ││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3│││3││
│  │└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│└─┘│
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
│                                                                             │
│                        MONTH LABELS (Bottom)                                │
│              January    February   March    April    May     June           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                        EVENT DETAILS PANEL                         │     │
│  │  ┌─────────────────────────────────────────────────────────────┐   │     │
│  │  │                Selected Event Details                      │   │     │
│  │  │                                                             │   │     │
│  │  │  Title: Team Standup                                        │   │     │
│  │  │  Date: Jan 15, 2025                                         │   │     │
│  │  │  Time: 10:00 AM - 10:30 AM                                  │   │     │
│  │  │  Location: Conference Room A                                │   │     │
│  │  │  Attendees: 5 people                                        │   │     │
│  │  │                                                             │   │     │
│  │  │  [Edit] [Delete] [Share] [AI Suggest Changes]              │   │     │
│  │  └─────────────────────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Layout Specifications

### Container Structure (FOUNDATION - IMMUTABLE)
- **Root Container**: `h-screen bg-background overflow-hidden`
- **Foundation Component**: `LinearCalendarHorizontal` - **CANNOT BE MODIFIED**
- **Required Structure**: 12 horizontal month strips, January-December
- **Grid System**: CSS Grid with 42 columns (6 weeks × 7 days)

### Spacing & Dimensions (FIXED)
- **Month Strips**: Equal width horizontal layout
- **Day Cells**: Square cells with proper proportions
- **Week Headers**: Fixed at top AND bottom of calendar
- **Month Labels**: Left AND right side positioning
- **Year Header**: Prominent display with tagline

### Scroll Behavior (CONSTRAINED)
- **Horizontal Scroll**: Primary navigation method for months
- **Vertical Scroll**: Limited, foundation-focused
- **Scroll Containers**: Explicit scroll boundaries
- **Virtual Scrolling**: Required for performance with 10,000+ events

### Z-Index Layers (STRICT HIERARCHY)
- **Navigation Header**: z-50 (sticky)
- **Toolbar**: z-40 (fixed below header)
- **Event Overlays**: z-30 (event details, tooltips)
- **Modal Layer**: z-1000+ (dialogs, sheets)
- **Foundation Calendar**: z-0 (base layer)

## 📱 Responsive Behavior

### Mobile (< 768px) - CHALLENGING
- **Horizontal Layout**: Difficult on narrow screens
- **Touch Navigation**: Pinch-to-zoom, swipe gestures
- **Collapsed Toolbar**: Minimal button set
- **Simplified Events**: Condensed event display
- **Alternative View**: May need vertical fallback

### Tablet (768px - 1024px)
- **Partial Horizontal**: Limited month visibility
- **Touch Optimization**: Larger touch targets
- **Adaptive Controls**: Context-aware toolbar
- **Performance Focus**: Critical for medium screens

### Desktop (> 1024px)
- **Full Horizontal Layout**: All 12 months visible
- **Mouse Optimization**: Hover states, precise interactions
- **Keyboard Navigation**: Full keyboard accessibility
- **Performance**: Optimized for mouse and keyboard

## 🎯 Interaction Hotspots

### Primary Calendar Interactions
- **Day Cell Clicks**: Event creation, date selection
- **Event Clicks**: Event details, editing
- **Month Navigation**: Horizontal scroll, month jumping
- **Toolbar Actions**: View switching, filtering

### Advanced Interactions
- **AI Suggestions**: Smart time slot recommendations
- **Drag & Drop**: Event moving, resizing
- **Multi-select**: Bulk event operations
- **Keyboard Shortcuts**: Power user navigation

## ⚠️ Layout Issues & Recommendations

### Foundation Constraints (CANNOT CHANGE)
- **Horizontal Layout**: 12-month requirement immutable
- **Month Structure**: January-December ordering fixed
- **Grid System**: 42-column layout required
- **Visual Elements**: Week headers, month labels, year header required

### Current Issues
- **Mobile Usability**: Horizontal layout challenging on mobile
- **Performance**: Large calendar grid with many events
- **Navigation**: Month jumping not intuitive
- **Empty States**: No defined empty calendar state

### Recommended Improvements (NON-FOUNDATION)
1. **Mobile Adaptation**: Touch-optimized horizontal scrolling
2. **Performance**: Implement virtualization for event rendering
3. **Navigation**: Add month jump controls and search
4. **Empty States**: Design engaging empty calendar experience

## 📊 Performance Impact

### Rendering Performance (CRITICAL)
- **Large Grid**: 42-column CSS grid with 365+ cells
- **Event Rendering**: Multiple events per cell
- **Scroll Performance**: Horizontal scrolling optimization needed
- **Memory Usage**: Large calendar data structure

### Foundation Performance
- **Immutable Structure**: Cannot optimize foundation rendering
- **Event Layer**: Additional rendering layer for events
- **Animation Impact**: Smooth scrolling and transitions
- **Bundle Size**: Large calendar component impact

## 🔗 Related Surfaces
- **Event Creation**: Modal/dialog for event details
- **AI Scheduling**: AI assistant integration
- **Settings**: Calendar preferences and views
- **Analytics**: Calendar usage and performance metrics

## 📝 Notes & Observations
- **FOUNDATION STATUS**: LinearCalendarHorizontal is locked and cannot be modified
- **CORE IDENTITY**: Horizontal 12-month layout is the primary product differentiator
- **PERFORMANCE CRITICAL**: Large calendar grid requires careful optimization
- **MOBILE CHALLENGE**: Horizontal layout difficult on small screens
- **USER EXPECTATION**: Familiar calendar patterns expected
- **INTEGRATION POINT**: Multiple calendar providers feed into this view
- **AI INTEGRATION**: Smart scheduling overlays on calendar grid
