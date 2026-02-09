# Install Package

Install and configure the npm package: $ARGUMENTS

Steps:

1. Determine if production or dev dependency
2. Install: `npm install <package>` or `npm install -D <package>`
3. Install TypeScript types if needed: `npm install -D @types/<package>`
4. Create config files if needed
5. Add environment variables to `.env` if required
6. Create wrapper/utility in `src/lib/` if initialization needed
7. Show usage example following project conventions
8. Verify: `npx tsc --noEmit`
