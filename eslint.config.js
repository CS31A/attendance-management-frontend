import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  ignores: [
    '**/*.md',
    '**/dist/**',
    '**/node_modules/**',
  ],
  rules: {
    'no-alert': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
})
