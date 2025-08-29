# Routing & Deep Links

## Overview
All product surfaces render inside the Command Workspace shell at `/app`. Views, filters, selected entities, and dock panels are controlled via URL parameters to enable deep-linking, shareable state, and predictable navigation.

## Entry Points
- Primary entry: `/app`
- Saved layouts: `/app/layouts/:layoutId`
- Deep entity link: `/entity/:type/:id` (redirects to `/app` and activates Details panel)

## URL Parameters (Query Schema)
- `view`: `week | day | monthStrip | quarter | planner | notes | mailbox | automations | yearLens`
- `date`: ISO date (e.g., `2025-03-15`)
- `range`: `this-week | this-month | this-quarter | YYYY-Www | YYYY-MM`
- `panel`: `ai | details | conflicts | capacity | backlinks | none`
- `project`: project id/slug (filters view content)
- `entityType`: optional for direct selection (e.g., `event | task | note | emailThread | project | automation`)
- `entityId`: id of the selected entity (opens Details panel)
- `split`: truthy flag or serialized split spec (optional)
- `filters`: serialized filter string (optional)

Examples:
- `/app?view=week&date=2025-03-15&panel=ai`
- `/app?view=planner&project=alpha`
- `/app?view=mailbox&panel=details&entityType=emailThread&entityId=thrd_123`

## Shell Behavior
- The shell initializes from URL params; state changes (active tab, view switch, panel toggle) update the URL.
- Back/forward buttons restore shell state from URL without full reloads.
- Split state is optional; when present, it serializes which views are split and their sizes.

## Deep Links
### `/entity/:type/:id`
- Server handler resolves the entity and redirects to `/app` with:
  - `view`: chosen by resolver (e.g., `week` for Event, `planner` for Task, `notes` for Note, `mailbox` for EmailThread)
  - `panel=details`, `entityType`, `entityId`
  - optional `date`/`range` when applicable (e.g., events)

Example redirect:
- `/entity/event/evt_42` → `/app?view=week&date=2025-03-15&panel=details&entityType=event&entityId=evt_42`

## Legacy Redirects
- Any legacy calendar routes redirect to `/app?view=week`.
- Legacy deep routes map to `/app` with appropriate `panel=details`, `entityType`, `entityId`.

## Saved Layouts
- `/app/layouts/:layoutId` loads:
  - Active tabs (views and their params)
  - Split configuration
  - Dock panel visibility
- Layouts are read-only by default when shared; editing requires permissions.

## View Activation Rules
- `week | day | monthStrip | quarter`: date or range required; default to current period if missing.
- `planner`: accepts `project`, `filters`.
- `notes`: opens last note or blank; `entityId` opens the specified note.
- `mailbox`: supports `filters` (labels, participants) and `entityId` for thread focus.
- `automations`: may accept `entityId` for a specific automation.
- `yearLens`: off by default; only when explicitly enabled via feature flag.

## Panel Activation Rules
- `panel=details`: requires `entityType` and `entityId`.
- `panel=ai | conflicts | capacity | backlinks`: opens corresponding dock panel regardless of selection.
- `panel=none`: closes dock panels.

## SSR/CSR Considerations
- Initial route parsing can occur server-side for SEO-neutral hydration; the shell should reconcile on the client.
- Avoid blocking SSR on AI/CV or heavy data; lazy load panels and fetch view data client-side with suspense boundaries.

## Error Handling
- Invalid `view` falls back to `week`.
- Missing/invalid `entityId` with `panel=details` closes the panel and logs a warning.
- Conflicting params (e.g., `date` with `notes` view) are ignored with non-blocking warnings.

## Feature Flags Integration
- `views.yearLens` must be ON to allow `view=yearLens`, otherwise redirect to `view=week`.
- `omnibox.enabled`: when off, the Omnibox routes are inert; palette remains available.

## Analytics Events
- `shell.open` with parsed params
- `view.change` with from→to details
- `panel.toggled` with panel id
- `deeplink.opened` with `entityType`, `entityId`

## Security
- Validate and sanitize all query params server-side before rendering redirects.
- Never expose provider tokens via URL; do not include sensitive data in query strings.
