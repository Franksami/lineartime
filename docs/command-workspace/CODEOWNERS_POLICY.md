# CODEOWNERS Policy (Guidance)

Use this policy to protect critical boundaries and require the right teams to review changes.

```
# Shell & layout
/src/components/shell/**        @fe-platform

# Views
/src/views/**                   @calendar-team @productivity-team

# Calendar legacy (limited to Year Lens wrapping only)
/src/components/calendar/**     @calendar-team

# AI & CV
/src/lib/ai/**                  @ai-team
/src/lib/cv/**                  @ai-team @security

# Docs
/docs/command-workspace/**      @fe-platform @product-team
```

Notes:
- Keep `views/year-lens/*` separate from the shell and other views.
- Require security review for any CV/consent/AI auditing changes.
