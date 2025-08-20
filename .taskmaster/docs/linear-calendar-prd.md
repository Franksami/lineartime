# Product Requirements Document (PRD)

## 1. Overview / Purpose

Create a tool called the Linear Calendar—a year-at-a-glance, visual and linear representation of time that empowers users to plan, reflect, and collaborate beyond traditional calendar interfaces. The tool should work both physically (printable) and digitally, with deep integration into modern note-taking and calendar ecosystems (Obsidian, Notion, Google Calendar, etc.). It functions as both a planning and reflection platform, illuminating overlaps, timelines, and workload at a glance.

## 2. Target Users & Use Cases

| User Type | Use Case |
|---|---|
| Creators & Knowledge Workers | Planning launches, courses, writing efforts |
| Teams | Coordinating workshop schedules, sabbaticals, sales periods |
| Individuals | Mapping personal dates and travel alongside commitments |
| Plugin Developers | Building community-powered visualization tools for Obsidian |

## 3. Key Features

### A. Input & Markdowns
- Personal Dates: birthdays, anniversaries, holidays, travel.
- Work Dates: deadlines, launch dates, significant milestones.
- Active Efforts: ongoing tasks or projects that span periods (e.g., "Writing Book," "Workshop Prep").
- Catch-all approach: support repeatable events and freeform durations.

### B. Visualization
- Linear Year Grid: A continuous view displaying all 12 months with visible weekdays, forming a single scroll-free snapshot.
- Overlap Detection: Visual cues or highlights showing when multiple high-effort items cluster together.
- Filtering Modes:
  - Static overview (all layers)
  - Personal-only
  - Work-only
  - Efforts-only
  - Knowledge/notes view (see notes created over time)
- Adjustable Views:
  - Zoom in/out on timeline or switch layouts (vertical/horizontal).
  - Alternative data visualizations (density heatmaps, bandwidth budgets).

### C. Editing & Flexibility
- Physical Mode: Printable layout (8.5×11 or 11×17) with support for penciling in/out.
- Digital Mode:
  - Drag & drop events
  - Editable durations and metadata
  - Undo/erase functionality for cancellation or rescheduling
  - Visual cues for tentative vs confirmed events.

### D. Reflection Workflow
Embed prompts that encourage planning reflection:
- What’s missing?
- What’s overly clustered or unrealistic?
- What can be rescheduled or canceled?
- What decisions must be made now (e.g., "launch later in the year")

### E. Collaboration (Team Mode)
- Shared calendar versions (akin to Miro boards).
- Commenting/annotations per item or date.
- Color coding by person or category.
- Weekly team orientation view (static but collaboratively updated).

### F. Integrations
- Obsidian Plugin: Markdown-based entries sync with daily/weekly notes. Visual display of all notes produced in a year.
- Notion: Sync events/efforts with Notion databases (cards, timeline, etc.).
- Google Calendar / ClickUp / Others: Import or two-way sync events, deadlines, travel dates.

## 4. Technical Requirements
- Data Model: JSON or Markdown schema defining events with fields:
  - Type (personal, work, effort)
  - Title
  - Start/End dates
  - Metadata/tags
  - Notes/comments
  - Status (tentative, confirmed, canceled)
- UI Components:
  - Year grid renderer with date cells
  - Click/hover pop-ups for event details
  - Filtering panel and toggle controls
  - Edit/drag UI for events
- Plugin API Hooks:
  - For Obsidian: File-based event detection, UI panel integration, plugin settings
  - For Notion: Use Notion API to fetch/update event database
  - For Google Calendar: OAuth + Calendar API to import/export events

## 5. User Interface (Wireframe Outline)
1. Main Year View:
  - Full-grid display with color-coded blocks for events/efforts.
2. Side Panel / Filter Controls:
  - Toggle categories (Personal, Work, Efforts, Notes)
  - Add event button with modal for event details
3. Reflection Overlay:
  - Light modal pop-up with reflection questions mid-use or upon save
4. Detail Pop-up:
  - Expandable card to edit metadata or add comments
5. View Switch Controls:
  - Zoom Buttons (in/out)
  - Orientation (horizontal / vertical)
  - View type (static / filtered / notes overlay)

## 6. Development Phases

### Phase 1 – MVP
- Build static year grid with manual entry of Personal, Work, Efforts.
- Filtering by type.
- Editable durations and metadata.
- Basic reflections prompts.

### Phase 2
- Event clustering detection.
- Drag-and-drop UI.
- View filtering enhancements.
- Printable version generation.
- Obsidian plugin scaffold (local note integration).

### Phase 3
- Integrations with Notion & Google Calendar.
- Collaboration: shared views, comments.
- Knowledge timeline overlay (notes view).
- Custom visual experimentation (heatmap, bandwidth graph).

## 7. Success Metrics
- Ability to spot conflicting timelines within 3 seconds.
- Users report fewer scheduling conflicts or workload clustering.
- Plugin adoption: Downloads and active installs for Obsidian plugin.
- Positive feedback on ease of adjusting large-scale yearly plans.
