import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';

// eslint-plugin-boundaries v6: a dependency target is `{ to: { type, internalPath } }`.
// `internalPath` enforces each slice's public API — a cross-slice import must hit the
// barrel (index) or the RSC-only server entry; intra-slice imports are INTERNAL and
// skipped by the rule. shared is segment-structured, so its entries are flat; the
// other layers allow a nested index (grouped slices, e.g. features/auth/login).
const SHARED_ENTRY = ['index.ts', 'server.ts', 'env.ts'];
const SLICE_ENTRY = ['**/index.ts', '**/server.ts'];
const to = (...types) =>
  types.map((type) => ({
    to: { type, internalPath: type === 'shared' ? SHARED_ENTRY : SLICE_ENTRY },
  }));

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
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
      'boundaries/include': ['src/**/*'],
      // `mode: 'folder'` so every file in a slice shares one elementPath — that
      // makes intra-slice imports INTERNAL (which `boundaries/dependencies` skips
      // by default), while cross-slice imports still resolve to the slice and hit
      // the `internalPath` entry-point check above. shared is captured per-segment
      // (api/config/ui) so each segment's barrel is its public entry. Layer-direction
      // matching is by `type`, unaffected.
      'boundaries/elements': [
        { mode: 'folder', type: 'app', pattern: 'src/app' },
        {
          mode: 'folder',
          type: 'views',
          pattern: 'src/views/*',
          capture: ['view'],
        },
        {
          mode: 'folder',
          type: 'widgets',
          pattern: 'src/widgets/*',
          capture: ['widget'],
        },
        {
          mode: 'folder',
          type: 'features',
          pattern: 'src/features/*',
          capture: ['feature'],
        },
        {
          mode: 'folder',
          type: 'entities',
          pattern: 'src/entities/*',
          capture: ['entity'],
        },
        {
          mode: 'folder',
          type: 'shared',
          pattern: 'src/shared/*',
          capture: ['segment'],
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: [{ type: 'app' }],
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
              from: [{ type: 'views' }],
              allow: to('views', 'widgets', 'features', 'entities', 'shared'),
            },
            {
              from: [{ type: 'widgets' }],
              allow: to('widgets', 'features', 'entities', 'shared'),
            },
            {
              from: [{ type: 'features' }],
              allow: to('features', 'entities', 'shared'),
            },
            { from: [{ type: 'entities' }], allow: to('entities', 'shared') },
            { from: [{ type: 'shared' }], allow: to('shared') },
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
