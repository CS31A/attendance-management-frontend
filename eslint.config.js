import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  ignores: [
    '.serena/**',
    '**/*.md',
    '**/dist/**',
    '**/node_modules/**',
    'graphify-out/**',
    '**/graphify-out/**',
  ],
  rules: {
    'no-alert': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'regexp/no-super-linear-backtracking': 'off',
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
