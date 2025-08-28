# Governance Enforcement

This document captures concrete examples for lint, dependency boundaries, CI guardrails, and TS path hygiene to prevent drift from the Command Workspace architecture.

## ESLint / Biome: ban legacy imports
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/components/calendar/LinearCalendarHorizontal",
            "message": "Use only inside views/year-lens/* as an optional lens."
          }
        ],
        "patterns": [
          {
            "group": ["@/components/calendar/LinearCalendarHorizontal*"],
            "message": "Year Lens only. Do not import in shell or other views."
          }
        ]
      }
    ]
  }
}
```

## dependency-cruiser: forbid cross-boundary imports
```json
{
  "forbidden": [
    {
      "name": "ban-linear-horizontal",
      "from": { "pathNot": "^src/views/year-lens" },
      "to":   { "path": "^src/components/calendar/LinearCalendarHorizontal" },
      "severity": "error"
    },
    {
      "name": "shell-boundary",
      "from": { "path": "^src/views" },
      "to":   { "path": "^src/components/shell", "via": { "moreThanOneLevel": true } },
      "comment": "Views must not deep-import into shell internals."
    }
  ]
}
```

## CI grep: block accidental legacy imports
```bash
rg --fixed-strings "@/components/calendar/LinearCalendarHorizontal" --glob '!src/views/year-lens/**' src \
  && echo "BANNED legacy import found" && exit 1 || true
```

## TypeScript path hygiene
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shell/*": ["src/components/shell/*"],
      "@views/*": ["src/views/*"],
      "@dock/*":  ["src/components/dock/*"],
      "@cmd/*":   ["src/components/commands/*"],
      "@omni/*":  ["src/components/omnibox/*"],
      "@ai/*":    ["src/lib/ai/*"],
      "@cv/*":    ["src/lib/cv/*"]
    }
  }
}
```

## CODEOWNERS (policy skeleton)
```
/src/components/shell/**        @fe-platform
/src/views/**                   @calendar-team @productivity-team
/src/components/calendar/**     @calendar-team
/src/lib/ai/**                  @ai-team
/src/lib/cv/**                  @ai-team @security
```
