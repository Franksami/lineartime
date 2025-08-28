# Notion Workspace Patterns — Research Notes

## Summary
- Tri-pane shell pattern is common in complex Notion setups (sidebar, page canvas, right properties panel).
- Command palette / slash commands drive fast creation and transformation.
- Split panes enable parallel context; properties panel exposes metadata consistently.

## Citations (to be populated after crawl)
- [TBD] Official Notion docs for slash commands
- [TBD] Official/credible docs for database properties (right panel)
- [TBD] Credible analysis of split panes usage in Notion

## Design Implications
- Keep command-first palette and omnibox; ensure both discoverable.
- Maintain a right-side properties/details panel as the stable context area.
- Allow split panes in the shell; use tabs + split model.

## Acceptance Criteria Updates
- Shell must support split panes and a right-side properties panel.
- Palette + omnibox cover create/edit/link operations.
