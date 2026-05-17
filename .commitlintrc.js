/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',    // new feature
        'fix',     // bug fix
        'docs',    // documentation only
        'style',   // formatting, no logic change
        'refactor',// code change, not feat/fix
        'test',    // adding/updating tests
        'chore',   // build process, tooling
        'perf',    // performance improvement
        'ci',      // CI/CD configuration
        'revert',  // revert a previous commit
      ],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
    'footer-max-line-length': [2, 'always', 200],
  },
};
