# Create Custom Hook

Create a custom React hook: $ARGUMENTS

Steps:

1. Read `CLAUDE.md` for conventions
2. Create the hook file in `src/hooks/` with camelCase naming: `useHookName.ts`
3. Follow these rules:
   - Prefix with `use` (React convention)
   - Add "use client" comment since hooks only work in Client Components
   - Define proper TypeScript types for parameters and return values
   - Handle loading, error, and success states where applicable
   - Clean up side effects in useEffect return functions
   - Use useCallback for stable function references passed to children
   - Memoize expensive computations with useMemo
4. Export as named export: `export function useHookName()`
5. Document the hook's purpose with a brief JSDoc comment
6. Verify compilation: `npx tsc --noEmit`

Common hooks for this project:
- useDebounce — for search input debouncing
- useInfiniteScroll — for paginated video grids
- useVideoPlayer — for HLS.js player control
- useMediaQuery — for responsive behavior
