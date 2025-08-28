# Keyboard Maps & Command Registry

## Global Shortcuts
- ⌘/Ctrl-K: Open Command Palette
- ⌘/Ctrl-P: Focus Omnibox
- ⌘/Ctrl-[ / ⌘/Ctrl-]: Previous/Next Tab
- ⌘/Ctrl-.: Split/Unsplit view
- Esc: Close panel/modals

## Week/Day View
- Arrow keys: Navigate cells
- Enter/Space: Select/open create/edit
- D: Go to Today
- G then W/D/M/Q/Y: Switch to Week/Day/MonthStrip/Quarter/YearLens

## Planner View
- Enter: Edit task
- Cmd/Ctrl-↑/↓: Change priority
- L: Link to…

## Notes View
- ⌘/Ctrl-B/I/U: Bold/Italic/Underline
- ⌘/Ctrl-K: Insert link (inside editor)
- /: Slash menu (blocks)

## Mailbox View
- J/K: Next/Prev thread
- Enter: Open thread
- E: Convert to task
- R: Reply (draft)

---

## Command Registry (Examples)

### Navigation
- `navigate.view.change(view, params?)`
- `navigate.entity.open(type, id)`

### Create
- `create.event({ title, start, end, attendees, projectId })`
- `create.task({ title, due, estimate, projectId, priority })`
- `create.note({ title, template? })`

### Link
- `link.entities({ from: {type,id}, to: {type,id}, type })`

### Tools (AI/MCP)
- `runTool.calendar.resolveConflicts({ range, policy })`
- `runTool.tasks.autoSchedule({ tasks[], constraints })`
- `runTool.mail.draftReply({ threadId, tone })`
- `runTool.notes.summarize({ noteId, length })`

### Panels
- `toggle.panel.ai`
- `toggle.panel.details`
- `toggle.panel.conflicts`
- `toggle.panel.capacity`
- `toggle.panel.backlinks`

---

## Omnibox Intents (Examples)
- Create Event: “meet Dan Tue 3pm 45m @sales #client-x”
- Create Task: “prep Q2 deck by Fri #ops 90m”
- Summarize Thread: “summarize this thread and draft a friendly reply”
- Auto Schedule: “spread these 6 tasks across next week mornings”
- Link: “link this note to client-x thread and Q2 plan”
- Resolve Conflicts: “fix overlaps this Wed; prefer shifting internal meetings”

Confidence routing:
- ≥0.8 auto‑run (non‑destructive) else confirm; below → show top‑3 options.
