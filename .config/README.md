# Configuration Files

This directory contains project configuration files for various tools and linters.

## Files

- `.prettierrc` - Prettier code formatting configuration
- `eslint.config.mjs` - ESLint linting rules (in root for Next.js compatibility)
- `tailwind.config.ts` - Tailwind CSS configuration (in root for Next.js compatibility)
- `tsconfig.json` - TypeScript configuration (in root for Next.js compatibility)
- `next.config.ts` - Next.js configuration (in root for Next.js compatibility)

## Notes

Some configuration files remain in the root directory because they need to be accessible to their respective tools:
- Next.js requires `next.config.ts` in root
- TypeScript requires `tsconfig.json` in root
- Tailwind requires `tailwind.config.ts` in root
- ESLint requires `eslint.config.mjs` in root

## Maintenance

- Update configurations when tool versions change
- Keep formatting rules consistent across tools
- Test configurations after major updates
