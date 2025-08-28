# Research Tooling (Firecrawl primary, Apify fallback)

## Purpose
Define consistent, repeatable research runs to validate shell/layout/AI/CV patterns and to source citations for the PRD.

## Tooling
- Primary: Firecrawl MCP (preferred for clean Markdown + main-content extraction)
- Fallback: Apify (Actors/SDK) for site snapshots and markdown/text extraction

## Queries (topics)
1) Notion workspace: tri‑pane shell, command palette, right properties, split view
2) Cron/Notion Calendar: keyboard‑first, minimal UI, command/creation shortcuts
3) Motion: AI scheduling automation, conflict repair UX
4) Sunsama: daily/weekly ritual planning patterns
5) Obsidian: panes/splits + backlinks graph
6) AI in workspaces: contextual AI, omnibox/smart blocks patterns
7) CV privacy consent: visible indicators, modes, local‑only best practices

## Storage
Save artifacts under `docs/command-workspace/research/`:
- `notion_workspace_patterns.md`
- `cron_keyboard_calendar.md`
- `motion_scheduling_automation.md`
- `sunsama_ritual_planning.md`
- `obsidian_panes_backlinks.md`
- `ai_workspace_integrations.md`
- `cv_privacy_consent_patterns.md`

Each file:
- Summary bullets
- 3–7 citations (URL + short quote)
- Design implications
- Acceptance criteria updates (if any)

## PRD Updates
- Append a "References & Tooling" appendix to ULTIMATE_COMPREHENSIVE_PRD.md
- Inline footnotes in relevant sections if strong citations discovered
