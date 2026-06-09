const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'revert',
        'build',
        'ci',
        'perf',
      ],
    ],
    // Optional scope, but if present it must name an FSD layer / area.
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'views',
        'widgets',
        'features',
        'entities',
        'shared',
        'config',
        'deps',
        'release',
      ],
    ],
  },
};

export default config;
