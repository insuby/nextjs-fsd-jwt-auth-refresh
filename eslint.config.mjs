import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';

// eslint-plugin-boundaries v7: policies use ENTITY selectors — `{ element: {...} }` —
// and the public-API check is `fileInternalPath` (v6's flat `internalPath`).
// It enforces each slice's public API: a cross-slice import must hit the barrel
// (index) or the RSC-only server entry; intra-slice imports are INTERNAL and skipped
// by the rule. shared is segment-structured, so its entries are flat; the other layers
// allow a nested index (grouped slices, e.g. features/auth/login).
const SHARED_ENTRY = ['index.ts', 'server.ts', 'env.ts'];
const SLICE_ENTRY = ['**/index.ts', '**/server.ts'];
const target = (type) => ({
  element: {
    type,
    fileInternalPath: type === 'shared' ? SHARED_ENTRY : SLICE_ENTRY,
  },
});
const to = (...types) => ({ to: types.map(target) });

const eslintConfig = [
  // eslint-config-next 16 ships a native flat config array (base + core-web-vitals,
  // incl. @next, react, react-hooks, jsx-a11y, import, typescript-eslint). Spread
  // it directly — no FlatCompat needed (that's what broke on the Next 16 bump).
  ...nextCoreWebVitals,

  // Relaxations carried over from the previous config.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },

  // --- FSD layer boundaries (import direction enforcement) ---
  // A file may import only from layers strictly below it.
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'proxy.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
      // Include the root routing shell (app/) and proxy.ts too, so they're held
      // to the same public-API rules — not just src/.
      'boundaries/include': ['src/**/*', 'app/**/*.{ts,tsx}', 'proxy.ts'],
      // Folder matching is the v7 default: every file in a slice shares one
      // elementPath, which makes intra-slice imports INTERNAL (skipped by
      // `boundaries/dependencies`), while cross-slice imports still resolve to the
      // slice and hit the `fileInternalPath` entry-point check above. shared is
      // captured per-segment (api/config/ui) so each segment's barrel is its public
      // entry. Layer-direction matching is by `type`, unaffected.
      'boundaries/elements': [
        // Root routing shell: Next's app/ + proxy.ts. Sits above the FSD layers
        // (re-exports views, mounts providers, gates sessions) and may import any
        // layer — subject to the same public-API checks below.
        //
        // `mode: 'full'` is kept deliberately, despite the v7 deprecation notice.
        // The suggested replacement, `partialMatch: false`, is only read by v7.2's
        // validation code — the matcher ignores it, so the descriptor falls back to
        // folder mode, `app/**` files stop being classified as `root`, and this rule
        // silently stops enforcing anything. Re-check on the next minor; until the
        // matcher honours `partialMatch`, `mode` stays. Verify with a probe file that
        // deep-imports a slice from `app/` — it must error.
        {
          mode: 'full',
          type: 'root',
          pattern: ['app/**/*.{ts,tsx}', 'proxy.ts'],
        },
        { type: 'app', pattern: 'src/app' },
        { type: 'views', pattern: 'src/views/*', capture: ['view'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['widget'] },
        // Grouped feature slices (features/<group>/<slice>) must each be their OWN
        // element — the more specific `*/*` pattern is listed first so sibling
        // slices in a group (e.g. auth/login vs auth/logout) don't collapse into
        // one element and let deep imports bypass each other's public API.
        {
          type: 'features',
          pattern: 'src/features/*/*',
          capture: ['group', 'feature'],
        },
        { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['entity'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['segment'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // A layer may import only from layers strictly BELOW it — never from a
          // sibling slice on the same layer (so the self-type is intentionally
          // absent from every allow-list except `shared`, whose segments compose).
          policies: [
            {
              from: { element: { type: 'root' } },
              allow: to(
                'app',
                'views',
                'widgets',
                'features',
                'entities',
                'shared',
              ),
            },
            {
              from: { element: { type: 'app' } },
              allow: to('views', 'widgets', 'features', 'entities', 'shared'),
            },
            {
              from: { element: { type: 'views' } },
              allow: to('widgets', 'features', 'entities', 'shared'),
            },
            {
              from: { element: { type: 'widgets' } },
              allow: to('features', 'entities', 'shared'),
            },
            {
              from: { element: { type: 'features' } },
              allow: to('entities', 'shared'),
            },
            { from: { element: { type: 'entities' } }, allow: to('shared') },
            { from: { element: { type: 'shared' } }, allow: to('shared') },
          ],
        },
      ],
    },
  },

  // eslint-config-prettier MUST be last — turns off formatting rules.
  prettier,

  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      'node_modules/**',
    ],
  },
];

export default eslintConfig;
